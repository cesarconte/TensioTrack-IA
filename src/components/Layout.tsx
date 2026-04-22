import * as React from "react";
import { useAppStore } from "../store/useAppStore";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { Button } from "./ui/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/Tooltip";
import { Toaster } from "sonner";

import { User, Moon, Sun, Settings, LogOut, LayoutDashboard, History, FileText, Sparkles, Plus } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { 
    user, 
    isDarkMode, 
    toggleDarkMode, 
    activeTab, 
    setActiveTab,
    setReadingFormOpen
  } = useAppStore();

  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);
  const mobileUserMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isOutsideDesktop = userMenuRef.current && !userMenuRef.current.contains(event.target as Node);
      const isOutsideMobile = mobileUserMenuRef.current && !mobileUserMenuRef.current.contains(event.target as Node);
      
      if (isOutsideDesktop && isOutsideMobile) {
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

  const renderUserMenu = (containerRef: React.RefObject<HTMLDivElement>, isMobile: boolean) => (
    <div className="relative" ref={containerRef}>
      <button 
        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
        className={cn(
          "flex items-center rounded-full bg-white dark:bg-card shadow-sm border border-border hover:border-primary/50 transition-all active:scale-95",
          isMobile ? "w-10 h-10 justify-center p-0" : "p-1.5 pr-5 gap-3"
        )}
        aria-expanded={isUserMenuOpen}
        aria-haspopup="true"
      >
        <div className={cn(
          "rounded-full bg-primary/10 text-primary flex items-center justify-center font-black overflow-hidden bg-cover bg-center shrink-0",
          isMobile ? "w-8 h-8" : "w-9 h-9"
        )}>
          {user?.photoURL ? (
            <img 
              src={user.photoURL} 
              alt="Avatar" 
              className="w-full h-full object-cover rounded-full"
              referrerPolicy="no-referrer"
            />
          ) : (
            user?.displayName?.charAt(0).toUpperCase() || <User size={isMobile ? 16 : 18} />
          )}
        </div>
        {!isMobile && (
          <div className="text-left">
            <p className="text-sm font-black leading-none text-foreground">{user?.displayName || 'Paciente'}</p>
          </div>
        )}
      </button>

      <AnimatePresence>
        {isUserMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-2xl shadow-xl overflow-hidden py-2 z-50 transform origin-top-right shadow-2xl"
          >
            <div className="px-5 py-3 border-b border-border/50 mb-2">
              <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1 font-display">Cuenta</p>
              <p className="text-sm font-bold text-foreground truncate">{user?.email}</p>
            </div>
            
            <button
              onClick={() => {
                setActiveTab('settings');
                setIsUserMenuOpen(false);
              }}
              className="w-full text-left px-5 py-2.5 text-sm font-bold text-on-surface hover:bg-surface-high transition-colors flex items-center gap-3"
            >
              <Settings className="w-4 h-4 text-on-surface-variant" />
              Ajustes
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full text-left px-5 py-2.5 text-sm font-bold text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-3 mt-1"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-500 bg-background text-foreground flex"
    )}>
      <Toaster position="top-center" expand={false} richColors />
      
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-[#0B0E14] border-r border-white/5 h-screen sticky top-0 shrink-0">
        <div className="p-10">
          <div className="flex flex-col gap-1 mb-12">
            <h1 className="text-2xl font-black tracking-tight text-white leading-none">Aura Health</h1>
            <p className="text-[10px] font-black text-[#636C8B] uppercase tracking-[0.2em]">NIGHT EDITION</p>
          </div>

          <nav className="space-y-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full flex items-center gap-4 py-3 px-4 rounded-2xl transition-all duration-300 group relative",
                    isActive 
                      ? "bg-white/5 text-white" 
                      : "text-[#636C8B] hover:text-white"
                  )}
                >
                  {isActive && <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />}
                  <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-[#636C8B] group-hover:text-white")} />
                  <span className="text-sm font-bold tracking-tight">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-10">
          <Button 
            className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl h-14 font-black text-sm shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
            onClick={() => setReadingFormOpen(true)}
          >
            <Plus className="w-5 h-5" />
            Nueva Lectura
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-40 w-full bg-card/60 ethereal-blur border-b border-border shadow-sm">
          <div className="px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-black tracking-tight">Aura Health</h1>
            </div>
            <div className="flex items-center gap-2">
              {user && (
                <>
                  <button 
                    onClick={() => toggleDarkMode()}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-low text-on-surface-variant hover:text-primary transition-all active:scale-95"
                    aria-label="Alternar tema"
                  >
                    {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </button>
                  {renderUserMenu(mobileUserMenuRef, true)}
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] dark:bg-[#090B11] p-0 pb-28 sm:p-6 sm:pb-28 lg:p-12">
          <div className="max-w-7xl mx-auto px-6 sm:px-0 pt-6 sm:pt-0">
            {/* Desktop Header */}
            <div className="hidden lg:flex items-center justify-between mb-12 relative z-30">
              <div className="flex items-center gap-4">
                <h2 className="text-3xl font-black tracking-tight text-foreground">
                  {navItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
                </h2>
              </div>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => toggleDarkMode()}
                  className="w-12 h-12 rounded-full bg-white dark:bg-card shadow-sm border border-border flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                  aria-label="Alternar tema"
                >
                  {isDarkMode ? <Sun className="w-5 h-5 text-primary" /> : <Moon className="w-5 h-5 text-on-surface" />}
                </button>

                {user && renderUserMenu(userMenuRef, false)}
              </div>
            </div>

            {children}
          </div>
        </main>
      </div>

      {/* Mobile Footer Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/70 backdrop-blur-3xl lg:hidden border-t border-border/50 h-20 flex items-center justify-around px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 transition-all",
                isActive ? "text-primary scale-110" : "text-on-surface-variant opacity-60"
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
