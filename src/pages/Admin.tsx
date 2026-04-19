import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Shield, Users, Trash2, Crown, Key, UserCheck, 
  UserX, RefreshCcw, Search, MoreVertical, Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogFooter, DialogDescription 
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const Admin = () => {
  const { user, token } = useAuth();
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [vipDays, setVipDays] = useState('30');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPass === '2700') {
      setIsAdminAuth(true);
      fetchUsers();
    } else {
      toast.error('Contraseña incorrecta');
    }
  };

  const assignVip = async (permanent: boolean) => {
    try {
      const res = await fetch('/api/admin/vip', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ userId: selectedUser.id, days: parseInt(vipDays), permanent }),
      });
      if (res.ok) {
        toast.success('Estado VIP actualizado');
        setSelectedUser(null);
        fetchUsers();
      }
    } catch (err) {
      toast.error('Error al asignar VIP');
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Usuario eliminado');
        fetchUsers();
      }
    } catch (err) {
      toast.error('Error al eliminar');
    }
  };

  if (!isAdminAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-12">
        <div className="text-center space-y-6">
          <Badge variant="outline" className="text-amber-500 border-amber-500/20 text-[10px] font-black uppercase tracking-[0.5em] bg-amber-500/5 px-6 py-2 rounded-full animate-pulse">
            Terminal de Alto Mando
          </Badge>
          <h1 className="text-6xl font-black tracking-tighter uppercase sm:text-7xl lg:text-8xl leading-[0.85]">Acceso <br/> Restringido</h1>
          <p className="text-zinc-600 font-bold uppercase tracking-[0.3em] text-xs">Identificación biométrica y clave de red requerida</p>
        </div>
        <Card className="w-full max-w-sm bg-[#0D0D0E]/60 border-white/5 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-2xl group transition-all hover:border-amber-500/20">
          <CardHeader className="pb-8">
            <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center justify-center gap-3">
              <Key className="h-5 w-5 text-amber-500" /> Cifrado de Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminAuth} className="space-y-6">
              <Input 
                type="password" 
                placeholder="••••" 
                className="h-16 bg-zinc-900/50 border-white/5 rounded-2xl font-mono text-center text-3xl tracking-[0.5em] focus:ring-amber-500/20 transition-all"
                value={adminPass}
                onChange={e => setAdminPass(e.target.value)}
                autoFocus
              />
              <Button type="submit" className="w-full h-14 bg-white text-black hover:bg-zinc-200 text-xs font-black uppercase tracking-[0.4em] rounded-2xl shadow-xl transition-all active:scale-95">
                Verificar Credenciales
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-12 space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-end gap-10 border-b border-white/5 pb-16">
        <div className="space-y-6">
          <Badge variant="outline" className="text-amber-500 border-amber-500/20 text-[10px] font-black uppercase tracking-[0.4em] italic bg-amber-500/5 px-4 py-1 rounded-full">
            Panel de Control Elite
          </Badge>
          <h1 className="text-6xl font-black tracking-tighter uppercase sm:text-7xl lg:text-8xl leading-[0.85]">Gestión de <br/> Comandancia</h1>
          <p className="text-zinc-600 font-bold uppercase tracking-[0.2em] text-[10px]">Supervisando a {users.length} arquitectos de información activos.</p>
        </div>
        <Button onClick={fetchUsers} disabled={loading} variant="outline" className="h-14 px-8 border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all shadow-xl active:scale-95">
          <RefreshCcw className={cn("mr-3 h-4 w-4", loading && "animate-spin")} /> Sincronizar Directorio
        </Button>
      </div>

      <div className="rounded-[3rem] border border-white/5 bg-[#0D0D0E]/60 backdrop-blur-xl overflow-hidden shadow-2xl">
        <Table>
          <TableHeader className="bg-zinc-900/40">
            <TableRow className="border-white/5">
              <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 h-16 px-8">Arquitecto</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 h-16">Estatus</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 h-16">Expiración VIP</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 h-16">Indexado En</TableHead>
              <TableHead className="text-right text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 h-16 px-8">Comandos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(u => (
              <TableRow key={u.id} className="border-white/5 hover:bg-white/5 transition-colors group cursor-pointer">
                <TableCell className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <img src={u.profilePic} className="h-12 w-12 rounded-full border-2 border-white/5 group-hover:border-amber-500/30 transition-all" referrerPolicy="no-referrer" />
                    <div className="flex flex-col">
                      <span className="text-sm font-black uppercase tracking-tight text-zinc-200">{u.username}</span>
                      <span className="text-[9px] font-bold uppercase text-zinc-600 tracking-widest">{u.id.substring(0, 12)}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={u.role === 'Admin VIP' ? 'default' : u.role === 'VIP' ? 'outline' : 'secondary'} className={cn(
                    "text-[9px] font-black uppercase tracking-[0.2em] rounded-full px-4 py-1",
                    u.role === 'VIP' ? "border-amber-500/30 text-amber-500 bg-amber-500/5" : u.role === 'Admin VIP' ? "bg-white text-black" : "bg-zinc-900 text-zinc-500"
                  )}>
                    {u.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 italic">
                  {u.vipUntil ? format(new Date(u.vipUntil), 'dd MM yyyy') : u.role === 'VIP' ? 'INF' : 'N/A'}
                </TableCell>
                <TableCell className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  {format(new Date(u.createdAt), 'dd.MM.yy')}
                </TableCell>
                <TableCell className="text-right px-8">
                  <div className="flex justify-end gap-3">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 hover:bg-amber-600 hover:text-white transition-all"
                      onClick={() => setSelectedUser(u)}
                    >
                      <UserCheck className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 hover:bg-red-600 hover:text-white transition-all disabled:opacity-30"
                      onClick={() => deleteUser(u.id)}
                      disabled={u.id === user?.id}
                    >
                      <UserX className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="bg-zinc-950 border-white/10 rounded-[3rem] p-10 max-w-lg">
          <DialogHeader className="space-y-6 text-center">
            <Badge variant="outline" className="w-fit mx-auto border-amber-500/30 text-amber-500 text-[10px] font-black uppercase tracking-widest">Protocolo de Ascenso</Badge>
            <DialogTitle className="text-4xl font-black tracking-tighter uppercase leading-none">Status VIP <br/> @{selectedUser?.username}</DialogTitle>
            <DialogDescription className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Configuración de privilegios de usuario elite</DialogDescription>
          </DialogHeader>
          <div className="space-y-8 py-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 px-2">Ventana de Tiempo (Días)</label>
              <Input 
                type="number" 
                max="3650" 
                value={vipDays} 
                onChange={e => setVipDays(e.target.value)} 
                className="h-14 bg-zinc-900 border-white/5 rounded-2xl font-black text-center text-xl focus:ring-amber-500/20"
              />
            </div>
            <div className="flex gap-4">
              <Button onClick={() => assignVip(false)} className="flex-1 h-14 bg-amber-600 text-white hover:bg-amber-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl transition-all">Activar Temporal</Button>
              <Button onClick={() => assignVip(true)} className="flex-1 h-14 bg-white text-black hover:bg-zinc-200 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl transition-all">Acceso Perpetuo</Button>
            </div>
            
            <div className="pt-8 border-t border-white/5 space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 px-2">Resetear Llave de Acceso</label>
                <div className="flex gap-3">
                  <Input id="newPass" type="password" placeholder="Nueva Clave..." className="h-14 bg-zinc-900/50 border-white/5 rounded-2xl px-6 font-bold" />
                  <Button variant="secondary" className="h-14 px-8 border-white/5 bg-zinc-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-xl" onClick={async () => {
                    const pass = (document.getElementById('newPass') as HTMLInputElement).value;
                    if (!pass) return toast.error('Ingresa una clave');
                    await fetch(`/api/admin/users/${selectedUser.id}/reset-password`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ newPassword: pass }),
                    });
                    toast.success('Clave reseteada de forma segura');
                  }}>Reset</Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
