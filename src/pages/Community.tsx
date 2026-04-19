import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Users, Crown, Search, Filter, ArrowUpDown, 
  Copy, Share2, MessageSquare, TrendingUp, Sparkles, LayoutGrid, Zap
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CATEGORIES } from './Library';
import { Link } from 'react-router-dom';

const Community = () => {
  const { user, token } = useAuth();
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('free'); // free, vip
  const [filters, setFilters] = useState({ category: 'Todas', search: '', order: 'new' });

  const fetchPrompts = async () => {
    setLoading(true);
    try {
      const isVipParam = tab === 'vip' ? 'true' : 'false';
      const url = `/api/prompts?isVip=${isVipParam}&category=${filters.category === 'Todas' ? '' : filters.category}&search=${filters.search}&order=${filters.order}`;
      const res = await fetch(url);
      const data = await res.json();
      setPrompts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, [tab, filters.category, filters.order]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPrompts();
  };

  const copyPrompt = (content: string, id: string, isVip: boolean) => {
    if (isVip && !user) {
      toast.error('Debes iniciar sesión para ver prompts VIP');
      return;
    }
    if (isVip && user?.role === 'Regular') {
      toast.error('Contenido exclusivo para miembros VIP');
      return;
    }
    navigator.clipboard.writeText(content);
    toast.success('¡Prompt copiado!');
    fetch(`/api/prompts/${id}/copy`, { method: 'PATCH' });
    setPrompts(prev => prev.map(p => p.id === id ? { ...p, copyCount: p.copyCount + 1 } : p));
  };

  const topPrompts = [...prompts].sort((a, b) => b.copyCount - a.copyCount).slice(0, 3);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-12 space-y-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-white/5 pb-16">
        <div className="space-y-6">
          <Badge variant="outline" className="text-amber-500 border-amber-500/20 text-[10px] uppercase tracking-[0.3em] italic bg-amber-500/5 px-4 py-1 rounded-full">
            Explorar Inteligencia
          </Badge>
          <h1 className="text-6xl font-black tracking-tighter uppercase sm:text-7xl lg:text-8xl leading-[0.85]">Stream de <br/> Comunidad</h1>
        </div>
        
        <form onSubmit={handleSearch} className="flex w-full max-w-md gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-zinc-600 group-focus-within:text-white transition-colors" />
            <Input 
              placeholder="Buscar arquitectura..." 
              value={filters.search}
              onChange={e => setFilters({...filters, search: e.target.value})}
              className="pl-14 h-14 bg-zinc-900/40 border-white/5 rounded-2xl focus:ring-amber-500/10 transition-all font-medium text-sm"
            />
          </div>
          <Button type="submit" size="icon" className="h-14 w-14 rounded-2xl bg-white text-black hover:bg-zinc-200 transition-all shadow-xl active:scale-95">
            <Search className="h-6 w-6" />
          </Button>
        </form>
      </div>

      <div className="flex flex-col lg:flex-row gap-16">
        {/* Main Content */}
        <div className="flex-1 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <Tabs value={tab} onValueChange={setTab as any} className="w-full sm:w-auto">
              <TabsList className="bg-zinc-900/60 border border-white/5 p-1.5 h-12 rounded-2xl">
                <TabsTrigger value="free" className="rounded-xl text-[10px] font-black uppercase tracking-[0.2em] px-8 py-2 data-[state=active]:bg-white data-[state=active]:text-black transition-all">Comunidad</TabsTrigger>
                <TabsTrigger value="vip" className="rounded-xl text-[10px] font-black uppercase tracking-[0.2em] px-8 py-2 data-[state=active]:bg-amber-600 data-[state=active]:text-white transition-all">Zona VIP Premium</TabsTrigger>
              </TabsList>
            </Tabs>

            <Select 
              value={filters.order} 
              onValueChange={val => setFilters({...filters, order: val})}
            >
              <SelectTrigger className="w-[220px] h-12 bg-zinc-900/60 border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] px-6">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/10 rounded-2xl overflow-hidden">
                <SelectItem value="new" className="text-[10px] font-bold uppercase tracking-widest py-3">Más Recientes</SelectItem>
                <SelectItem value="popular" className="text-[10px] font-bold uppercase tracking-widest py-3">Más Populares</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Badge 
              variant={filters.category === 'Todas' ? "default" : "outline"}
              className={cn(
                "cursor-pointer px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-full border-white/5",
                filters.category === 'Todas' 
                  ? "bg-white text-black hover:bg-zinc-200" 
                  : "bg-zinc-900/40 text-zinc-500 hover:text-white"
              )}
              onClick={() => setFilters({...filters, category: 'Todas'})}
            >
              Todas
            </Badge>
            {CATEGORIES.slice(0, 8).map(cat => (
              <Badge 
                key={cat}
                variant={filters.category === cat ? "default" : "outline"}
                className={cn(
                  "cursor-pointer px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-full border-white/5",
                  filters.category === cat 
                    ? "bg-amber-600 text-white border-transparent" 
                    : "bg-zinc-900/40 text-zinc-500 hover:text-white"
                )}
                onClick={() => setFilters({...filters, category: cat})}
              >
                {cat}
              </Badge>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1,2,3,4].map(i => <div key={i} className="h-72 rounded-3xl bg-zinc-900/40 animate-pulse border border-white/5" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <AnimatePresence mode="popLayout">
                {prompts.map((prompt) => (
                  <motion.div
                    key={prompt.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group"
                  >
                    <Card className="h-full bg-[#111112]/50 border-white/5 rounded-[2.5rem] overflow-hidden hover:border-amber-500/20 transition-all duration-500 flex flex-col group/card shadow-2xl">
                      <CardHeader className="p-8 pb-4">
                        <div className="flex items-center justify-between mb-6">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-[10px] font-black text-zinc-400 group-hover/card:bg-zinc-700 transition-colors">
                                {prompt.author.username.substring(0, 2).toUpperCase()}
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 group-hover/card:text-zinc-300 transition-colors">{prompt.author.username}</span>
                           </div>
                           <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-zinc-900/80 border-white/5 text-zinc-600 group-hover/card:text-zinc-400 transition-colors">
                             {prompt.category}
                           </Badge>
                        </div>
                        <CardTitle className="text-2xl font-black tracking-tighter leading-none uppercase group-hover/card:text-amber-500 transition-colors pb-4">
                          {prompt.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-8 pt-0 flex-1">
                        <p className="text-zinc-500 text-sm line-clamp-3 font-medium leading-relaxed italic border-l border-white/10 pl-4 py-2 group-hover/card:border-amber-500/30 transition-all">
                          "{prompt.content}"
                        </p>
                      </CardContent>
                      <CardFooter className="p-8 pt-6 border-t border-white/5 bg-zinc-900/30 flex items-center justify-between">
                        <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-700 group-hover/card:text-zinc-500 transition-colors">
                          <span className="flex items-center gap-2">
                            <Zap className="h-4 w-4" /> {prompt.copyCount} copias
                          </span>
                        </div>
                        <div className="flex gap-2">
                           <Link to={`/chat/${prompt.authorId}`}>
                              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white text-black transition-all">
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                           </Link>
                          <Button
                            size="sm"
                            className="h-10 px-8 rounded-xl bg-zinc-800 text-white hover:bg-zinc-700 text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95"
                            onClick={() => copyPrompt(prompt.content, prompt.id, prompt.isVip)}
                          >
                            Indexar
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="w-full lg:w-96 space-y-16">
          <div className="p-10 rounded-[3rem] border border-white/5 bg-[#0D0D0E]/60 backdrop-blur-xl space-y-10 shadow-2xl">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 italic">Tendencias Actuales</h3>
            <div className="space-y-10">
              {topPrompts.map((t, i) => (
                <div key={t.id} className="flex gap-6 group cursor-pointer items-center">
                  <span className="text-4xl font-black text-white/5 group-hover:text-amber-500 transition-all duration-300 transform group-hover:scale-110">0{i + 1}</span>
                  <div className="space-y-2">
                    <h4 className="text-xs font-black leading-tight group-hover:underline uppercase tracking-tight text-zinc-300 group-hover:text-white transition-colors">{t.title}</h4>
                    <span className="block text-[9px] text-zinc-600 font-bold uppercase tracking-[0.2em]">{t.copyCount} indexaciones</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-10 rounded-[3rem] border border-amber-500/10 bg-gradient-to-br from-amber-500/10 via-zinc-900 to-black space-y-8 shadow-2xl overflow-hidden relative group/vip">
            <div className="absolute top-0 right-0 p-8 opacity-10 transform scale-150 group-hover/vip:scale-[2] group-hover/vip:opacity-20 transition-all duration-500">
               <Crown className="w-32 h-32 text-amber-500" />
            </div>
            <Crown className="h-8 w-8 text-amber-500" />
            <div className="space-y-4 relative z-10">
              <h3 className="text-xl font-black uppercase tracking-tight leading-tight">Acceso <br/> Profesional</h3>
              <p className="text-zinc-500 text-[10px] leading-relaxed font-bold uppercase tracking-[0.2em]">Desbloquea los prompts de más alto nivel indexados por nuestros usuarios VIP. Ingeniería pura.</p>
            </div>
            <Button className="w-full bg-amber-600 text-white hover:bg-amber-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] h-12 shadow-2xl hover:shadow-amber-500/20 transition-all relative z-10">Suscribirse</Button>
          </div>
        </aside>
      </div>
    </div>
  );
};

const CommunityGrid = ({ prompts, onCopy, user, isVipSection = false }: any) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
    {prompts.map((prompt: any, i: number) => (
      <motion.div
        key={prompt.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05 }}
      >
        <Card className="h-full flex flex-col hover:shadow-xl transition-all border-muted hover:border-primary/50 group bg-card/40 backdrop-blur-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <img 
                  src={prompt.author.profilePic} 
                  className="h-8 w-8 rounded-full ring-2 ring-background shadow-sm"
                  referrerPolicy="no-referrer"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold">{prompt.author.username}</span>
                  <span className="text-[10px] text-muted-foreground capitalize">{prompt.author.role}</span>
                </div>
              </div>
              {prompt.isVip && <Crown className="h-4 w-4 text-yellow-500" />}
            </div>
            <CardTitle className="line-clamp-2 leading-tight group-hover:text-primary transition-colors cursor-pointer capitalize">
              {prompt.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow pt-0">
            <p className="text-sm text-muted-foreground line-clamp-3 mb-4 italic">
              {prompt.content}
            </p>
            <Badge variant="secondary" className="bg-primary/5 text-primary-foreground border-primary/20 text-[10px]">
              {prompt.category}
            </Badge>
          </CardContent>
          <CardFooter className="pt-4 border-t flex justify-between bg-muted/5">
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <span className="flex items-center"><Copy className="mr-1 h-3 w-3" /> {prompt.copyCount}</span>
              <span className="flex items-center"><TrendingUp className="mr-1 h-3 w-3" /> Popular</span>
            </div>
            <div className="flex space-x-2">
              <Link to={`/chat/${prompt.authorId}`}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </Link>
              <Button 
                size="sm" 
                className={cn("h-8 px-4 font-bold", prompt.isVip ? "bg-yellow-500 hover:bg-yellow-600" : "")}
                onClick={() => onCopy(prompt.content, prompt.id, prompt.isVip)}
              >
                Copiar
              </Button>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    ))}
    {prompts.length === 0 && (
      <div className="col-span-full py-32 text-center space-y-4">
        <LayoutGrid className="mx-auto h-16 w-16 text-muted-foreground/30" />
        <h3 className="text-2xl font-bold">Sin resultados</h3>
        <p className="text-muted-foreground">No hemos encontrado prompts que coincidan con estos filtros.</p>
      </div>
    )}
  </div>
);

// Final imports to avoid errors
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default Community;
