import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from 'next-themes';
import { 
  Menu, X, Home, BookOpen, Users, MessageSquare, Shield, 
  LogOut, Sun, Moon, Crown, User as UserIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: 'Inicio', href: '/', icon: Home },
    { name: 'Comunidad', href: '/community', icon: Users },
    { name: 'Mi Biblioteca', href: '/library', icon: BookOpen, private: true },
    { name: 'Chat', href: '/chat', icon: MessageSquare, private: true },
    { name: 'Admin', href: '/admin', icon: Shield, admin: true },
  ];

  const filteredItems = navItems.filter(item => {
    if (item.private && !user) return false;
    if (item.admin && user?.role !== 'Admin VIP') return false;
    return true;
  });

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/40 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-600 rounded-lg flex items-center justify-center font-bold text-black shadow-lg">J</div>
          <span className="text-xl font-bold tracking-tighter bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Jhonny Prompt 365</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-8">
          {filteredItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center space-x-1 py-2 text-sm font-medium transition-colors hover:text-white",
                location.pathname === item.href ? "text-white" : "text-zinc-400"
              )}
            >
              <span>{item.name}</span>
            </Link>
          ))}
        </div>

        <div className="flex items-center space-x-4">
          {user && (
             <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                <span className="text-amber-500 text-[10px] font-bold uppercase tracking-wider">👑 VIP</span>
             </div>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-white"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {user ? (
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 border-2 border-white/10 flex items-center justify-center text-xs font-bold text-white uppercase shadow-inner">
                {user.username.substring(0, 2)}
              </div>
              <Button variant="ghost" size="icon" onClick={logout} className="text-zinc-400 hover:text-destructive">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="bg-white text-black hover:bg-zinc-200">Entrar</Button>
            </Link>
          )}

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger render={
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            } />
            <SheetContent side="left" className="w-[280px] sm:w-[350px]">
              <div className="flex flex-col space-y-4 mt-8">
                {filteredItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center space-x-3 px-4 py-3 rounded-lg text-lg font-medium transition-colors",
                      location.pathname === item.href ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    )}
                  >
                    <item.icon className="h-6 w-6" />
                    <span>{item.name}</span>
                  </Link>
                ))}
                {user && (
                  <Button variant="outline" className="justify-start space-x-3" onClick={() => { logout(); setIsOpen(false); }}>
                    <LogOut className="h-6 w-6" />
                    <span>Cerrar Sesión</span>
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
