import * as React from "react";
import { useAppStore } from "../store/useAppStore";
import { useClearData, useReadings, useDashboard, useUpdateUserProfile, useDeleteAccount } from "../lib/api";
import { exportToExcel } from "../lib/exportExcel";
import { 
  User, 
  Database, 
  Download, 
  Trash2, 
  ChevronRight,
  Activity,
  Scale,
  Ruler,
  Calendar,
  Save,
  Info,
  Globe,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Camera,
  X,
  Upload,
  Trash,
  LogOut,
  ShieldCheck,
  Lock,
  Server,
  AlertTriangle,
  Heart,
  Flag,
  Gavel,
  Shield,
  Fingerprint,
  Eye,
  EyeOff,
  History,
  Stethoscope,
  Dna,
  Ambulance,
  Pill,
  LockKeyhole
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/Button";
import { cn } from "../lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/Tooltip";
import { toast } from "sonner";
import { storage, ref, uploadBytes, getDownloadURL, deleteObject, auth } from "../firebase";
import { signOut } from "firebase/auth";

export function SettingsPage() {
  const { user, setActiveTab } = useAppStore();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState<'profile' | 'data' | 'privacy' | 'about'>('profile');
  
  const handleLogout = () => signOut(auth);

  const sections = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'data', label: 'Datos', icon: Database },
    { id: 'privacy', label: 'Privacidad', icon: Shield },
    { id: 'about', label: 'Acerca de', icon: Info },
  ] as const;
  const clearData = useClearData();
  const updateUserProfile = useUpdateUserProfile();
  const deleteAccount = useDeleteAccount();
  const { data: readings } = useReadings();
  const { data: dashboard } = useDashboard();
  const [isExporting, setIsExporting] = React.useState(false);
  const [showExportConfirm, setShowExportConfirm] = React.useState(false);
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = React.useState(false);

  // Health Data State
  const [age, setAge] = React.useState(user?.age?.toString() || '');
  const [weight, setWeight] = React.useState(user?.weight?.toString() || '');
  const [height, setHeight] = React.useState(user?.height?.toString() || '');
  const [sex, setSex] = React.useState<'male' | 'female' | 'other'>(user?.sex || 'male');
  const [isSmoker, setIsSmoker] = React.useState(user?.isSmoker || false);
  const [hasDiabetes, setHasDiabetes] = React.useState(user?.hasDiabetes || false);
  const [isHypertensiveMedicated, setIsHypertensiveMedicated] = React.useState(user?.isHypertensiveMedicated || false);
  const [activityLevel, setActivityLevel] = React.useState<'sedentary' | 'moderate' | 'active'>(user?.activityLevel || 'moderate');
  const [alcoholConsumption, setAlcoholConsumption] = React.useState<'none' | 'occasional' | 'frequent'>(user?.alcoholConsumption || 'none');
  const [saltIntake, setSaltIntake] = React.useState<'low' | 'normal' | 'high'>(user?.saltIntake || 'normal');
  const [stressLevel, setStressLevel] = React.useState<'low' | 'moderate' | 'high'>(user?.stressLevel || 'moderate');
  const [sleepQuality, setSleepQuality] = React.useState<'good' | 'average' | 'poor'>(user?.sleepQuality || 'average');
  const [familyHistory, setFamilyHistory] = React.useState(user?.familyHistory || false);
  const [caffeineIntake, setCaffeineIntake] = React.useState<'none' | 'low' | 'moderate' | 'high'>(user?.caffeineIntake || 'none');
  const [hasHighCholesterol, setHasHighCholesterol] = React.useState(user?.hasHighCholesterol || false);
  const [hasKidneyDisease, setHasKidneyDisease] = React.useState(user?.hasKidneyDisease || false);

  // Privacy State
  const [shareVitals, setShareVitals] = React.useState(true);
  const [shareMedication, setShareMedication] = React.useState(false);
  const [shareEmergency, setShareEmergency] = React.useState(true);
  const [shareReports, setShareReports] = React.useState(false);

  const isDirty = 
    age !== (user?.age?.toString() || '') ||
    weight !== (user?.weight?.toString() || '') ||
    height !== (user?.height?.toString() || '') ||
    sex !== (user?.sex || 'male') ||
    isSmoker !== (user?.isSmoker || false) ||
    hasDiabetes !== (user?.hasDiabetes || false) ||
    isHypertensiveMedicated !== (user?.isHypertensiveMedicated || false) ||
    activityLevel !== (user?.activityLevel || 'moderate') ||
    alcoholConsumption !== (user?.alcoholConsumption || 'none') ||
    saltIntake !== (user?.saltIntake || 'normal') ||
    stressLevel !== (user?.stressLevel || 'moderate') ||
    sleepQuality !== (user?.sleepQuality || 'average') ||
    familyHistory !== (user?.familyHistory || false) ||
    caffeineIntake !== (user?.caffeineIntake || 'none') ||
    hasHighCholesterol !== (user?.hasHighCholesterol || false) ||
    hasKidneyDisease !== (user?.hasKidneyDisease || false);

  const handleSaveHealthData = async () => {
    const parseNumber = (val: string) => {
      if (!val) return undefined;
      const normalized = val.replace(',', '.');
      const parsed = parseFloat(normalized);
      return isNaN(parsed) ? undefined : parsed;
    };

    try {
      await updateUserProfile.mutateAsync({
        age: age ? parseInt(age) : undefined,
        weight: parseNumber(weight),
        height: parseNumber(height),
        sex,
        isSmoker,
        hasDiabetes,
        isHypertensiveMedicated,
        activityLevel,
        alcoholConsumption,
        saltIntake,
        stressLevel,
        sleepQuality,
        familyHistory,
        caffeineIntake,
        hasHighCholesterol,
        hasKidneyDisease
      });
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecciona una imagen");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no debe superar los 2MB");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const storageRef = ref(storage, `avatars/${user.uid}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      await updateUserProfile.mutateAsync({ photoURL: downloadURL });
      toast.success("Avatar actualizado");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Error al subir la imagen");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarDelete = async () => {
    if (!user?.photoURL) return;
    
    setIsUploadingAvatar(true);
    try {
      if (user.photoURL.includes('firebasestorage.googleapis.com')) {
        const storageRef = ref(storage, `avatars/${user.uid}`);
        await deleteObject(storageRef);
      }
      
      await updateUserProfile.mutateAsync({ photoURL: null });
      toast.success("Avatar eliminado");
    } catch (error) {
      console.error("Error deleting avatar:", error);
      toast.error("Error al eliminar el avatar");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleClearData = async () => {
    setShowClearConfirm(false);
    try {
      await clearData.mutateAsync();
      toast.success("Todos los datos han sido eliminados");
    } catch (err) {
      toast.error("Error al borrar los datos");
    }
  };

  const handleDeleteAccount = async () => {
    setShowDeleteAccountConfirm(false);
    try {
      await deleteAccount.mutateAsync();
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleExport = async () => {
    if (!readings || readings.length === 0) {
      toast.info("No hay datos para exportar");
      return;
    }

    setShowExportConfirm(false);
    setIsExporting(true);
    try {
      await exportToExcel(readings, dashboard || null, user);
      toast.success("Excel generado correctamente");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Error al generar el Excel");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 md:gap-8 min-h-[calc(100vh-12rem)] animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Sidebar Navigation (Navigation Rail on sm/md, Full Drawer on lg) */}
      <aside className="hidden sm:flex flex-col w-20 lg:w-72 shrink-0 space-y-2 transition-all duration-300">
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] lg:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-2 lg:p-4 shadow-sm">
          <div className="hidden lg:block px-6 py-4 mb-2">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Ajustes</h3>
          </div>
          <nav className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <Tooltip key={section.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setActiveSection(section.id)}
                      className={cn(
                        "w-full flex items-center justify-center lg:justify-start gap-4 px-3 lg:px-6 py-4 rounded-2xl text-sm font-bold transition-all",
                        isActive 
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none" 
                          : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                      )}
                      aria-label={section.label}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span className="hidden lg:inline truncate">{section.label}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="lg:hidden">
                    {section.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </nav>
          
          <div className="h-[1px] bg-slate-100 dark:bg-slate-800 my-4 mx-2 lg:mx-4" />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center lg:justify-start gap-4 px-3 lg:px-6 py-4 rounded-2xl text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
                aria-label="Cerrar Sesión"
              >
                <LogOut className="w-5 h-5 shrink-0" />
                <span className="hidden lg:inline">Cerrar Sesión</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="lg:hidden">
              Cerrar Sesión
            </TooltipContent>
          </Tooltip>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              onClick={() => setActiveTab('dashboard')}
              className="group flex items-center justify-center lg:justify-start gap-3 px-3 lg:px-8 py-4 text-slate-400 hover:text-indigo-600 transition-colors"
              aria-label="Volver al Dashboard"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform shrink-0" />
              <span className="hidden lg:inline font-bold text-sm">Volver</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="lg:hidden">
            Volver al Dashboard
          </TooltipContent>
        </Tooltip>
      </aside>

      {/* Mobile Bottom Navigation (Portrait only) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-[50] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 px-4 pb-safe shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-between h-20 max-w-md mx-auto">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-2xl transition-all",
                  isActive ? "text-indigo-600" : "text-slate-400"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                  isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none" : "bg-transparent"
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">{section.label}</span>
              </button>
            );
          })}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center gap-1 px-4 py-2 text-rose-600"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Salir</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 pb-32 sm:pb-0">
        <AnimatePresence mode="wait">
          {activeSection === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {/* Back button for mobile portrait */}
              <button 
                onClick={() => setActiveTab('dashboard')}
                className="sm:hidden flex items-center gap-2 text-slate-500 font-bold text-sm mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver
              </button>
            {/* Profile Header Card */}
            <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-8 sm:p-12">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full -ml-32 -mb-32 blur-3xl" />
              
              <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                  <div className="relative group">
                    <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2.5rem] bg-indigo-600 flex items-center justify-center text-white text-5xl font-display font-black shadow-2xl shadow-indigo-200 dark:shadow-none overflow-hidden relative">
                      {user?.photoURL ? (
                        <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span>{user?.displayName?.charAt(0).toUpperCase() || 'P'}</span>
                      )}
                      
                      {/* Avatar Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingAvatar}
                          className="w-10 h-10 rounded-full bg-white text-indigo-600 flex items-center justify-center hover:scale-110 transition-transform"
                          title="Subir foto"
                        >
                          <Upload className="w-5 h-5" />
                        </button>
                        {user?.photoURL && (
                          <button 
                            onClick={handleAvatarDelete}
                            disabled={isUploadingAvatar}
                            className="w-10 h-10 rounded-full bg-white text-rose-600 flex items-center justify-center hover:scale-110 transition-transform"
                            title="Eliminar foto"
                          >
                            <Trash className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                      
                      {isUploadingAvatar && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleAvatarUpload} 
                      className="hidden" 
                      accept="image/*"
                    />
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 flex items-center justify-center text-indigo-600">
                      <Camera className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-4xl sm:text-5xl font-display font-black text-slate-900 dark:text-white tracking-tight">
                      {user?.displayName || 'Paciente'}
                    </h2>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
                      <span className="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Usuario Registrado
                      </span>
                      <span className="px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                        Paciente Activo
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Health Data Section Removed and Integrated */}


            {/* Personal Information Section */}
            <section className="space-y-6">
              <h3 className="text-2xl font-display font-black text-slate-900 dark:text-white px-4">Información Personal</h3>
              
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 sm:p-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                    <div className="relative">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="text" 
                        value={user?.displayName || ''} 
                        readOnly
                        className="w-full h-16 pl-14 pr-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-lg font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sexo Biológico</label>
                    <div className="flex bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700">
                      {(['male', 'female', 'other'] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setSex(s)}
                          className={cn(
                            "flex-1 py-3 text-xs font-black rounded-xl transition-all",
                            sex === s 
                              ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" 
                              : "text-slate-400 hover:text-slate-600"
                          )}
                        >
                          {s === 'male' ? 'Hombre' : s === 'female' ? 'Mujer' : 'Otro'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Age, Weight, Height Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Edad (años)</label>
                    <div className="relative">
                      <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="number" 
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="w-full h-16 pl-14 pr-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-lg font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Peso (kg)</label>
                    <div className="relative">
                      <Scale className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="text" 
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="w-full h-16 pl-14 pr-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-lg font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Altura (cm)</label>
                    <div className="relative">
                      <Ruler className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="number" 
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        className="w-full h-16 pl-14 pr-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-lg font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Activity Level and Other Factors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nivel de Actividad</label>
                    <div className="flex bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700">
                      {(['sedentary', 'moderate', 'active'] as const).map((level) => (
                        <button
                          key={level}
                          onClick={() => setActivityLevel(level)}
                          className={cn(
                            "flex-1 py-3 text-[10px] font-black rounded-xl transition-all uppercase tracking-tighter",
                            activityLevel === level 
                              ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" 
                              : "text-slate-400 hover:text-slate-600"
                          )}
                        >
                          {level === 'sedentary' ? 'Sedentario' : level === 'moderate' ? 'Moderado' : 'Activo'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Consumo de Alcohol</label>
                    <div className="flex bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700">
                      {(['none', 'occasional', 'frequent'] as const).map((level) => (
                        <button
                          key={level}
                          onClick={() => setAlcoholConsumption(level)}
                          className={cn(
                            "flex-1 py-3 text-[10px] font-black rounded-xl transition-all uppercase tracking-tighter",
                            alcoholConsumption === level 
                              ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" 
                              : "text-slate-400 hover:text-slate-600"
                          )}
                        >
                          {level === 'none' ? 'Nulo' : level === 'occasional' ? 'Ocasional' : 'Frecuente'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Consumo de Sal</label>
                    <div className="flex bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700">
                      {(['low', 'normal', 'high'] as const).map((level) => (
                        <button
                          key={level}
                          onClick={() => setSaltIntake(level)}
                          className={cn(
                            "flex-1 py-3 text-[10px] font-black rounded-xl transition-all uppercase tracking-tighter",
                            saltIntake === level 
                              ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" 
                              : "text-slate-400 hover:text-slate-600"
                          )}
                        >
                          {level === 'low' ? 'Bajo' : level === 'normal' ? 'Normal' : 'Alto'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nivel de Estrés</label>
                    <div className="flex bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700">
                      {(['low', 'moderate', 'high'] as const).map((level) => (
                        <button
                          key={level}
                          onClick={() => setStressLevel(level)}
                          className={cn(
                            "flex-1 py-3 text-[10px] font-black rounded-xl transition-all uppercase tracking-tighter",
                            stressLevel === level 
                              ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" 
                              : "text-slate-400 hover:text-slate-600"
                          )}
                        >
                          {level === 'low' ? 'Bajo' : level === 'moderate' ? 'Medio' : 'Alto'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Calidad del Sueño</label>
                    <div className="flex bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700">
                      {(['good', 'average', 'poor'] as const).map((level) => (
                        <button
                          key={level}
                          onClick={() => setSleepQuality(level)}
                          className={cn(
                            "flex-1 py-3 text-[10px] font-black rounded-xl transition-all uppercase tracking-tighter",
                            sleepQuality === level 
                              ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" 
                              : "text-slate-400 hover:text-slate-600"
                          )}
                        >
                          {level === 'good' ? 'Buena' : level === 'average' ? 'Normal' : 'Mala'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Consumo de Cafeína</label>
                    <div className="flex bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700">
                      {(['none', 'low', 'moderate', 'high'] as const).map((level) => (
                        <button
                          key={level}
                          onClick={() => setCaffeineIntake(level)}
                          className={cn(
                            "flex-1 py-3 text-[10px] font-black rounded-xl transition-all uppercase tracking-tighter",
                            caffeineIntake === level 
                              ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" 
                              : "text-slate-400 hover:text-slate-600"
                          )}
                        >
                          {level === 'none' ? 'Nulo' : level === 'low' ? 'Bajo' : level === 'moderate' ? 'Medio' : 'Alto'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <button 
                    onClick={() => setFamilyHistory(!familyHistory)}
                    className={cn(
                      "flex items-center justify-center gap-3 p-5 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest",
                      familyHistory 
                        ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-600" 
                        : "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 text-slate-400 hover:border-slate-200"
                    )}
                  >
                    Antecedentes HTA
                  </button>
                  <button 
                    onClick={() => setIsSmoker(!isSmoker)}
                    className={cn(
                      "flex items-center justify-center gap-3 p-5 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest",
                      isSmoker 
                        ? "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-600" 
                        : "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 text-slate-400 hover:border-slate-200"
                    )}
                  >
                    Fumador
                  </button>
                  <button 
                    onClick={() => setHasDiabetes(!hasDiabetes)}
                    className={cn(
                      "flex items-center justify-center gap-3 p-5 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest",
                      hasDiabetes 
                        ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-600" 
                        : "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 text-slate-400 hover:border-slate-200"
                    )}
                  >
                    Diabetes
                  </button>
                  <button 
                    onClick={() => setIsHypertensiveMedicated(!isHypertensiveMedicated)}
                    className={cn(
                      "flex items-center justify-center gap-3 p-5 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest",
                      isHypertensiveMedicated 
                        ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600" 
                        : "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 text-slate-400 hover:border-slate-200"
                    )}
                  >
                    Medicado (HTA)
                  </button>
                  <button 
                    onClick={() => setHasHighCholesterol(!hasHighCholesterol)}
                    className={cn(
                      "flex items-center justify-center gap-3 p-5 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest",
                      hasHighCholesterol 
                        ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-600" 
                        : "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 text-slate-400 hover:border-slate-200"
                    )}
                  >
                    Colesterol Alto
                  </button>
                  <button 
                    onClick={() => setHasKidneyDisease(!hasKidneyDisease)}
                    className={cn(
                      "flex items-center justify-center gap-3 p-5 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest",
                      hasKidneyDisease 
                        ? "bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800 text-cyan-600" 
                        : "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 text-slate-400 hover:border-slate-200"
                    )}
                  >
                    Enf. Renal
                  </button>
                </div>
              </div>
            </section>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-8">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className="px-10 py-4 text-sm font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest"
              >
                Cancelar
              </button>
              <Button 
                onClick={handleSaveHealthData}
                disabled={!isDirty || updateUserProfile.isPending}
                isLoading={updateUserProfile.isPending}
                className="h-16 px-12 rounded-3xl shadow-2xl shadow-indigo-200 dark:shadow-none text-lg"
              >
                Actualizar Perfil
              </Button>
            </div>
          </motion.div>
        )}

          {activeSection === 'data' && (
            <motion.div
              key="data"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8 w-full overflow-x-hidden"
            >
              <div className="bg-white dark:bg-slate-900 rounded-3xl sm:rounded-[3rem] border border-slate-100 dark:border-slate-800 p-4 sm:p-12 overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 sm:mb-12">
                  <div className="max-w-3xl min-w-0">
                    <h3 className="text-2xl sm:text-3xl font-display font-black text-slate-900 dark:text-white break-words">Gestión de Datos</h3>
                    <p className="text-slate-500 mt-3 sm:mt-4 text-base sm:text-lg leading-relaxed break-words">
                      Administra tu historial médico y la seguridad de tu información. 
                      Tus datos se sincronizan de forma segura para garantizar acceso y protección total.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 px-6 py-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 shrink-0">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Sincronizado con la Nube</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Export Card */}
                    <div className="p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-6 shadow-sm flex flex-col h-full">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                        <Download className="w-6 h-6 sm:w-7 sm:h-7" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white break-words">Exportar Historial</h4>
                        <p className="text-sm text-slate-500 mt-2 leading-relaxed break-words">
                          Genera un informe completo en Excel con todas tus lecturas, promedios y notas. Ideal para revisiones médicas.
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <Globe className="w-3 h-3" />
                          Descarga vía SSL/TLS 1.3
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowExportConfirm(true)}
                          className="w-full h-14 rounded-2xl border-slate-200 hover:bg-slate-50 font-bold"
                        >
                          Exportar a Excel
                        </Button>
                      </div>
                    </div>

                    {/* Danger Zone Card */}
                    <div className="p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-6 shadow-sm flex flex-col h-full">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-rose-600">
                        <Trash2 className="w-6 h-6 sm:w-7 sm:h-7" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white break-words">Zona de Peligro</h4>
                        <p className="text-sm text-slate-500 mt-2 leading-relaxed break-words">
                          Ésta acción es irreversible. Gestiona la eliminación de tu historial médico o la baja definitiva del sistema.
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-100 dark:border-rose-800/50 text-[10px] font-black text-rose-600 uppercase tracking-widest">
                          <AlertTriangle className="w-3 h-3" />
                          Acción Crítica e Irreversible
                        </div>

                        <Button 
                          variant="outline" 
                          onClick={() => setShowClearConfirm(true)}
                          className="w-full h-14 rounded-2xl border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
                        >
                          Limpiar Historial de Lecturas
                        </Button>

                        <Button 
                          variant="outline" 
                          onClick={() => setShowDeleteAccountConfirm(true)}
                          className="w-full h-14 rounded-2xl border-rose-100 text-rose-600 hover:bg-rose-50 font-bold"
                        >
                          Eliminar Cuenta Definitivamente
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Military Grade Infrastructure Section */}
                  <div className="mt-8 p-3 sm:p-12 rounded-3xl sm:rounded-[3rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 relative overflow-hidden w-full">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full -mr-48 -mt-48 blur-3xl" />
                    
                    <div className="relative flex flex-col lg:flex-row gap-8 lg:gap-12 items-center w-full">
                      <div className="w-full lg:w-1/3 aspect-video rounded-2xl sm:rounded-[2rem] bg-slate-900 dark:bg-slate-950 overflow-hidden shadow-2xl relative group shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent opacity-50" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Server className="w-12 h-12 sm:w-16 sm:h-16 text-indigo-500/30" />
                        </div>
                        {/* Abstract security pattern */}
                        <div className="absolute inset-0 opacity-20 pointer-events-none">
                          <div className="absolute top-4 left-4 w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                          <div className="absolute bottom-8 right-12 w-3 h-3 rounded-full bg-emerald-400 animate-pulse delay-75" />
                          <div className="absolute top-1/2 left-1/4 w-1 h-1 rounded-full bg-indigo-400 animate-pulse delay-150" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 w-full space-y-4 sm:space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                            <ShieldCheck className="w-6 h-6" />
                          </div>
                          <h4 className="text-xl sm:text-2xl font-display font-black text-slate-900 dark:text-white break-words overflow-wrap-anywhere">Infraestructura de Grado Militar</h4>
                        </div>
                        
                        <p className="text-sm sm:text-base text-slate-500 leading-relaxed break-words">
                          Todos sus datos se almacenan en buckets regionales de Google Cloud con cifrado **AES-256** en reposo. Implementamos protocolos de seguridad avanzados para garantizar la máxima privacidad de su información médica.
                        </p>

                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full">
                          <div className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            SSL/TLS 1.3
                          </div>
                          <div className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                            <Lock className="w-3 h-3 text-indigo-500" />
                            AES-256 BIT
                          </div>
                          <div className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                            <Server className="w-3 h-3 text-amber-500" />
                            Replicación Triple
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirmation Overlays */}
            <AnimatePresence>
              {showExportConfirm && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm"
                >
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 max-w-md w-full text-center space-y-6"
                  >
                    <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 mx-auto">
                      <Download className="w-10 h-10" />
                    </div>
                    <div>
                      <h4 className="text-2xl font-display font-black text-slate-900 dark:text-white">¿Exportar datos?</h4>
                      <p className="text-slate-500 mt-2">Se generará un archivo Excel con todo tu historial de lecturas.</p>
                    </div>
                    <div className="flex gap-4">
                      <Button variant="outline" onClick={() => setShowExportConfirm(false)} className="flex-1 h-14 rounded-2xl">Cancelar</Button>
                      <Button onClick={handleExport} isLoading={isExporting} className="flex-1 h-14 rounded-2xl">Exportar</Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {showClearConfirm && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm"
                >
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 max-w-md w-full text-center space-y-6"
                  >
                    <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/30 rounded-full flex items-center justify-center text-rose-600 mx-auto">
                      <Trash2 className="w-10 h-10" />
                    </div>
                    <div>
                      <h4 className="text-2xl font-display font-black text-slate-900 dark:text-white">¿Borrar historial?</h4>
                      <p className="text-slate-500 mt-2">Ésta acción es irreversible. Se eliminarán permanentemente todas tus lecturas registradas, pero mantendrás tu cuenta.</p>
                    </div>
                    <div className="flex gap-4">
                      <Button variant="outline" onClick={() => setShowClearConfirm(false)} className="flex-1 h-14 rounded-2xl">Cancelar</Button>
                      <Button onClick={handleClearData} className="flex-1 h-14 rounded-2xl bg-rose-600 hover:bg-rose-700">Borrar Todo</Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {showDeleteAccountConfirm && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm"
                >
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 max-w-md w-full text-center space-y-6"
                  >
                    <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/30 rounded-full flex items-center justify-center text-rose-600 mx-auto">
                      <AlertTriangle className="w-10 h-10" />
                    </div>
                    <div>
                      <h4 className="text-2xl font-display font-black text-slate-900 dark:text-white">¿Eliminar cuenta?</h4>
                      <p className="text-slate-500 mt-2">Ésta acción es irreversible. Se eliminarán permanentemente todos tus datos y tu acceso a la plataforma.</p>
                    </div>
                    <div className="flex gap-4">
                      <Button variant="outline" onClick={() => setShowDeleteAccountConfirm(false)} className="flex-1 h-14 rounded-2xl">Cancelar</Button>
                      <Button onClick={handleDeleteAccount} isLoading={deleteAccount.isPending} className="flex-1 h-14 rounded-2xl bg-rose-600 hover:bg-rose-700">Eliminar Cuenta</Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

          {activeSection === 'privacy' && (
            <motion.div
              key="privacy"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h3 className="text-3xl font-display font-black text-slate-900 dark:text-white">Centro de Control de Privacidad</h3>
                <p className="text-slate-500 dark:text-slate-400">
                  Gestione cómo se protegen sus datos y quién puede acceder a sus registros históricos. El cifrado de alta seguridad está activo por defecto.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Encryption Status Card */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 space-y-8 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600">
                        <Shield className="w-7 h-7" />
                      </div>
                      <div>
                        <h4 className="text-xl font-display font-black text-slate-900 dark:text-white">Estado de Cifrado de Datos</h4>
                        <div className="flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase tracking-widest mt-1">
                          <LockKeyhole className="w-3 h-3" />
                          Bóveda Asegurada
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    Sus registros están protegidos con tecnología de seguridad avanzada y cifrado automático. Esto garantiza que su información de salud sea privada y que nadie más que usted pueda verla.
                  </p>
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-widest pt-2">
                    <ShieldCheck className="w-4 h-4" />
                    Protección Activa 24/7
                  </div>
                </div>

                {/* Account Security Card (Firebase) */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 space-y-8">
                  <h4 className="text-xl font-display font-black text-slate-900 dark:text-white">Seguridad de la Cuenta</h4>
                  <p className="text-xs text-slate-500 font-medium">Su cuenta está protegida por los sistemas de seguridad de Google.</p>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center text-indigo-600 shadow-sm">
                          <User className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Acceso con Google</span>
                      </div>
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md">Conectado</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center text-indigo-600 shadow-sm">
                          <Server className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Sincronización Cloud</span>
                      </div>
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md">Activa</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Medical Data Sharing Card */}
              <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 p-8 sm:p-12 space-y-10 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-2xl font-display font-black text-slate-900 dark:text-white">Compartir Datos Médicos</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Permisos granulares para sus datos biométricos sensibles.</p>
                  </div>
                  <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                    <ShieldCheck className="w-4 h-4" />
                    Entorno de Cumplimiento Médico
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { id: 'vitals', label: 'Tensión y Pulso', desc: 'Sus lecturas diarias y ritmo cardíaco', icon: Activity, state: shareVitals, setState: setShareVitals },
                    { id: 'meds', label: 'Medicamentos', desc: 'Información sobre sus pastillas y recetas', icon: Pill, state: shareMedication, setState: setShareMedication },
                    { id: 'emergency', label: 'Acceso de Emergencia', desc: 'Permitir a los médicos de urgencias ver sus datos', icon: Ambulance, state: shareEmergency, setState: setShareEmergency },
                    { id: 'reports', label: 'Informes de Salud', desc: 'Resúmenes mensuales para su médico', icon: History, state: shareReports, setState: setShareReports },
                  ].map((item) => (
                    <div key={item.id} className="p-6 rounded-[2rem] border border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                          <item.icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h5 className="text-sm font-bold text-slate-900 dark:text-white">{item.label}</h5>
                          <p className="text-xs text-slate-500">{item.desc}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => item.setState(!item.state)}
                        className={cn(
                          "w-12 h-6 rounded-full transition-colors relative flex-shrink-0",
                          item.state ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                          item.state ? "left-7" : "left-1"
                        )} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Ownership Statement */}
              <div className="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 p-8 flex flex-col sm:flex-row items-center gap-6">
                <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm flex-shrink-0">
                  <Fingerprint className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xl font-display font-black text-slate-900 dark:text-white">Usted es el dueño de sus datos</h4>
                  <p className="text-sm text-slate-500">En TensioTrack, creemos que su información de salud le pertenece solo a usted. Puede descargar sus datos o eliminarlos permanentemente en cualquier momento desde la sección de Datos.</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'about' && (
            <motion.div
              key="about"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 p-8 sm:p-12 space-y-10"
            >
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-200 dark:shadow-none">
                <Activity className="text-white w-12 h-12" />
              </div>
              <div>
                <h3 className="text-4xl font-display font-black text-slate-900 dark:text-white tracking-tight">TensioTrack</h3>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-2">Versión 2.4.0 Professional</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Mission Card */}
              <div className="bg-white dark:bg-slate-800/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 space-y-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600">
                    <Flag className="w-6 h-6" />
                  </div>
                  <h4 className="text-2xl font-display font-black text-slate-900 dark:text-white">Misión</h4>
                </div>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  TensioTrack ha sido creado para ayudarle a cuidar de su salud de forma sencilla y segura. Nuestra misión es hacer que llevar el control de su tensión sea una tarea fácil, permitiéndole guardar sus registros a lo largo del tiempo para que usted y su médico tengan siempre una información clara y precisa sobre su bienestar.
                </p>
              </div>

              {/* Medical Disclaimer Card */}
              <div className="bg-rose-50/50 dark:bg-rose-900/10 rounded-[2.5rem] border border-rose-100 dark:border-rose-900/20 p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center text-rose-600">
                    <Gavel className="w-6 h-6" />
                  </div>
                  <h4 className="text-2xl font-display font-black text-slate-900 dark:text-white">Descargo de Responsabilidad Clínica</h4>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed italic font-medium">
                  Esta aplicación es una herramienta de registro y no sustituye el diagnóstico médico profesional. Consulte siempre con su médico antes de realizar cambios en su tratamiento o si presenta síntomas inusuales. Los datos archivados son para propósitos informativos.
                </p>
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-widest pt-2">
                  <ShieldCheck className="w-4 h-4" />
                  Compliance Verified 2026
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center gap-4">
              <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                Hecho con <Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> en Gijón, Asturias
              </div>
              <p className="text-[10px] text-slate-400 font-medium max-w-md text-center">
                TensioTrack es una marca registrada. Todos los derechos reservados © 2026.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </div>
);
}
