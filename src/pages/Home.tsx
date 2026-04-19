import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, Zap, ShieldCheck, Share2, TrendingUp, 
  ChevronRight, ArrowRight, Stars, Layout, Globe 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const Home = () => {
  const [stats, setStats] = useState({ userCount: 0, promptCount: 0, totalCopies: 0 });

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err));
  }, []);

  const features = [
    { title: 'Biblioteca de Prompts', description: 'Organiza tus mejores prompts en 11 categorías diferentes.', icon: Layout },
    { title: 'Zona VIP Premium', description: 'Accede a contenido exclusivo y herramientas avanzadas para profesionales.', icon: Crown },
    { title: 'Chat en Tiempo Real', description: 'Conecta con otros creadores e intercambia ideas al instante.', icon: MessageSquare },
    { title: 'Detección Automática', description: 'Renderizado inteligente de URLs de YouTube, TikTok y más.', icon: Globe },
  ];

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center pt-28 pb-20 text-center">
        <div className="absolute inset-0 -z-10 bg-[#0A0A0B]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_-20%,rgba(245,158,11,0.15),transparent_60%)]" />
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-8"
        >
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 backdrop-blur-sm px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500 italic">
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            <span>Framework de Prompts de Élite</span>
          </div>
          
          <h1 className="text-6xl font-black tracking-tighter sm:text-8xl lg:text-9xl uppercase leading-[0.85]">
            Jhonny <br />
            <span className="bg-gradient-to-r from-amber-400 to-orange-600 bg-clip-text text-transparent">Prompt 365</span>
          </h1>
          
          <p className="mx-auto max-w-[600px] text-lg text-zinc-400 font-medium leading-relaxed">
            Organiza, escala y domina la ingeniería de prompts con una biblioteca diseñada para la precisión y el rendimiento profesional.
          </p>

          <div className="flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0 pt-4">
            <Link to="/community">
              <Button size="lg" className="h-14 px-10 text-xs font-black uppercase tracking-widest bg-white text-black hover:bg-zinc-200 transition-all shadow-2xl">
                Explorar Feed
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="h-14 px-10 text-xs font-black uppercase tracking-widest border-white/10 hover:bg-white/5">
                Comenzar ahora
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="mt-28 grid grid-cols-1 gap-1 sm:grid-cols-3 w-full max-w-5xl px-4 border border-white/5 rounded-3xl overflow-hidden bg-black/40 backdrop-blur-xl">
          {[
            { label: 'Usuarios VIP', value: stats.userCount, icon: Crown, color: 'text-amber-500' },
            { label: 'Biblioteca Activa', value: stats.promptCount, icon: BookOpen, color: 'text-zinc-300' },
            { label: 'Indexaciones', value: stats.totalCopies, icon: Zap, color: 'text-zinc-300' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="p-10 border-r border-white/5 last:border-0 flex flex-col items-center gap-4 group hover:bg-white/[0.02] transition-colors"
            >
              <stat.icon className={cn("h-6 w-6 opacity-50", stat.color)} />
              <div className="space-y-1">
                <span className="block text-4xl font-black tracking-tighter">{stat.value}</span>
                <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">{stat.label}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-4">
          <div className="space-y-2">
             <h3 className="text-amber-500 text-[10px] font-bold uppercase tracking-[0.3em] font-mono italic">Ingeniería de Clase Mundial</h3>
             <h2 className="text-4xl font-black tracking-tighter uppercase sm:text-5xl">Arquitectura <br/> Profesional</h2>
          </div>
          <p className="max-w-md text-zinc-500 text-sm font-medium">Una suite completa de herramientas diseñadas para creadores que no aceptan menos que la perfección en sus prompts.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              whileHover={{ y: -5 }}
              className="p-8 rounded-3xl border border-white/5 bg-zinc-900/30 backdrop-blur-sm hover:border-white/10 transition-all flex flex-col gap-6"
            >
              <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <feature.icon className="h-5 w-5 text-amber-500" />
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-bold tracking-tight uppercase">{feature.title}</h3>
                <p className="text-zinc-500 text-xs leading-relaxed font-medium">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer Meta */}
      <footer className="container mx-auto px-4 py-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
          <span>© 2026 Jhonny Prompt 365 — Elite AI Framework</span>
          <div className="flex gap-8">
             <span className="flex items-center gap-2"><div className="h-1 w-1 bg-green-500 rounded-full" /> Database Online</span>
             <span>Versión 4.2.0</span>
          </div>
      </footer>
    </div>
  );
};

// Re-importing missing components
import { BookOpen, Users, MessageSquare, Crown } from 'lucide-react';

export default Home;
