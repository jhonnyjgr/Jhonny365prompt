import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Crown, Key, Mail, User as UserIcon, Loader2 } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isLogin) {
        // Sign In
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        toast.success('¡Bienvenido de nuevo!');
        navigate('/');
      } else {
        // Sign Up
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const user = userCredential.user;
        
        await updateProfile(user, { displayName: formData.username });
        
        // Create user profile in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          username: formData.username,
          role: 'Regular',
          profilePic: `https://picsum.photos/seed/${user.uid}/200`,
          createdAt: serverTimestamp(),
        });

        toast.success('¡Cuentas creada exitosamente!');
        navigate('/');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      let message = 'Algo salió mal';
      if (error.code === 'auth/email-already-in-use') message = 'El email ya está registrado';
      if (error.code === 'auth/wrong-password') message = 'Contraseña incorrecta';
      if (error.code === 'auth/user-not-found') message = 'Usuario no encontrado';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
            <Crown className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Jhonny Prompt 365</h1>
          <p className="text-muted-foreground">Tu puerta de entrada al conocimiento IA</p>
        </div>

        <Tabs defaultValue="login" onValueChange={(val) => setIsLogin(val === 'login')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
            <TabsTrigger value="register">Registrarse</TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? 'login' : 'register'}
              initial={{ x: isLogin ? -20 : 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: isLogin ? 20 : -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <form onSubmit={handleSubmit}>
                <Card className="border-muted bg-card/40 backdrop-blur-md shadow-xl">
                  <CardHeader>
                    <CardTitle>{isLogin ? '¡Hola de nuevo!' : 'Crea tu cuenta'}</CardTitle>
                    <CardDescription>
                      {isLogin 
                        ? 'Ingresa tus credenciales para acceder a tu biblioteca.' 
                        : 'Únete a la mayor comunidad de prompts inteligentes.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!isLogin && (
                      <div className="space-y-2">
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Nombre de usuario"
                            className="pl-10"
                            required
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="Correo electrónico"
                          className="pl-10"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="relative">
                        <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="Contraseña"
                          className="pl-10"
                          required
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col space-y-4">
                    <Button type="submit" className="w-full h-11" disabled={loading}>
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {isLogin ? 'Entrar' : 'Registrarse'}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Al continuar, aceptas nuestros términos de servicio y políticas de privacidad.
                    </p>
                  </CardFooter>
                </Card>
              </form>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default Auth;
