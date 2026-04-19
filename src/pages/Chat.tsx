import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Send, Search, Trash2, Edit, MessageSquare, 
  User as UserIcon, Loader2, Check, CheckCheck, 
  ChevronLeft, MoreVertical, Trash, X, Crown
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Chat = () => {
  const { id: routeId } = useParams();
  const { user, token } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeUser, setActiveUser] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [directory, setDirectory] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/conversations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setConversations(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (otherId: string) => {
    try {
      const res = await fetch(`/api/messages/${otherId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDirectory = async (q: string = '') => {
    try {
      const res = await fetch(`/api/users/directory?search=${q}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setDirectory(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchDirectory();
    setLoading(false);
    
    const interval = setInterval(() => {
      fetchConversations();
      if (activeUser) fetchMessages(activeUser.id);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [token, activeUser]);

  useEffect(() => {
    if (routeId && directory.length > 0) {
      const targetUser = directory.find(u => u.id === routeId);
      if (targetUser) {
        setActiveUser(targetUser);
        fetchMessages(targetUser.id);
      }
    }
  }, [routeId, directory]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeUser) return;
    setSending(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ receiverId: activeUser.id, content: newMessage }),
      });
      if (res.ok) {
        setNewMessage('');
        fetchMessages(activeUser.id);
        fetchConversations();
      }
    } catch (err) {
      toast.error('Error al enviar');
    } finally {
      setSending(false);
    }
  };

  const selectUser = (u: any) => {
    setActiveUser(u);
    fetchMessages(u.id);
    setSearch('');
    navigate(`/chat/${u.id}`);
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-12 h-[calc(100vh-10rem)]">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 h-full">
        {/* Sidebar */}
        <div className={cn(
          "md:col-span-4 lg:col-span-3 flex flex-col space-y-6 overflow-hidden",
          activeUser ? "hidden md:flex" : "flex"
        )}>
          <div className="space-y-6">
            <h1 className="text-4xl font-black tracking-tighter uppercase">Nexus <br/> Directo</h1>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-white transition-colors" />
              <Input 
                placeholder="Buscar usuarios..." 
                className="pl-11 h-12 bg-zinc-900/50 border-white/5 rounded-xl text-xs font-bold uppercase tracking-widest"
                value={search}
                onChange={e => { setSearch(e.target.value); fetchDirectory(e.target.value); }}
              />
            </div>
          </div>

          <ScrollArea className="flex-1 rounded-3xl border border-white/5 bg-zinc-900/40 p-4">
            <div className="space-y-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 italic px-2 mb-4">Directorio / Conversaciones</h3>
              
              {search && directory.map(u => (
                <button
                  key={u.id}
                  onClick={() => selectUser(u)}
                  className="w-full flex items-center gap-4 p-3 rounded-2xl transition-all hover:bg-white/5"
                >
                  <img src={u.profilePic} className="w-10 h-10 rounded-full border border-white/10" referrerPolicy="no-referrer" />
                  <span className="text-xs font-black uppercase tracking-tight">{u.username}</span>
                </button>
              ))}

              {!search && conversations.map(conv => {
                const other = conv.user1Id === user?.id ? conv.user2 : conv.user1;
                return (
                  <button
                    key={conv.id}
                    onClick={() => selectUser(other)}
                    className={cn(
                      "w-full flex items-center gap-4 p-3 rounded-2xl transition-all duration-300",
                      activeUser?.id === other.id 
                        ? "bg-white text-black shadow-xl scale-[1.02]" 
                        : "text-zinc-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <img src={other.profilePic} className="w-10 h-10 rounded-full border-2 border-white/10" referrerPolicy="no-referrer" />
                    <div className="flex flex-col items-start overflow-hidden">
                      <span className="text-xs font-black truncate uppercase tracking-tight">{other.username}</span>
                      <span className="text-[9px] font-bold uppercase opacity-60">VIP Elite</span>
                    </div>
                    {conv.unreadCount > 0 && (
                      <Badge className="ml-auto bg-amber-600 text-white rounded-full h-5 w-5 flex items-center justify-center p-0 text-[10px] border-none">
                        {conv.unreadCount}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className={cn(
          "md:col-span-8 lg:col-span-9 flex flex-col rounded-[3rem] border border-white/5 bg-[#0D0D0E]/60 backdrop-blur-2xl overflow-hidden shadow-2xl transition-all",
          !activeUser ? "hidden md:flex" : "flex"
        )}>
          {activeUser ? (
            <>
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-zinc-900/20">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setActiveUser(null)}>
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <img src={activeUser.profilePic} className="w-12 h-12 rounded-full border-2 border-white/10" referrerPolicy="no-referrer" />
                  <div className="flex flex-col">
                    <h2 className="text-lg font-black tracking-tight uppercase">{activeUser.username}</h2>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 italic">Conversación Activa</span>
                  </div>
                </div>
                <div className="flex gap-2 text-zinc-600">
                   <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                   <span className="text-[10px] font-black uppercase tracking-[0.2em]">Cifrado</span>
                </div>
              </div>

              <ScrollArea className="flex-1 p-8">
                <div className="space-y-8">
                  {messages.map((msg) => {
                    const isMe = msg.senderId === user?.id;
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                          "flex flex-col",
                          isMe ? "items-end" : "items-start"
                        )}
                      >
                        <div className={cn(
                          "max-w-[80%] rounded-[2rem] px-8 py-4 text-sm font-medium leading-relaxed relative group",
                          isMe 
                            ? "bg-white text-black rounded-tr-none shadow-2xl" 
                            : "bg-zinc-900 text-white rounded-tl-none border border-white/5 shadow-inner"
                        )}>
                          {isMe && (
                            <button 
                              onClick={async () => {
                                if(!confirm('¿Borrar mensaje?')) return;
                                await fetch(`/api/messages/${msg.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                                fetchMessages(activeUser.id);
                              }}
                              className="absolute -left-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all text-zinc-600 hover:text-red-500 p-2"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        <div className="mt-2 flex items-center gap-3 px-4 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-700">
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          {msg.isRead && <span className="text-amber-500">Visto</span>}
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              <form onSubmit={sendMessage} className="p-8 border-t border-white/5 bg-zinc-900/30">
                <div className="flex gap-4">
                  <Input 
                    placeholder="Escribir mensaje maestro..." 
                    className="flex-1 h-14 bg-zinc-900/50 border-white/5 rounded-2xl px-6 font-medium text-sm focus:ring-amber-500/20 transition-all"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    disabled={sending}
                  />
                  <Button 
                    type="submit"
                    className="h-14 w-14 rounded-2xl bg-white text-black hover:bg-zinc-200 shadow-xl transition-all active:scale-95 disabled:opacity-50"
                    disabled={sending || !newMessage.trim()}
                  >
                    {sending ? <Loader2 className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6" />}
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center space-y-10 text-center p-12">
              <div className="w-24 h-24 rounded-[2.5rem] border border-white/5 bg-zinc-900/40 flex items-center justify-center animate-float shadow-2xl relative">
                <div className="absolute inset-0 bg-amber-500/10 blur-2xl rounded-full" />
                <MessageSquare className="h-10 w-10 text-zinc-800 relative z-10" />
              </div>
              <div className="space-y-4">
                 <h2 className="text-5xl font-black tracking-tighter uppercase">Nexus <br/> Messaging</h2>
                 <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] max-w-xs mx-auto leading-relaxed">Inicia una sesión de comunicación <br/> técnica de alto nivel.</p>
              </div>
              <Button variant="outline" className="border-white/5 h-12 px-8 text-[10px] font-black uppercase tracking-[0.3em] rounded-xl hover:bg-white hover:text-black transition-all" onClick={() => navigate('/community')}>
                Explorar Comunidad
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
