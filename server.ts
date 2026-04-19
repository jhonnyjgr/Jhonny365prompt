import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from './src/lib/prisma.ts';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'jhonny_prompt_365_secret';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- Auth Routes ---
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { username, password: hashedPassword },
      });
      const token = jwt.sign({ userId: user.id }, JWT_SECRET);
      res.json({ user, token });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(400).json({ error: 'El usuario ya existe o los datos son inválidos' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await prisma.user.findUnique({ where: { username } });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
      const token = jwt.sign({ userId: user.id }, JWT_SECRET);
      res.json({ user, token });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Error del servidor' });
    }
  });

  // Middleware to authenticate
  const authenticate = async (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No autorizado' });
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (!user) throw new Error();
      req.user = user;
      next();
    } catch {
      res.status(401).json({ error: 'Token inválido' });
    }
  };

  // --- Prompt Routes ---
  app.get('/api/prompts', async (req, res) => {
    try {
      const { category, search, order, isVip } = req.query;
      const where: any = {};
      if (category) where.category = category as string;
      if (search) {
        where.OR = [
          { title: { contains: search as string } },
          { content: { contains: search as string } },
        ];
      }
      if (isVip === 'true') where.isVip = true;
      else if (isVip === 'false') where.isVip = false;

      const prompts = await prisma.prompt.findMany({
        where,
        orderBy: order === 'popular' ? { copyCount: 'desc' } : { createdAt: 'desc' },
        include: { author: { select: { username: true, role: true, profilePic: true } } },
      });
      res.json(prompts);
    } catch (error) {
      console.error('Fetch prompts error:', error);
      res.status(500).json({ error: 'Error al obtener prompts' });
    }
  });

  app.post('/api/prompts', authenticate, async (req: any, res) => {
    try {
      const { title, content, category, isPublic, isVip } = req.body;
      const prompt = await prisma.prompt.create({
        data: {
          title,
          content,
          category,
          isPublic,
          isVip,
          authorId: req.user.id,
        },
      });
      res.json(prompt);
    } catch (error) {
      console.error('Create prompt error:', error);
      res.status(500).json({ error: 'Error al crear prompt' });
    }
  });

  app.patch('/api/prompts/:id/copy', async (req, res) => {
    try {
      const prompt = await prisma.prompt.update({
        where: { id: req.params.id },
        data: { copyCount: { increment: 1 } },
      });
      res.json(prompt);
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar copias' });
    }
  });

  app.delete('/api/prompts/:id', authenticate, async (req: any, res) => {
    try {
      const prompt = await prisma.prompt.findUnique({ where: { id: req.params.id } });
      if (!prompt) return res.status(404).json({ error: 'No encontrado' });
      if (prompt.authorId !== req.user.id && req.user.role !== 'Admin VIP') {
        return res.status(403).json({ error: 'No tienes permiso' });
      }
      await prisma.prompt.delete({ where: { id: req.params.id } });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar prompt' });
    }
  });

  // --- Chat Routes ---
  app.get('/api/messages/:otherId', authenticate, async (req: any, res) => {
    try {
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: req.user.id, receiverId: req.params.otherId },
            { senderId: req.params.otherId, receiverId: req.user.id },
          ],
        },
        orderBy: { createdAt: 'asc' },
      });
      // Mark as read
      await prisma.message.updateMany({
        where: { senderId: req.params.otherId, receiverId: req.user.id, isRead: false },
        data: { isRead: true },
      });
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener mensajes' });
    }
  });

  app.post('/api/messages', authenticate, async (req: any, res) => {
    try {
      const { receiverId, content } = req.body;
      // Get or create conversation
      const user1Id = req.user.id < receiverId ? req.user.id : receiverId;
      const user2Id = req.user.id < receiverId ? receiverId : req.user.id;
      
      const conversation = await prisma.conversation.upsert({
        where: { user1Id_user2Id: { user1Id, user2Id } },
        create: { user1Id, user2Id },
        update: { updatedAt: new Date() },
      });

      const message = await prisma.message.create({
        data: {
          content,
          senderId: req.user.id,
          receiverId,
          conversationId: conversation.id,
        },
      });
      res.json(message);
    } catch (error) {
      res.status(500).json({ error: 'Error al enviar mensaje' });
    }
  });

  app.get('/api/conversations', authenticate, async (req: any, res) => {
    try {
      const conversations = await prisma.conversation.findMany({
        where: { OR: [{ user1Id: req.user.id }, { user2Id: req.user.id }] },
        include: {
          user1: { select: { id: true, username: true, profilePic: true, role: true } },
          user2: { select: { id: true, username: true, profilePic: true, role: true } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { updatedAt: 'desc' },
      });
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener conversaciones' });
    }
  });

  app.get('/api/users/directory', authenticate, async (req: any, res) => {
    try {
      const { search } = req.query;
      const users = await prisma.user.findMany({
        where: {
          id: { not: req.user.id },
          username: { contains: search as string || '' },
        },
        select: { id: true, username: true, profilePic: true, role: true },
      });
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener directorio' });
    }
  });

  // --- Admin Routes ---
  app.get('/api/admin/users', authenticate, async (req: any, res) => {
    if (req.user.role !== 'Admin VIP') return res.status(403).json({ error: 'Solo admins' });
    const users = await prisma.user.findMany();
    res.json(users);
  });

  app.post('/api/admin/vip', authenticate, async (req: any, res) => {
    if (req.user.role !== 'Admin VIP') return res.status(403).json({ error: 'Solo admins' });
    const { userId, days, permanent } = req.body;
    const vipUntil = permanent ? null : new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role: 'VIP', vipUntil },
    });
    res.json(user);
  });

  app.delete('/api/admin/users/:id', authenticate, async (req: any, res) => {
    if (req.user.role !== 'Admin VIP') return res.status(403).json({ error: 'Solo admins' });
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  });

  app.post('/api/admin/users/:id/reset-password', authenticate, async (req: any, res) => {
    if (req.user.role !== 'Admin VIP') return res.status(403).json({ error: 'Solo admins' });
    const { newPassword } = req.body;
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.params.id },
      data: { password: hashedPassword },
    });
    res.json({ success: true });
  });

  // --- Message Ops ---
  app.patch('/api/messages/:id', authenticate, async (req: any, res) => {
    try {
      const message = await prisma.message.findUnique({ where: { id: req.params.id } });
      if (!message || message.senderId !== req.user.id) return res.status(403).json({ error: 'No permitido' });
      const updated = await prisma.message.update({
        where: { id: req.params.id },
        data: { content: req.body.content, isEdited: true },
      });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Error al editar' });
    }
  });

  app.delete('/api/messages/:id', authenticate, async (req: any, res) => {
    try {
      const message = await prisma.message.findUnique({ where: { id: req.params.id } });
      if (!message || message.senderId !== req.user.id) return res.status(403).json({ error: 'No permitido' });
      await prisma.message.delete({ where: { id: req.params.id } });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar' });
    }
  });

  // Stat routes
  app.get('/api/stats', async (req, res) => {
    const userCount = await prisma.user.count();
    const promptCount = await prisma.prompt.count();
    const copySum = await prisma.prompt.aggregate({ _sum: { copyCount: true } });
    res.json({ userCount, promptCount, totalCopies: copySum._sum.copyCount || 0 });
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
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
