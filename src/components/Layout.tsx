import * as React from "react";
import { useAppStore } from "../store/useAppStore";
import { cn } from "../lib/utils";
import { 
  Activity, 
  History, 
  FileText, 
  Brain, 
  Settings, 
  User, 
  LogOut,
  Sun,
  Moon
} from "lucide-react";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { Button } from "./ui/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/Tooltip";
import { Toaster } from "sonner";

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
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'history', label: 'Historial', icon: History },
    { id: 'report', label: 'Informe', icon: FileText },
    { id: 'ai', label: 'IA Análisis', icon: Brain }
  ] as const;

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-500",
      isDarkMode ? "dark bg-slate-950 text-slate-50" : "bg-slate-50 text-slate-900"
    )}>
      <Toaster position="top-center" expand={false} richColors />
      
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 grid grid-cols-[auto_1fr_auto] sm:grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
              <Activity className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-display font-black tracking-tight hidden lg:block">
              Tensio<span className="text-indigo-600">Track</span>
            </h1>
          </div>

          {/* Desktop/Landscape Navigation */}
          <nav className="hidden sm:flex justify-center items-center gap-1 md:gap-2 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setActiveTab(item.id)}
                      aria-label={item.label}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 md:px-4 md:py-2.5 rounded-xl text-[10px] md:text-sm font-bold transition-all whitespace-nowrap",
                        isActive 
                          ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" 
                          : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      )}
                    >
                      <Icon className="w-4 h-4 md:w-5 md:h-5" />
                      <span className="hidden md:inline">{item.label}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="md:hidden">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0 justify-self-end">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden lg:block text-right">
                  <p className="text-xs font-black text-slate-900 dark:text-white">
                    {user.displayName || 'Paciente'}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Paciente</p>
                </div>
                <div className="relative" ref={userMenuRef}>
                  <Tooltip open={isUserMenuOpen ? false : undefined}>
                    <TooltipTrigger asChild>
                      <button 
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-transparent hover:border-indigo-500 transition-all overflow-hidden"
                        aria-label="Menú de usuario"
                        aria-haspopup="true"
                        aria-expanded={isUserMenuOpen}
                      >
                        {user.photoURL ? (
                          <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-slate-400" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Cuenta de {user.displayName || 'Paciente'}</TooltipContent>
                  </Tooltip>
                  
                  <div className={cn(
                    "absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 transition-all transform origin-top-right z-50 overflow-hidden",
                    isUserMenuOpen ? "opacity-100 visible scale-100" : "opacity-0 invisible scale-95 pointer-events-none"
                  )}>
                    {/* User Info Header */}
                    <div className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {user.displayName || 'Paciente'}
                        </p>
                      </div>
                    </div>

                    <div className="h-[1px] bg-slate-100 dark:bg-slate-800" />

                    {/* Menu Items */}
                    <div className="p-2">
                      <button 
                        onClick={() => { toggleDarkMode(); }}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {isDarkMode ? <Moon className="w-5 h-5 text-slate-400" /> : <Sun className="w-5 h-5 text-slate-400" />}
                          Aspecto: {isDarkMode ? 'Tema oscuro' : 'Tema claro'}
                        </div>
                      </button>

                      <button 
                        onClick={() => { setActiveTab('settings'); setIsUserMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Settings className="w-5 h-5 text-slate-400" />
                        Ajustes
                      </button>
                    </div>

                    <div className="h-[1px] bg-slate-100 dark:bg-slate-800" />

                    <div className="p-2">
                      <button 
                        onClick={() => { handleLogout(); setIsUserMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                      >
                        <LogOut className="w-5 h-5" />
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-32 sm:pb-8">
        {children}
      </main>

      {/* Mobile Navigation */}
      {activeTab !== 'settings' && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 sm:hidden pb-safe">
          <div className="flex items-center justify-between px-2 h-20">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setActiveTab(item.id)}
                      className={cn(
                        "flex items-center justify-center gap-2 px-3 py-3 rounded-2xl transition-all duration-300",
                        isActive 
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none" 
                          : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      )}
                      aria-label={item.label}
                    >
                      <Icon className={cn("w-6 h-6 transition-transform duration-300", isActive ? "scale-110" : "")} />
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
