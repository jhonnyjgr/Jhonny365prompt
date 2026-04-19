import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';
import firebaseConfig from './firebase-applet-config.json' assert { type: 'json' };

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

const db = admin.firestore();
const auth = admin.auth();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Middleware to authenticate via Firebase ID Token
  const authenticate = async (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No autorizado' });
    try {
      const decodedToken = await auth.verifyIdToken(token);
      const userDoc = await db.collection('users').doc(decodedToken.uid).get();
      if (!userDoc.exists) {
        return res.status(401).json({ error: 'Usuario no encontrado en base de datos' });
      }
      req.user = { id: decodedToken.uid, ...userDoc.data() };
      next();
    } catch (error) {
      res.status(401).json({ error: 'Token inválido' });
    }
  };

  // --- Prompt Routes ---
  app.get('/api/prompts', async (req, res) => {
    try {
      const { category, search, order, isVip } = req.query;
      let query: any = db.collection('prompts').where('isPublic', '==', true);

      if (category && category !== 'Todas') {
        query = query.where('category', '==', category);
      }
      if (isVip === 'true') {
        query = query.where('isVip', '==', true);
      }

      const snapshot = await query.get();
      let prompts = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

      // Client-side search (Firestore doesn't support partial text search well without extra tools)
      if (search) {
        const s = (search as string).toLowerCase();
        prompts = prompts.filter((p: any) => 
          p.title.toLowerCase().includes(s) || p.content.toLowerCase().includes(s)
        );
      }

      // Order
      if (order === 'popular') {
        prompts.sort((a: any, b: any) => b.copyCount - a.copyCount);
      } else {
        prompts.sort((a: any, b: any) => b.createdAt._seconds - a.createdAt._seconds);
      }

      // Populate author info
      const authorIds = [...new Set(prompts.map((p: any) => p.authorId))];
      const authors: any = {};
      await Promise.all(authorIds.map(async (id: any) => {
        const adoc = await db.collection('users').doc(id).get();
        if (adoc.exists) authors[id] = adoc.data();
      }));

      prompts = prompts.map((p: any) => ({
        ...p,
        author: authors[p.authorId] || { username: 'Desconocido' }
      }));

      res.json(prompts);
    } catch (error) {
      console.error('Fetch prompts error:', error);
      res.status(500).json({ error: 'Error al obtener prompts' });
    }
  });

  app.post('/api/prompts', authenticate, async (req: any, res) => {
    try {
      const { title, content, category, isPublic, isVip } = req.body;
      const docRef = await db.collection('prompts').add({
        title,
        content,
        category,
        isPublic: isPublic !== undefined ? isPublic : true,
        isVip: isVip !== undefined ? isVip : false,
        authorId: req.user.id,
        copyCount: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      res.json({ id: docRef.id });
    } catch (error) {
      console.error('Create prompt error:', error);
      res.status(500).json({ error: 'Error al crear prompt' });
    }
  });

  app.patch('/api/prompts/:id/copy', async (req, res) => {
    try {
      await db.collection('prompts').doc(req.params.id).update({
        copyCount: admin.firestore.FieldValue.increment(1)
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar copias' });
    }
  });

  app.delete('/api/prompts/:id', authenticate, async (req: any, res) => {
    try {
      const promptDoc = await db.collection('prompts').doc(req.params.id).get();
      if (!promptDoc.exists) return res.status(404).json({ error: 'No encontrado' });
      const prompt = promptDoc.data();
      if (prompt?.authorId !== req.user.id && req.user.role !== 'Admin VIP') {
        return res.status(403).json({ error: 'No tienes permiso' });
      }
      await db.collection('prompts').doc(req.params.id).delete();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar prompt' });
    }
  });

  // --- Chat Routes ---
  app.get('/api/messages/:otherId', authenticate, async (req: any, res) => {
    try {
      const user1Id = req.user.id < req.params.otherId ? req.user.id : req.params.otherId;
      const user2Id = req.user.id < req.params.otherId ? req.params.otherId : req.user.id;
      const convId = `${user1Id}_${user2Id}`;
      
      const snapshot = await db.collection('conversations').doc(convId).collection('messages')
        .orderBy('createdAt', 'asc').get();
      
      const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Mark as read
      const unread = snapshot.docs.filter(doc => doc.data().senderId === req.params.otherId && !doc.data().isRead);
      await Promise.all(unread.map(doc => doc.ref.update({ isRead: true })));

      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener mensajes' });
    }
  });

  app.post('/api/messages', authenticate, async (req: any, res) => {
    try {
      const { receiverId, content } = req.body;
      const user1Id = req.user.id < receiverId ? req.user.id : receiverId;
      const user2Id = req.user.id < receiverId ? receiverId : req.user.id;
      const convId = `${user1Id}_${user2Id}`;
      
      const convRef = db.collection('conversations').doc(convId);
      await convRef.set({
        user1Id,
        user2Id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      const msgRef = await convRef.collection('messages').add({
        content,
        senderId: req.user.id,
        receiverId,
        conversationId: convId,
        isEdited: false,
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      res.json({ id: msgRef.id });
    } catch (error) {
      res.status(500).json({ error: 'Error al enviar mensaje' });
    }
  });

  app.get('/api/conversations', authenticate, async (req: any, res) => {
    try {
      const snapshot1 = await db.collection('conversations').where('user1Id', '==', req.user.id).get();
      const snapshot2 = await db.collection('conversations').where('user2Id', '==', req.user.id).get();
      
      const convDocs = [...snapshot1.docs, ...snapshot2.docs];
      const conversations = await Promise.all(convDocs.map(async doc => {
        const data = doc.data();
        const otherId = data.user1Id === req.user.id ? data.user2Id : data.user1Id;
        const otherDoc = await db.collection('users').doc(otherId).get();
        const lastMsgSnap = await doc.ref.collection('messages').orderBy('createdAt', 'desc').limit(1).get();
        return {
          id: doc.id,
          ...data,
          user1: data.user1Id === req.user.id ? req.user : otherDoc.data(),
          user2: data.user2Id === req.user.id ? req.user : otherDoc.data(),
          messages: lastMsgSnap.docs.map(m => m.data())
        };
      }));

      conversations.sort((a: any, b: any) => (b.updatedAt?._seconds || 0) - (a.updatedAt?._seconds || 0));
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener conversaciones' });
    }
  });

  app.get('/api/users/directory', authenticate, async (req: any, res) => {
    try {
      const snapshot = await db.collection('users').get();
      let users = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((u: any) => u.id !== req.user.id);

      const { search } = req.query;
      if (search) {
        users = users.filter((u: any) => u.username.toLowerCase().includes((search as string).toLowerCase()));
      }
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener directorio' });
    }
  });

  // --- Admin Routes ---
  app.get('/api/admin/users', authenticate, async (req: any, res) => {
    if (req.user.role !== 'Admin VIP') return res.status(403).json({ error: 'Solo admins' });
    const snapshot = await db.collection('users').get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(users);
  });

  app.post('/api/admin/vip', authenticate, async (req: any, res) => {
    if (req.user.role !== 'Admin VIP') return res.status(403).json({ error: 'Solo admins' });
    const { userId, days, permanent } = req.body;
    const vipUntil = permanent ? null : admin.firestore.Timestamp.fromDate(new Date(Date.now() + days * 24 * 60 * 60 * 1000));
    await db.collection('users').doc(userId).update({
      role: 'VIP',
      vipUntil
    });
    res.json({ success: true });
  });

  app.delete('/api/admin/users/:id', authenticate, async (req: any, res) => {
    if (req.user.role !== 'Admin VIP') return res.status(403).json({ error: 'Solo admins' });
    await auth.deleteUser(req.params.id);
    await db.collection('users').doc(req.params.id).delete();
    res.json({ success: true });
  });

  app.post('/api/admin/users/:id/reset-password', authenticate, async (req: any, res) => {
    if (req.user.role !== 'Admin VIP') return res.status(403).json({ error: 'Solo admins' });
    const { newPassword } = req.body;
    await auth.updateUser(req.params.id, { password: newPassword });
    res.json({ success: true });
  });

  // Stats
  app.get('/api/stats', async (req, res) => {
    const userSnapshot = await db.collection('users').get();
    const promptSnapshot = await db.collection('prompts').get();
    let totalCopies = 0;
    promptSnapshot.docs.forEach(doc => {
      totalCopies += doc.data().copyCount || 0;
    });
    res.json({
      userCount: userSnapshot.size,
      promptCount: promptSnapshot.size,
      totalCopies
    });
  });

  // Vite Middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

