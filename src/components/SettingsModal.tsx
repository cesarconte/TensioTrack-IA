import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  User, 
  Bell, 
  Shield, 
  Database, 
  LogOut, 
  Download, 
  Trash2, 
  ChevronRight,
  Info,
  Moon,
  Sun,
  Globe,
  HelpCircle,
  Heart,
  Activity,
  Clock
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SettingsModalProps {
  user: any;
  onClose: () => void;
  onLogout: () => void;
  onClearData: () => void;
  onExport: () => void;
  onOpenProfile: () => void;
  onOpenInfo: () => void;
  onGenerateTestData: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  remindersEnabled: boolean;
  morningTime: string;
  eveningTime: string;
  onToggleReminders: () => void;
  onUpdateMorningTime: (time: string) => void;
  onUpdateEveningTime: (time: string) => void;
  onTestNotification: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  user,
  onClose,
  onLogout,
  onClearData,
  onExport,
  onOpenProfile,
  onOpenInfo,
  onGenerateTestData,
  isDarkMode,
  onToggleDarkMode,
  remindersEnabled,
  morningTime,
  eveningTime,
  onToggleReminders,
  onUpdateMorningTime,
  onUpdateEveningTime,
  onTestNotification
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'data' | 'about'>('general');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const handleToggleReminders = async () => {
    if (!remindersEnabled && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        onToggleReminders();
      }
    } else {
      onToggleReminders();
    }
  };

  const sections = [
    { id: 'general', label: 'General', icon: User },
    { id: 'data', label: 'Datos', icon: Database },
    { id: 'about', label: 'Acerca de', icon: HelpCircle },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 40 }}
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-auto md:max-h-[85vh]"
      >
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-800/50 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 p-4 sm:p-6 flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-0">
          <div className="flex items-center gap-3 md:mb-10">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-indigo-600 flex items-center justify-center text-white">
              <Heart className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h2 className="text-lg sm:text-xl font-display font-black dark:text-white">Ajustes</h2>
          </div>

          <nav className="flex md:flex-col gap-1 sm:gap-2 flex-1 overflow-x-auto md:overflow-x-visible no-scrollbar">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveTab(section.id as any)}
                className={cn(
                  "flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap",
                  activeTab === section.id 
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-100 dark:border-slate-600" 
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                <section.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{section.label}</span>
                <span className="sm:hidden">{section.label.slice(0, 3)}</span>
              </button>
            ))}
          </nav>

          <button 
            onClick={onLogout}
            className="md:mt-auto flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-bold text-slate-400 hover:text-rose-600 transition-colors whitespace-nowrap"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar bg-white dark:bg-slate-900">
          <AnimatePresence mode="wait">
            {activeTab === 'general' && (
              <motion.div
                key="general"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6 sm:space-y-8"
              >
                <section className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Cuenta y Perfil</h3>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img 
                        src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                        alt="Profile" 
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover border-2 border-white dark:border-slate-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-900 dark:text-white truncate">{user.displayName}</p>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 truncate">{user.email}</p>
                      </div>
                    </div>
                    <button 
                      onClick={onOpenProfile}
                      className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-[10px] font-black uppercase hover:bg-slate-50 dark:hover:bg-slate-600 transition-all dark:text-white"
                    >
                      Editar
                    </button>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Preferencias</h3>
                  <div className="space-y-3">
                    <div className="flex flex-col gap-3 p-4 bg-white dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <Bell className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Recordatorios Diarios</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500">Recibe avisos para tus tomas</p>
                          </div>
                        </div>
                        <button 
                          onClick={handleToggleReminders}
                          className={cn(
                            "w-10 h-6 rounded-full relative transition-colors",
                            remindersEnabled ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700"
                          )}
                        >
                          <motion.div 
                            animate={{ x: remindersEnabled ? 18 : 4 }}
                            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" 
                          />
                        </button>
                      </div>

                      {remindersEnabled && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-4"
                        >
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Mañana</label>
                              <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input 
                                  type="time" 
                                  value={morningTime}
                                  onChange={(e) => onUpdateMorningTime(e.target.value)}
                                  className="w-full h-10 pl-9 pr-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20"
                                />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Noche</label>
                              <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input 
                                  type="time" 
                                  value={eveningTime}
                                  onChange={(e) => onUpdateEveningTime(e.target.value)}
                                  className="w-full h-10 pl-9 pr-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20"
                                />
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={onTestNotification}
                            className="w-full py-2 px-4 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all flex items-center justify-center gap-2"
                          >
                            <Bell className="w-3 h-3" />
                            Probar Notificación
                          </button>

                          {notificationPermission === 'denied' && (
                            <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-100 dark:border-rose-900/30 flex gap-2">
                              <Info className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                              <p className="text-[9px] text-rose-800 dark:text-rose-300 font-medium leading-tight">
                                Las notificaciones están bloqueadas. Actívalas en los ajustes de tu navegador para recibir avisos.
                              </p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>

                    <button 
                      onClick={onToggleDarkMode}
                      className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                          isDarkMode ? "bg-indigo-900/30 text-indigo-400" : "bg-amber-50 text-amber-600"
                        )}>
                          {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Modo de Apariencia</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">{isDarkMode ? 'Oscuro' : 'Claro'}</p>
                        </div>
                      </div>
                      <div className={cn(
                        "w-10 h-6 rounded-full relative transition-colors",
                        isDarkMode ? "bg-indigo-600" : "bg-slate-200"
                      )}>
                        <motion.div 
                          animate={{ x: isDarkMode ? 18 : 4 }}
                          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" 
                        />
                      </div>
                    </button>
                  </div>
                </section>
                <section className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Ayuda y Soporte</h3>
                  <button 
                    onClick={onOpenInfo}
                    className="w-full flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <HelpCircle className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-indigo-900 dark:text-indigo-300">Guía de Uso y Protocolo</p>
                        <p className="text-[10px] text-indigo-400 dark:text-indigo-500">Aprende cómo realizar las tomas correctamente</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-indigo-300 group-hover:translate-x-1 transition-transform" />
                  </button>
                </section>
              </motion.div>
            )}

            {activeTab === 'data' && (
              <motion.div
                key="data"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6 sm:space-y-8"
              >
                <section className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Gestión de Datos</h3>
                  <div className="space-y-3">
                    <button 
                      onClick={onExport}
                      className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                          <Download className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Exportar Historial</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">Descargar mediciones en CSV</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button 
                      onClick={onGenerateTestData}
                      className="w-full flex items-center justify-between p-4 bg-indigo-50/30 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-900/30 rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                          <Activity className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-indigo-900 dark:text-indigo-300">Generar Datos de Prueba</p>
                          <p className="text-[10px] text-indigo-400 dark:text-indigo-500">Rellenar historial con ejemplos</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-indigo-300 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button 
                      onClick={onClearData}
                      className="w-full flex items-center justify-between p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-2xl hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
                          <Trash2 className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-rose-900 dark:text-rose-300">Borrar Todo</p>
                          <p className="text-[10px] text-rose-400 dark:text-rose-500">Eliminar historial permanentemente</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-rose-300 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </section>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex gap-3">
                  <Shield className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    Tus datos están protegidos y solo tú tienes acceso a ellos a través de tu cuenta de Google. 
                    No compartimos tu información médica con terceros.
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === 'about' && (
              <motion.div
                key="about"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6 sm:space-y-8"
              >
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-indigo-100 dark:shadow-none">
                    <Heart className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-display font-black text-slate-900 dark:text-white">TensioTrack</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Versión 2.1.0</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Créditos</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      Desarrollado para facilitar el seguimiento de la presión arterial siguiendo los estándares internacionales de la ESH y ESC.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Legal</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Esta aplicación es una herramienta de registro. No debe usarse para autodiagnóstico. 
                      En caso de valores inusualmente altos o bajos, contacte con su médico de inmediato.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
        >
          <X className="w-6 h-6 text-slate-400 dark:text-slate-500" />
        </button>
      </motion.div>
    </div>
  );
};
