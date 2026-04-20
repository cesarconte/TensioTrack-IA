import * as React from "react";
import { useAppStore } from "../store/useAppStore";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { Button } from "./ui/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/Tooltip";
import { Toaster } from "sonner";

import { User, Moon, Sun, Settings, LogOut, LayoutDashboard, History, FileText, Sparkles } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { 
    user, 
    isDarkMode, 
    toggleDarkMode, 
    activeTab, 
    setActiveTab
  } = useAppStore();

  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => signOut(auth);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'history', label: 'Historial', icon: History },
    { id: 'report', label: 'Informe', icon: FileText },
    { id: 'ai', label: 'IA Análisis', icon: Sparkles }
  ] as const;

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-500 bg-background text-foreground"
    )}>
      <Toaster position="top-center" expand={false} richColors />
      
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-card/80 backdrop-blur-xl shadow-sm">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 h-16 sm:h-20 grid grid-cols-3 items-center">
          <div className="flex items-center gap-3 shrink-0 justify-self-start">
            <div className="w-10 h-10 flex items-center justify-center">
              <img 
                src="/logo-tensiotrack.svg" 
                alt="TensioTrack Logo" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="text-xl font-display font-black tracking-tight hidden lg:block text-foreground">
              Tensio<span className="text-primary">Track</span>
            </h1>
          </div>

          {/* Desktop/Landscape Navigation - Centered column */}
          <div className="flex justify-center items-center">
            <nav className="hidden sm:flex items-center gap-4 md:gap-8">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "relative py-2 text-sm font-bold transition-all duration-300 hover:scale-105 active:scale-95 whitespace-nowrap",
                      isActive 
                        ? "text-primary" 
                        : "text-on-surface-variant hover:text-foreground"
                    )}
                  >
                    {item.label}
                    {isActive && (
                      <motion.div 
                        layoutId="activeTab"
                        className="absolute -bottom-[22px] left-0 right-0 h-1 bg-primary rounded-t-full"
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0 justify-self-end">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden lg:block text-right">
                  <p className="text-xs font-black text-foreground">
                    {user.displayName || 'Paciente'}
                  </p>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Paciente</p>
                </div>
                <div className="relative" ref={userMenuRef}>
                  <Tooltip open={isUserMenuOpen ? false : undefined}>
                    <TooltipTrigger asChild>
                      <button 
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-transparent hover:border-primary hover:scale-105 active:scale-95 transition-all duration-300 overflow-hidden"
                        aria-label="Menú de usuario"
                        aria-haspopup="true"
                        aria-expanded={isUserMenuOpen}
                      >
                        {user.photoURL ? (
                          <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" />
                        ) : (
                          <User className="text-on-surface-variant w-[20px] h-[20px]" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Cuenta de {user.displayName || 'Paciente'}</TooltipContent>
                  </Tooltip>
                  
                  <div className={cn(
                    "absolute right-0 mt-2 w-72 bg-card rounded-[2.5rem] shadow-2xl transition-all transform origin-top-right z-50 overflow-hidden",
                    isUserMenuOpen ? "opacity-100 visible scale-100" : "opacity-0 invisible scale-95 pointer-events-none"
                  )}>
                    {/* User Info Header */}
                    <div className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-[1.25rem] bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" />
                        ) : (
                          <User className="text-on-surface-variant w-[24px] h-[24px]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">
                          {user.displayName || 'Paciente'}
                        </p>
                      </div>
                    </div>

                    <div className="h-[1px] bg-border" />

                    {/* Menu Items */}
                    <div className="p-2">
                      <button 
                        onClick={() => { toggleDarkMode(); }}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-sm font-medium text-on-surface-variant hover:bg-surface-low active:scale-[0.98] transition-all duration-300"
                      >
                        <div className="flex items-center gap-3">
                          {isDarkMode ? <Moon className="text-on-surface-variant w-8 h-8 bg-primary/10 p-1.5 rounded-lg" /> : <Sun className="text-on-surface-variant w-8 h-8 bg-primary/10 p-1.5 rounded-lg" />}
                          Aspecto: {isDarkMode ? 'Tema oscuro' : 'Tema claro'}
                        </div>
                      </button>

                      <button 
                        onClick={() => { setActiveTab('settings'); setIsUserMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium text-on-surface-variant hover:bg-surface-low active:scale-[0.98] transition-all duration-300"
                      >
                        <Settings className="text-on-surface-variant w-8 h-8 bg-primary/10 p-1.5 rounded-lg" />
                        Ajustes
                      </button>
                    </div>

                    <div className="h-[1px] bg-border" />

                    <div className="p-2">
                      <button 
                        onClick={() => { handleLogout(); setIsUserMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium text-destructive hover:bg-destructive/10 active:scale-[0.98] transition-all duration-300"
                      >
                        <LogOut className="w-8 h-8 bg-destructive/10 p-1.5 rounded-lg" />
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 sm:px-10 py-8 pb-32 sm:pb-8">
        {children}
      </main>

      {/* Mobile Navigation */}
      {activeTab !== 'settings' && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-xl sm:hidden pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between px-2 h-20">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setActiveTab(item.id)}
                      className={cn(
                        "flex items-center justify-center gap-2 px-3 py-3 rounded-full transition-all duration-300 active:scale-90",
                        isActive 
                          ? "bg-primary text-white shadow-lg shadow-primary/20" 
                          : "text-on-surface-variant hover:text-foreground hover:bg-surface-low"
                      )}
                      aria-label={item.label}
                    >
                      <IconComponent className={cn("w-6 h-6 transition-transform duration-300", isActive ? "scale-110" : "")} />
                      {isActive && (
                        <span className="text-xs font-bold whitespace-nowrap animate-in fade-in slide-in-from-left-2">
                          {item.label}
                        </span>
                      )}
                    </button>
                  </TooltipTrigger>
                  {!isActive && (
                    <TooltipContent side="top">
                      {item.label}
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
