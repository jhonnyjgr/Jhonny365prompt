import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Plus, Search, Copy, Edit, Trash2, Share2, 
  ExternalLink, Clock, User as UserIcon, Lock, Globe, Crown, BookOpen, Zap 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';

export const CATEGORIES = [
  'Escritura Creativa', 'Programación', 'Negocios', 'Educación', 
  'Gaming', 'Marketing', 'IA y ML', 'Contenido', 
  'Videos Tutoriales', 'Página Web', 'Otros'
];

// Content parsing for URLs
const renderContent = (text: string) => {
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(.+)/;
  
  return text.split('\n').map((line, i) => {
    const ytMatch = line.match(youtubeRegex);
    if (ytMatch) {
      const videoId = ytMatch[1].split('&')[0];
      return (
        <div key={i} className="my-4 aspect-video w-full rounded-xl overflow-hidden border bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            className="w-full h-full"
            allowFullScreen
          />
        </div>
      );
    }
    return <p key={i} className="mb-2 whitespace-pre-wrap">{line}</p>;
  });
};

const Library = () => {
  const { user, token } = useAuth();
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    title: '', content: '', category: 'Otros', isPublic: true, isVip: false 
  });

  const fetchPrompts = async () => {
    try {
      const res = await fetch('/api/prompts?isPublic=all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      // Filter for current user since it's "My Library"
      setPrompts(data.filter((p: any) => p.authorId === user?.id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, [user, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast.success('Prompt creado exitosamente');
        setIsDialogOpen(false);
        setFormData({ title: '', content: '', category: 'Otros', isPublic: true, isVip: false });
        fetchPrompts();
      }
    } catch (err) {
      toast.error('Error al crear prompt');
    }
  };

  const copyPrompt = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    toast.success('¡Copiado al portapapeles!');
    fetch(`/api/prompts/${id}/copy`, { method: 'PATCH' });
    setPrompts(prev => prev.map(p => p.id === id ? { ...p, copyCount: p.copyCount + 1 } : p));
  };

  const deletePrompt = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este prompt?')) return;
    try {
      const res = await fetch(`/api/prompts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Eliminado correctamente');
        fetchPrompts();
      }
    } catch (err) {
      toast.error('Error al eliminar');
    }
  };

  const filteredPrompts = prompts.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mx-auto max-w-7xl px-4 py-12 space-y-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-white/5 pb-16">
        <div className="space-y-6">
          <Badge variant="outline" className="text-amber-500 border-amber-500/20 text-[10px] font-black uppercase tracking-[0.4em] italic bg-amber-500/5 px-4 py-1 rounded-full">
            Archivo Personal
          </Badge>
          <h1 className="text-6xl font-black tracking-tighter uppercase sm:text-7xl lg:text-8xl leading-[0.85]">Mi Biblioteca <br/> de Prompts</h1>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button className="h-14 px-10 text-xs font-black uppercase tracking-[0.3em] bg-white text-black hover:bg-zinc-200 rounded-2xl shadow-2xl active:scale-95 transition-all"><Plus className="mr-3 h-5 w-5" /> Crear Prompt</Button>} />
          <DialogContent className="sm:max-w-[700px] bg-zinc-950 border-white/10 rounded-[2.5rem] p-10 overflow-hidden">
            <form onSubmit={handleSubmit}>
              <DialogHeader className="mb-10 text-center">
                <Badge variant="outline" className="w-fit mx-auto mb-4 border-amber-500/30 text-amber-500 text-[10px] font-black uppercase tracking-widest">Configurador de Prompt</Badge>
                <DialogTitle className="text-4xl font-black tracking-tighter uppercase">Nueva Arquitectura</DialogTitle>
                <DialogDescription className="text-zinc-500 font-bold uppercase text-[9px] tracking-[0.2em] mt-2">Define los parámetros técnicos de tu prompt</DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-8 py-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Título del Proyecto</label>
                  <Input
                    placeholder="Ej: Optimizador de Consultas SQL..."
                    className="h-14 bg-zinc-900/50 border-white/5 rounded-2xl focus:ring-amber-500/20 px-6 font-bold"
                    required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Categoría Técnica</label>
                  <Select 
                    value={formData.category} 
                    onValueChange={val => setFormData({...formData, category: val})}
                  >
                    <SelectTrigger className="h-14 bg-zinc-900/50 border-white/5 rounded-2xl px-6 font-bold uppercase text-xs tracking-widest">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10">
                      {CATEGORIES.map(cat => <SelectItem key={cat} value={cat} className="text-[10px] font-bold uppercase tracking-widest py-3">{cat}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Contenido del Prompt</label>
                  <textarea
                    placeholder="Escribe aquí tu prompt maestro..."
                    className="w-full min-h-[160px] bg-zinc-900/50 border border-white/5 rounded-2xl p-6 focus:outline-none focus:ring-1 focus:ring-amber-500/20 transition-all font-medium text-sm leading-relaxed"
                    required
                    value={formData.content}
                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                  />
                </div>
                <div className="flex items-center justify-between p-6 bg-zinc-900/30 rounded-2xl border border-white/5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em]">Visibilidad VIP</label>
                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Solo visible para la élite</p>
                  </div>
                  <input 
                    type="checkbox" 
                    id="isVip"
                    checked={formData.isVip}
                    onChange={e => setFormData({ ...formData, isVip: e.target.checked })}
                    className="w-5 h-5 accent-amber-600 rounded" 
                  />
                </div>
              </div>
              <DialogFooter className="mt-10">
                <Button type="submit" className="w-full h-14 bg-white text-black hover:bg-zinc-200 text-xs font-black uppercase tracking-[0.4em] rounded-2xl shadow-xl transition-all">
                  Indexar Prompt
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative group max-w-xl mx-auto lg:mx-0">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-600 group-focus-within:text-white transition-colors" />
        <Input 
          placeholder="Buscar arquitectura personal..." 
          className="pl-14 h-14 bg-zinc-900/40 border-white/5 rounded-2xl focus:ring-amber-500/10 transition-all"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredPrompts.map((prompt) => (
            <motion.div
              key={prompt.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="h-full bg-[#111112]/50 border-white/5 rounded-[2.5rem] overflow-hidden hover:border-amber-500/20 transition-all duration-500 flex flex-col group/card shadow-2xl">
                <CardHeader className="p-8 pb-4">
                  <div className="flex items-center justify-between mb-6">
                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-zinc-900/80 border-white/5 text-zinc-600">
                      {prompt.category}
                    </Badge>
                    {prompt.isVip ? (
                      <Crown className="h-4 w-4 text-amber-500" />
                    ) : (
                      <Globe className="h-4 w-4 text-zinc-700" />
                    )}
                  </div>
                  <CardTitle className="text-2xl font-black tracking-tighter leading-none uppercase group-hover/card:text-amber-500 transition-colors pb-4">
                    {prompt.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0 flex-1 space-y-6">
                  <div className="text-zinc-500 text-sm line-clamp-4 font-medium leading-relaxed italic border-l border-white/10 pl-6 py-2">
                    {renderContent(prompt.content)}
                  </div>
                </CardContent>
                <CardFooter className="p-8 pt-6 border-t border-white/5 bg-zinc-900/30 flex items-center justify-between">
                  <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-700 group-hover/card:text-zinc-500 transition-colors">
                    <span className="flex items-center gap-2">
                      <Zap className="h-4 w-4" /> {prompt.copyCount}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white text-black transition-all" onClick={() => copyPrompt(prompt.content, prompt.id)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white text-black transition-all" onClick={() => {
                      const url = `https://twitter.com/intent/tweet?text=Mira este prompt: ${prompt.title} en Jhonny Prompt 365`;
                      window.open(url, '_blank');
                    }}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white text-red-600 transition-all" onClick={() => deletePrompt(prompt.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredPrompts.length === 0 && !loading && (
          <div className="col-span-full py-40 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-zinc-900/20">
            <BookOpen className="mx-auto h-20 w-20 text-zinc-800 mb-8" />
            <h3 className="text-4xl font-black tracking-tighter uppercase mb-4">Archivo Vacío</h3>
            <p className="text-zinc-600 font-bold uppercase tracking-widest text-[10px]">No hay arquitectura que coincida con tu búsqueda.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Library;
