import * as React from "react";
import { useAppStore } from "../store/useAppStore";
import { useClearData, useReadings, useDashboard, useUpdateUserProfile, useDeleteAccount } from "../lib/api";
import { exportToExcel } from "../lib/exportExcel";
import jsPDF from "jspdf";
import { seedClinicalData } from "../lib/seeder";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/Button";
import { cn } from "../lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "./ui/Tooltip";
import { toast } from "sonner";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { kgToLb, lbToKg, cmToIn, inToCm, calculateBMI, getBMICategory } from "../lib/conversions";
import { LogOut, ArrowLeft, Upload, Trash2, Camera, User, Cake, Scale, TrendingUp, Ruler, Activity, ChevronDown, History, Heart, Clock, Save, Download, Globe, AlertTriangle, FlaskConical, Server, ShieldCheck, CheckCircle2, Lock, Shield, Fingerprint, Flag, Gavel, Pill, Ambulance, Database, Info, FileText } from "lucide-react";

const PDFIcon = ({ size = 18, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M7 13h2a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H7v2" />
    <path d="M12 13h1a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-1v-4z" />
    <path d="M17 13h3v4" />
    <path d="M17 15h2" />
  </svg>
);

export function SettingsPage() {
  const { 
    user, 
    setActiveTab,
    unitSystem,
    setUnitSystem,
    measurementFrequency,
    setMeasurementFrequency,
    autoBmi,
    setAutoBmi,
    showTrends,
    setShowTrends,
    activeSettingsSection: activeSection,
    setActiveSettingsSection: setActiveSection
  } = useAppStore();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);
  
  const handleLogout = () => signOut(auth);

  const sections = [
    { id: 'profile', label: 'Datos de Salud', icon: Heart },
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
  const [isSeeding, setIsSeeding] = React.useState(false);

  // Health Data State
  const [age, setAge] = React.useState(user?.age?.toString() || '');
  const [weight, setWeight] = React.useState(user?.weight?.toString() || '');
  const [height, setHeight] = React.useState(user?.height?.toString() || '');

  // Handle unit system conversion
  const toggleUnitSystem = (newSystem: 'metric' | 'imperial') => {
    if (newSystem === unitSystem) return;

    const currentWeight = parseFloat(weight.replace(',', '.'));
    const currentHeight = parseFloat(height.replace(',', '.'));

    if (!isNaN(currentWeight)) {
      const convertedWeight = newSystem === 'imperial' ? kgToLb(currentWeight) : lbToKg(currentWeight);
      setWeight(convertedWeight.toFixed(1));
    }

    if (!isNaN(currentHeight)) {
      const convertedHeight = newSystem === 'imperial' ? cmToIn(currentHeight) : inToCm(currentHeight);
      setHeight(convertedHeight.toFixed(1));
    }

    setUnitSystem(newSystem);
  };

  const bmi = React.useMemo(() => {
    const w = parseFloat(weight.replace(',', '.'));
    const h = parseFloat(height.replace(',', '.'));
    if (isNaN(w) || isNaN(h)) return 0;
    return calculateBMI(w, h, unitSystem);
  }, [weight, height, unitSystem]);

  const bmiCategory = React.useMemo(() => getBMICategory(bmi), [bmi]);
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

  const getFormattedUpdateDate = () => {
    if (!user?.updatedAt) return 'Sin actualizar';
    
    let date: Date;
    if (user.updatedAt?.toDate) {
      date = user.updatedAt.toDate();
    } else {
      date = new Date(user.updatedAt);
    }

    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Actualizado hace poco';
    } else if (diffInHours < 24 && date.getDate() === now.getDate()) {
      return `Actualizado hoy a las ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return `Actualizado el ${date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}`;
    }
  };

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
        hasKidneyDisease,
        photoURL: user?.photoURL // Persistent fix for Base64 avatars
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

    setIsUploadingAvatar(true);
    
    try {
      // Usamos Base64 para evitar la dependencia de Firebase Storage
      const reader = new FileReader();
      
      const uploadPromise = new Promise<string>((resolve, reject) => {
        reader.onload = async (event) => {
          try {
            const img = new Image();
            img.src = event.target?.result as string;
            
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_WIDTH = 256;
              const MAX_HEIGHT = 256;
              let width = img.width;
              let height = img.height;

              if (width > height) {
                if (width > MAX_WIDTH) {
                  height *= MAX_WIDTH / width;
                  width = MAX_WIDTH;
                }
              } else {
                if (height > MAX_HEIGHT) {
                  width *= MAX_HEIGHT / height;
                  height = MAX_HEIGHT;
                }
              }
              
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0, width, height);
              
              const base64ImageUrl = canvas.toDataURL('image/jpeg', 0.8);
              resolve(base64ImageUrl);
            };
            
            img.onerror = () => reject(new Error("Error al procesar la imagen"));
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error("Error al leer el archivo"));
        reader.readAsDataURL(file);
      });

      const base64Url = await uploadPromise;
      await updateUserProfile.mutateAsync({ photoURL: base64Url });
      toast.success("Avatar actualizado correctamente");
    } catch (error) {
      console.error("Error updating avatar:", error);
      toast.error("Error al actualizar la imagen de perfil");
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAvatarDelete = async () => {
    if (!user?.photoURL) return;
    
    setIsUploadingAvatar(true);
    try {
      await updateUserProfile.mutateAsync({ photoURL: null });
      toast.success("Avatar eliminado correctamente");
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
      // Re-applying PDF generation logic using jsPDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Basic Header
      pdf.setFontSize(22);
      pdf.setTextColor(103, 80, 165); // Primary color
      pdf.text('Informe de Datos Históricos', 20, 20);
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generado el: ${new Date().toLocaleDateString('es-ES')} - TensioTrack Pro`, 20, 28);

      // User Info
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Paciente: ${user?.displayName || 'Usuario'}`, 20, 40);
      pdf.text(`Edad: ${user?.age || '--'} años`, 20, 46);
      pdf.text(`Peso: ${user?.weight || '--'} kg | Altura: ${user?.height || '--'} cm`, 20, 52);

      // Simple Table Headers
      pdf.setFillColor(243, 238, 246);
      pdf.rect(20, 60, 170, 10, 'F');
      pdf.setFontSize(10);
      pdf.text('Fecha', 25, 66.5);
      pdf.text('Sistólica', 65, 66.5);
      pdf.text('Diastólica', 95, 66.5);
      pdf.text('Pulso', 125, 66.5);
      pdf.text('Momento', 155, 66.5);

      // Table Rows (limit to recent readings for basic PDF implementation)
      let y = 78;
      const recentReadings = [...readings].sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()).slice(0, 25);
      
      recentReadings.forEach((r, i) => {
        if (y > 270) {
          pdf.addPage();
          y = 20;
        }
        
        pdf.setFontSize(9);
        const date = new Date(r.recordedAt).toLocaleDateString('es-ES');
        pdf.text(date, 25, y);
        pdf.text(`${r.systolic} mmHg`, 65, y);
        pdf.text(`${r.diastolic} mmHg`, 95, y);
        pdf.text(`${r.heartRate} PPM`, 125, y);
        pdf.text(r.slot === 'morning' ? 'Mañana' : 'Noche', 155, y);
        
        y += 8;
      });

      pdf.save(`historial_tensiotrack_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("Informe PDF generado correctamente");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Error al generar el informe PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    toast.info("Generando datos clínicos en la nube...", { duration: 3000 });
    try {
      await seedClinicalData();
      toast.success("Se han generado 6 períodos clínicos. Recarga la página.");
      setTimeout(() => window.location.reload(), 2000);
    } catch (e) {
      toast.error("Error al generar datos de prueba");
      console.error(e);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8 min-h-[calc(100vh-12rem)] animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Top Navigation Tabs (Desktop/Tablet) - Adaptive MD3 Rail-style Header */}
      <TooltipProvider delayDuration={0}>
        <div className="hidden sm:flex items-center justify-between w-full border-b border-surface-highest/10 pt-1 pb-4 px-2 md:px-4 gap-2">
          {/* Left: Global Back Action */}
          <div className="flex items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className="flex items-center justify-center gap-2 px-3 md:px-4 h-11 rounded-full text-sm font-black text-on-surface-variant hover:bg-surface-high transition-all active:scale-95 group"
                  aria-label="Volver al Panel Principal"
                >
                  <ArrowLeft className="text-[20px] group-hover:-translate-x-0.5 transition-transform" />
                  <span className="hidden md:inline-block">Volver</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="md:hidden">Volver al Panel</TooltipContent>
            </Tooltip>
          </div>

          {/* Center: Section Navigation */}
          <div className="flex items-center p-1.5 bg-surface-low rounded-[2rem] gap-1 shadow-inner border border-surface-highest/5">
            {sections.map((section) => {
              const isActive = activeSection === section.id;
              const Icon = section.icon;
              // Very short labels for cramped spaces
              const shortLabel = section.id === 'profile' ? 'Salud' : section.id === 'about' ? 'Info' : section.label;
              
              return (
                <Tooltip key={section.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setActiveSection(section.id)}
                      className={cn(
                        "flex items-center justify-center transition-all duration-300 relative h-10 rounded-full active:scale-95",
                        isActive 
                          ? "bg-primary text-white shadow-md shadow-primary/20 px-4 md:px-6 ring-2 ring-primary/20" 
                          : "text-on-surface-variant hover:bg-surface-high px-3 md:px-4"
                      )}
                      aria-label={section.label}
                    >
                      <Icon className={cn("text-[20px] transition-transform", isActive ? "scale-105" : "scale-100")} strokeWidth={isActive ? 2.5 : 2} />
                      
                      {/* MD3 Logic: Active item always shows text on tablet/desktop. Others show text only on larger screens. */}
                      <span className={cn(
                        "whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out",
                        isActive 
                          ? "ml-2 opacity-100 max-w-[120px] font-bold text-xs md:text-sm" // Fully visible when active
                          : "ml-0 opacity-0 max-w-0 md:ml-2 md:opacity-100 md:max-w-[120px] lg:max-w-none text-xs md:text-sm" // Hidden on small tablet, visible on md (tablet landscape) and desktop
                      )}>
                        {isActive ? shortLabel : (
                          <>
                            <span className="hidden xl:inline">{section.label}</span>
                            <span className="hidden md:inline xl:hidden">{shortLabel}</span>
                          </>
                        )}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className={cn("z-[100]", isActive ? "hidden" : "md:hidden")}>
                    {section.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
          
          {/* Right: Exit Action */}
          <div className="flex items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 px-3 md:px-5 h-11 rounded-full text-xs md:text-sm font-bold text-destructive hover:bg-destructive/10 transition-all active:scale-95"
                  aria-label="Cerrar Sesión"
                >
                  <LogOut className="text-[20px]" />
                  <span className="hidden md:inline">Cerrar Sesión</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="md:hidden">Cerrar Sesión</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>

      {/* Mobile Bottom Navigation (Portrait only) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-[50] bg-surface-low/95 backdrop-blur-xl pb-safe shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
        <div className="grid grid-cols-5 h-20 w-full">
          {sections.map((section) => {
            const IconComponent = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 transition-all relative active:scale-90",
                  isActive ? "text-primary" : "text-on-surface-variant"
                )}
                aria-label={section.label}
              >
                <div className={cn(
                  "relative w-16 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                  isActive ? "bg-primary/10" : "bg-transparent hover:bg-surface-low"
                )}>
                  <IconComponent className={cn("text-[24px] transition-transform", isActive ? "scale-110" : "scale-100")} />
                </div>
                <span className={cn(
                  "text-[10px] font-bold tracking-tight transition-all truncate w-full px-1 text-center",
                  isActive ? "font-black" : "font-medium"
                )}>
                  {section.id === 'profile' ? 'Salud' : section.id === 'about' ? 'Info' : section.label}
                </span>
              </button>
            );
          })}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center gap-1 text-destructive active:scale-90 transition-all"
            aria-label="Cerrar Sesión"
          >
            <div className="w-16 h-8 rounded-full flex items-center justify-center hover:bg-destructive/10 transition-all">
              <LogOut className="text-[24px]" />
            </div>
            <span className="text-[10px] font-bold tracking-tight">Salir</span>
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
                className="sm:hidden flex items-center gap-2 text-on-surface-variant font-bold text-sm mb-4 active:scale-95 transition-all"
                aria-label="Volver al Panel Principal"
              >
                <ArrowLeft className="text-[16px]" />
                Volver al Panel Principal
              </button>
            {/* Profile Header Card - Stitch Redesign */}
            <div className="relative overflow-hidden bg-surface-low rounded-[3.5rem] shadow-sm p-10 sm:p-12">
              <div className="relative flex flex-col md:flex-row items-center gap-8 md:gap-12">
                {/* Avatar Section */}
                <div className="relative flex-shrink-0">
                  {/* Outer Purple Glow Ring */}
                  <div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-[#9D8BFF] to-[#B39DFF] opacity-60 blur-[2px]" />
                  
                  <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-surface-low p-1.5 shadow-2xl">
                    <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-[#2D2A32] relative">
                      {user?.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt="Profile" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer" 
                        />
                      ) : (
                        <span className="text-5xl font-display font-black text-white">
                          {user?.displayName?.charAt(0).toUpperCase() || 'P'}
                        </span>
                      )}
                      
                      {isUploadingAvatar && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Camera FAB (Image style) */}
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute bottom-1 right-1 w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center text-[#2D2A32] transform transition-transform hover:scale-110 active:scale-95 z-20 border border-surface-highest/10"
                    aria-label="Subir foto de perfil"
                  >
                    <Camera size={20} strokeWidth={2.5} />
                  </button>
                  
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleAvatarUpload} 
                    className="hidden" 
                    accept="image/*"
                  />
                </div>

                {/* Info Section */}
                <div className="flex-1 text-center md:text-left space-y-6 min-w-0">
                  <h2 className="text-display-md font-display font-black text-on-surface tracking-tighter leading-tight break-words">
                    {user?.displayName || 'Paciente'}
                  </h2>
                  
                  <div className="space-y-6">
                    <p className="max-w-xl text-lg text-on-surface-variant font-medium leading-relaxed opacity-80 mx-auto md:mx-0">
                      Personaliza y gestiona tus métricas biométricas esenciales para un seguimiento preciso y un bienestar optimizado.
                    </p>
                    
                    <div className="flex justify-center md:justify-start pt-2">
                      <div className="inline-flex px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-black uppercase tracking-[0.15em] text-primary ethereal-blur shadow-sm whitespace-nowrap">
                        PACIENTE ACTIVO
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Health Data Section Removed and Integrated */}


            {/* Personal Information Section */}
            <section className="space-y-6">
              <header className="px-4 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-headline-lg font-extrabold tracking-tight font-display text-on-surface mb-2">Datos de Salud</h3>
                  <p className="text-on-surface-variant text-lg">Personaliza y gestiona tus métricas biométricas esenciales para un seguimiento preciso.</p>
                </div>
              </header>
              
              <div className="bg-surface-low rounded-[2.5rem] p-8 sm:p-10 space-y-10 shadow-sm">
                <div className="flex flex-col gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-on-surface-variant ml-1">Nombre Completo</label>
                    <div className="relative">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant bg-surface-low p-1 rounded-lg" />
                      <input 
                        type="text" 
                        value={user?.displayName || ''} 
                        readOnly
                        className="w-full h-16 pl-14 pr-6 bg-surface rounded-2xl text-lg font-bold text-foreground focus:ring-2 focus:ring-primary outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-bold text-on-surface-variant ml-1">Sexo Biológico</label>
                    <div className="flex bg-surface-high p-1 rounded-full max-w-md">
                      {(['male', 'female', 'other'] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setSex(s)}
                          className={cn(
                            "flex-1 py-2 px-4 rounded-full text-sm transition-all hover:scale-[1.02] active:scale-[0.97]",
                            sex === s 
                              ? "bg-white shadow-sm font-bold text-primary" 
                              : "font-medium text-on-surface-variant"
                          )}
                        >
                          {s === 'male' ? 'Hombre' : s === 'female' ? 'Mujer' : 'Otro'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Age, Weight, Height, BMI Grid - 4x1 on Desktop, Responsive 2x2/1x1 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
                  {/* Edad Card */}
                  <div className="bg-white rounded-[2.5rem] p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl shadow-sm h-full group relative overflow-hidden active:scale-[0.98]">
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-sm shrink-0 transition-transform group-hover:rotate-12">
                        <Cake size={22} strokeWidth={2.5} />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40">VERIFICADO</span>
                    </div>
                    <div>
                      <h3 className="text-on-surface-variant font-bold text-sm mb-1">Edad</h3>
                      <div className="flex items-baseline gap-1.5 min-w-0">
                        <input 
                          type="number" 
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          className="w-[1.8em] bg-transparent text-4xl sm:text-5xl font-black font-display text-on-surface outline-none p-0 border-none focus:ring-0 leading-none transition-all"
                          placeholder="--"
                        />
                        <span className="text-on-surface-variant font-bold text-sm sm:text-base whitespace-nowrap">años</span>
                      </div>
                    </div>
                  </div>

                  {/* Weight Card */}
                  <div className="bg-white rounded-[2.5rem] p-6 flex flex-col justify-between shadow-sm transition-all duration-300 hover:shadow-xl h-full group relative overflow-hidden active:scale-[0.98]">
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-sm shrink-0 transition-transform group-hover:rotate-12">
                        <Scale size={22} strokeWidth={2.5} />
                      </div>
                      <div className="flex items-center gap-1 text-destructive font-black text-[10px] whitespace-nowrap">
                        <TrendingUp size={12} strokeWidth={3} />
                        <span>+0.2 kg</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-on-surface-variant font-bold text-sm mb-1">Peso Actual</h3>
                      <div className="flex items-baseline gap-1.5 min-w-0">
                        <input 
                          type="text" 
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          className="w-[2.2em] bg-transparent text-4xl sm:text-5xl font-black font-display text-on-surface outline-none p-0 border-none focus:ring-0 leading-none transition-all"
                          placeholder="--"
                        />
                        <span className="text-on-surface-variant font-bold text-sm sm:text-base whitespace-nowrap">{unitSystem === 'metric' ? 'kg' : 'lb'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Altura Card */}
                  <div className="bg-white rounded-[2.5rem] p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl shadow-sm h-full group relative overflow-hidden active:scale-[0.98]">
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-sm shrink-0 transition-transform group-hover:rotate-12">
                        <Ruler size={22} strokeWidth={2.5} />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-on-surface-variant font-bold text-sm mb-1">Altura</h3>
                      <div className="flex items-baseline gap-1.5 min-w-0">
                        <input 
                          type="text" 
                          value={height}
                          onChange={(e) => setHeight(e.target.value)}
                          className="w-[2.2em] bg-transparent text-4xl sm:text-5xl font-black font-display text-on-surface outline-none p-0 border-none focus:ring-0 leading-none transition-all"
                          placeholder="--"
                        />
                        <span className="text-on-surface-variant font-bold text-sm sm:text-base whitespace-nowrap">{unitSystem === 'metric' ? 'cm' : 'in'}</span>
                      </div>
                    </div>
                  </div>

                  {/* IMC Card */}
                  <div className="bg-white rounded-[2.5rem] p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl shadow-sm h-full group relative overflow-hidden active:scale-[0.98]">
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-sm shrink-0 transition-transform group-hover:rotate-12">
                        <Activity size={22} strokeWidth={2.5} />
                      </div>
                      {bmi > 0 && (
                        <div className={cn(
                          "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap",
                          bmiCategory.color.split(' ')[0],
                          "bg-surface-low/50"
                        )}>
                          <span className={bmiCategory.color.split(' ')[1] || bmiCategory.color}>{bmiCategory.label}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-on-surface-variant font-bold text-sm mb-1">IMC (BMI)</h3>
                      <div className="flex items-baseline gap-1.5 min-w-0">
                        <span className="text-4xl sm:text-5xl font-black font-display text-on-surface leading-none w-[2.2em] truncate transition-all">
                          {bmi > 0 ? bmi.toFixed(1) : '--'}
                        </span>
                        <span className="text-on-surface-variant font-bold text-sm sm:text-base whitespace-nowrap">kg/m²</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activity Level and Other Factors */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-on-surface-variant ml-1">Nivel de Actividad</label>
                    <div className="flex bg-surface-high p-1 rounded-full">
                      {(['sedentary', 'moderate', 'active'] as const).map((level) => (
                        <button
                          key={level}
                          onClick={() => setActivityLevel(level)}
                          className={cn(
                            "flex-1 py-2 px-4 rounded-full text-sm transition-all hover:scale-[1.02] active:scale-[0.97]",
                            activityLevel === level 
                              ? "bg-white shadow-sm font-bold text-primary" 
                              : "font-medium text-on-surface-variant"
                          )}
                        >
                          {level === 'sedentary' ? 'Sedentario' : level === 'moderate' ? 'Moderado' : 'Activo'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-bold text-on-surface-variant ml-1">Consumo de Alcohol</label>
                    <div className="flex bg-surface-high p-1 rounded-full">
                      {(['none', 'occasional', 'frequent'] as const).map((level) => (
                        <button
                          key={level}
                          onClick={() => setAlcoholConsumption(level)}
                          className={cn(
                            "flex-1 py-2 px-4 rounded-full text-sm transition-all hover:scale-[1.02] active:scale-[0.97]",
                            alcoholConsumption === level 
                              ? "bg-white shadow-sm font-bold text-primary" 
                              : "font-medium text-on-surface-variant"
                          )}
                        >
                          {level === 'none' ? 'Nulo' : level === 'occasional' ? 'Ocasional' : 'Frecuente'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-on-surface-variant ml-1">Consumo de Sal</label>
                    <div className="flex bg-surface-high p-1 rounded-full">
                      {(['low', 'normal', 'high'] as const).map((level) => (
                        <button
                          key={level}
                          onClick={() => setSaltIntake(level)}
                          className={cn(
                            "flex-1 py-2 px-4 rounded-full text-sm transition-all hover:scale-[1.02] active:scale-[0.97]",
                            saltIntake === level 
                              ? "bg-white shadow-sm font-bold text-primary" 
                              : "font-medium text-on-surface-variant"
                          )}
                        >
                          {level === 'low' ? 'Bajo' : level === 'normal' ? 'Normal' : 'Alto'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-bold text-on-surface-variant ml-1">Nivel de Estrés</label>
                    <div className="flex bg-surface-high p-1 rounded-full">
                      {(['low', 'moderate', 'high'] as const).map((level) => (
                        <button
                          key={level}
                          onClick={() => setStressLevel(level)}
                          className={cn(
                            "flex-1 py-2 px-4 rounded-full text-sm transition-all hover:scale-[1.02] active:scale-[0.97]",
                            stressLevel === level 
                              ? "bg-white shadow-sm font-bold text-primary" 
                              : "font-medium text-on-surface-variant"
                          )}
                        >
                          {level === 'low' ? 'Bajo' : level === 'moderate' ? 'Medio' : 'Alto'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-on-surface-variant ml-1">Calidad del Sueño</label>
                    <div className="flex bg-surface-high p-1 rounded-full">
                      {(['good', 'average', 'poor'] as const).map((level) => (
                        <button
                          key={level}
                          onClick={() => setSleepQuality(level)}
                          className={cn(
                            "flex-1 py-2 px-4 rounded-full text-sm transition-all hover:scale-[1.02] active:scale-[0.97]",
                            sleepQuality === level 
                              ? "bg-white shadow-sm font-bold text-primary" 
                              : "font-medium text-on-surface-variant"
                          )}
                        >
                          {level === 'good' ? 'Buena' : level === 'average' ? 'Normal' : 'Mala'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-bold text-on-surface-variant ml-1">Consumo de Cafeína</label>
                    <div className="flex bg-surface-high p-1 rounded-full">
                      {(['none', 'low', 'moderate', 'high'] as const).map((level) => (
                        <button
                          key={level}
                          onClick={() => setCaffeineIntake(level)}
                          className={cn(
                            "flex-1 py-2 px-4 rounded-full text-sm transition-all hover:scale-[1.02] active:scale-[0.97]",
                            caffeineIntake === level 
                              ? "bg-white shadow-sm font-bold text-primary" 
                              : "font-medium text-on-surface-variant"
                          )}
                        >
                          {level === 'none' ? 'Nulo' : level === 'low' ? 'Bajo' : level === 'moderate' ? 'Medio' : 'Alto'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { id: 'familyHistory', label: 'Antecedentes HTA', state: familyHistory, setState: setFamilyHistory },
                    { id: 'isSmoker', label: 'Fumador', state: isSmoker, setState: setIsSmoker },
                    { id: 'hasDiabetes', label: 'Diabetes', state: hasDiabetes, setState: setHasDiabetes },
                    { id: 'isHypertensiveMedicated', label: 'Medicado (HTA)', state: isHypertensiveMedicated, setState: setIsHypertensiveMedicated },
                    { id: 'hasHighCholesterol', label: 'Colesterol Alto', state: hasHighCholesterol, setState: setHasHighCholesterol },
                    { id: 'hasKidneyDisease', label: 'Enf. Renal', state: hasKidneyDisease, setState: setHasKidneyDisease },
                  ].map((item) => (
                    <button 
                      key={item.id}
                      onClick={() => item.setState(!item.state)}
                      className={cn(
                        "flex items-center justify-center gap-3 p-5 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest border hover:scale-[1.02] active:scale-[0.97]",
                        item.state 
                          ? "bg-primary text-white shadow-lg shadow-primary/20 border-primary" 
                          : "bg-surface border-border/40 text-on-surface-variant hover:border-primary/30"
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Ajustes Complementarios Section */}
            <section className="space-y-6">
              <div className="bg-surface-low rounded-[2.5rem] p-8 space-y-8">
                <div className="flex items-center justify-between border-b border-surface-highest/10 pb-6">
                  <div className="max-w-md">
                    <h3 className="text-2xl font-display font-black text-foreground mb-1">Ajustes Complementarios</h3>
                    <p className="text-sm text-on-surface-variant">Define la frecuencia de sincronización y las unidades de medida preferidas.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-12 gap-y-8">
                  {/* Measurement System */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-on-surface-variant ml-1">Sistema de Medida</label>
                    <div className="flex bg-surface-high p-1 rounded-full">
                      {['metric', 'imperial'].map((sys) => (
                        <button
                          key={sys}
                          onClick={() => toggleUnitSystem(sys as 'metric' | 'imperial')}
                          className={cn(
                            "flex-1 py-2 px-4 rounded-full text-sm transition-all hover:scale-[1.02] active:scale-[0.97]",
                            unitSystem === sys 
                              ? "bg-white shadow-sm font-bold text-primary" 
                              : "font-medium text-on-surface-variant"
                          )}
                        >
                          {sys === 'metric' ? 'Métrico' : 'Imperial'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Measurement Frequency */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-on-surface-variant ml-1">Frecuencia de Medición</label>
                    <div className="relative group">
                      <select 
                        value={measurementFrequency}
                        onChange={(e) => setMeasurementFrequency(e.target.value as any)}
                        className="w-full bg-surface-high border-none rounded-xl py-3 px-4 text-on-surface focus:ring-2 focus:ring-primary/20 appearance-none transition-all outline-none"
                      >
                        <option value="daily">Diario</option>
                        <option value="weekly">Semanal</option>
                        <option value="monthly">Mensual</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant" />
                    </div>
                  </div>

                  {/* Auto BMI */}
                  <div className="flex items-center justify-between p-4 bg-surface-highest/30 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shadow-sm shrink-0">
                        <Activity size={24} strokeWidth={2.5} />
                      </div>
                      <div>
                        <p className="font-bold text-on-surface">Cálculo de IMC Automático</p>
                        <p className="text-xs text-on-surface-variant">Calcular índice de masa corporal según peso/altura</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={autoBmi}
                        onChange={() => setAutoBmi(!autoBmi)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-surface-highest/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {/* Trends History */}
                  <div className="flex items-center justify-between p-4 bg-surface-highest/30 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shadow-sm shrink-0">
                        <History size={24} strokeWidth={2.5} />
                      </div>
                      <div>
                        <p className="font-bold text-on-surface">Historial de Tendencias</p>
                        <p className="text-xs text-on-surface-variant">Mostrar indicadores de progreso en tarjetas</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={showTrends}
                        onChange={() => setShowTrends(!showTrends)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-surface-highest/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </div>
            </section>


            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-8">
              <Button 
                variant="outline"
                onClick={() => setActiveTab('dashboard')}
                className="w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <ArrowLeft size={18} />
                Cancelar y Volver al Panel
              </Button>
              <Button 
                onClick={handleSaveHealthData}
                disabled={!isDirty || updateUserProfile.isPending}
                isLoading={updateUserProfile.isPending}
                className="w-full sm:w-auto flex items-center justify-center gap-2 shadow-none hover:shadow-primary/20 hover:shadow-xl transition-all"
              >
                <Save size={18} />
                <span>Actualizar Perfil</span>
              </Button>
            </div>
          </motion.div>)}
           {activeSection === 'data' && (
            <motion.div
              key="data"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8 w-full overflow-x-hidden"
            >
              <div className="bg-surface-low rounded-[2.5rem] p-4 sm:p-12 overflow-hidden shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 sm:mb-12">
                  <div className="max-w-3xl min-w-0">
                    <h3 className="text-2xl sm:text-3xl font-display font-black text-foreground break-words">Gestión de Datos</h3>
                    <p className="text-on-surface-variant mt-3 sm:mt-4 text-base sm:text-lg leading-relaxed break-words">
                      Administra tu historial médico y la seguridad de tu información. 
                      Tus datos se sincronizan de forma segura para garantizar acceso y protección total.
                    </p>
                  </div>
                          <div className="flex items-center gap-3 px-6 py-3 bg-success/10 rounded-2xl shrink-0">
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span className="text-xs font-black text-success uppercase tracking-widest">Sincronizado con la Nube</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* Export Card */}
                    <div className="p-5 sm:p-8 rounded-[2.5rem] bg-card space-y-6 shadow-sm flex flex-col h-full group hover:bg-surface-high/30 transition-all duration-300">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <FileText className="text-[28px] sm:text-[32px]" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg sm:text-xl font-bold text-foreground break-words">Informe PDF</h4>
                        <p className="text-sm text-on-surface-variant mt-2 leading-relaxed break-words">
                          Genera un informe clínico completo en formato PDF con tus lecturas recientes para compartir con tu especialista.
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 px-4 py-2 bg-surface-low rounded-xl text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                          <ShieldCheck className="text-[12px]" />
                          Generación via SSL/TLS 1.3
                        </div>
                        <Button 
                          variant="secondary" 
                          onClick={() => setShowExportConfirm(true)}
                          size="lg"
                          className="w-full flex items-center justify-center gap-2"
                        >
                          <PDFIcon />
                          Generar Informe PDF
                        </Button>
                      </div>
                    </div>

                    {/* Danger Zone Card */}
                    <div className="p-5 sm:p-8 rounded-[2.5rem] bg-destructive/10 space-y-6 shadow-sm flex flex-col h-full group hover:bg-destructive/20 transition-all duration-300 border border-destructive/20">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-destructive/10 flex items-center justify-center text-destructive group-hover:scale-110 transition-transform">
                        <Trash2 className="text-[28px] sm:text-[32px]" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg sm:text-xl font-bold text-foreground break-words">Zona de Peligro</h4>
                        <p className="text-sm text-on-surface-variant mt-2 leading-relaxed break-words">
                          Ésta acción es irreversible. Gestiona la eliminación de tu historial médico o la baja definitiva del sistema.
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 rounded-xl text-[10px] font-black text-destructive uppercase tracking-widest">
                          <AlertTriangle className="text-[12px]" />
                          Acción Crítica e Irreversible
                        </div>

                        <Button 
                          variant="secondary" 
                          onClick={() => setShowClearConfirm(true)}
                          size="lg"
                          className="w-full flex items-center justify-center gap-2"
                        >
                          <History className="text-[18px]" />
                          Limpiar Historial de Lecturas
                        </Button>

                        <Button 
                          variant="danger" 
                          onClick={() => setShowDeleteAccountConfirm(true)}
                          size="lg"
                          className="w-full flex items-center justify-center gap-2"
                        >
                          <Trash2 className="text-[18px]" />
                          Eliminar Cuenta Definitivamente
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Dev / Data Gen */}
                  <div className="mt-8 p-5 sm:p-8 rounded-[2.5rem] bg-indigo-50 dark:bg-indigo-900/10 space-y-6 shadow-sm flex flex-col group transition-all duration-300 border border-indigo-100 dark:border-indigo-800">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                      <FlaskConical className="text-[28px] sm:text-[32px]" />
                    </div>
                    <div>
                      <h4 className="text-lg sm:text-xl font-bold text-indigo-900 dark:text-indigo-100">Pruebas: Generación Clínica Estricta</h4>
                      <p className="text-sm text-indigo-700/80 dark:text-indigo-300 mt-2 leading-relaxed">
                        Genera automáticamente 6 períodos clínicos (el Período Actual #6 quedará como Incompleto de forma predeterminada pero rellenará los otros 5 de manera íntegra, con toda la variabilidad de la presión sanguínea que se te ocurra).
                      </p>
                    </div>
                    <div>
                      <Button 
                        onClick={handleSeedData}
                        disabled={isSeeding}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/20 rounded-full py-6 flex items-center justify-center gap-3 font-black tracking-widest uppercase text-xs"
                      >
                        {isSeeding ? "Generando..." : "INYECTAR SET DE DATOS CLÍNICOS (180 LECTURAS)"}
                      </Button>
                    </div>
                  </div>

                  {/* Military Grade Infrastructure Section */}
                  <div className="mt-8 p-3 sm:p-12 rounded-[2.5rem] bg-card relative overflow-hidden w-full">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -mr-48 -mt-48 blur-3xl" />
                    
                    <div className="relative flex flex-col lg:flex-row gap-8 lg:gap-12 items-center w-full">
                      <div className="w-full sm:max-w-sm lg:w-1/3 aspect-[3/4] rounded-[2.5rem] bg-foreground/90 overflow-hidden shadow-2xl relative group shrink-0 mx-auto lg:mx-0">
                        <img 
                          src="/health-data-security-ecosystem-portrait.png" 
                          alt="Ecosistema de Seguridad" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-30 pointer-events-none" />
                      </div>

                      <div className="flex-1 min-w-0 w-full space-y-4 sm:space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm shrink-0">
                            <ShieldCheck className="text-[24px]" />
                          </div>
                          <h4 className="text-xl sm:text-2xl font-display font-black text-foreground break-words overflow-wrap-anywhere">Infraestructura de Grado Militar</h4>
                        </div>
                        
                        <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed break-words">
                          Todos sus datos se almacenan en buckets regionales de Google Cloud con cifrado **AES-256** en reposo. Implementamos protocolos de seguridad avanzados para garantizar la máxima privacidad de su información médica.
                        </p>

                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full">
                          <div className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-surface-low rounded-xl text-[10px] font-black text-on-surface-variant uppercase tracking-widest whitespace-nowrap">
                            <CheckCircle2 className="text-[12px] text-success" />
                            SSL/TLS 1.3
                          </div>
                          <div className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-surface-low rounded-xl text-[10px] font-black text-on-surface-variant uppercase tracking-widest whitespace-nowrap">
                            <Lock className="text-[12px] text-primary" />
                            AES-256 BIT
                          </div>
                          <div className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-surface-low rounded-xl text-[10px] font-black text-on-surface-variant uppercase tracking-widest whitespace-nowrap">
                            <Server className="text-[12px] text-amber-500" />
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
                  className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md"
                >
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-card p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center space-y-6 border border-border"
                  >
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto">
                      <PDFIcon size={40} />
                    </div>
                    <div>
                      <h4 className="text-2xl font-display font-black text-foreground">¿Generar informe?</h4>
                      <p className="text-on-surface-variant mt-2">Se generará un documento PDF con tu historial clínico de lecturas.</p>
                    </div>
                    <div className="flex gap-4">
                      <Button variant="outline" onClick={() => setShowExportConfirm(false)} className="flex-1">Cancelar</Button>
                      <Button onClick={handleExport} isLoading={isExporting} className="flex-1">Generar PDF</Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {showClearConfirm && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md"
                >
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-card p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center space-y-6 border border-border"
                  >
                    <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center text-destructive mx-auto">
                      <Trash2 className="text-[40px]" />
                    </div>
                    <div>
                      <h4 className="text-2xl font-display font-black text-foreground">¿Borrar historial?</h4>
                      <p className="text-on-surface-variant mt-2">Ésta acción es irreversible. Se eliminarán permanentemente todas tus lecturas registradas, pero mantendrás tu cuenta.</p>
                    </div>
                    <div className="flex gap-4">
                      <Button variant="outline" onClick={() => setShowClearConfirm(false)} className="flex-1">Cancelar</Button>
                      <Button variant="danger" onClick={handleClearData} className="flex-1">Borrar Todo</Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {showDeleteAccountConfirm && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md"
                >
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-card p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center space-y-6 border border-border"
                  >
                    <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center text-destructive mx-auto">
                      <AlertTriangle className="text-[40px]" />
                    </div>
                    <div>
                      <h4 className="text-2xl font-display font-black text-foreground">¿Eliminar cuenta?</h4>
                      <p className="text-on-surface-variant mt-2">Ésta acción es irreversible. Se eliminarán permanentemente todos tus datos y tu acceso a la plataforma.</p>
                    </div>
                    <div className="flex gap-4">
                      <Button variant="outline" onClick={() => setShowDeleteAccountConfirm(false)} className="flex-1">Cancelar</Button>
                      <Button variant="danger" onClick={handleDeleteAccount} isLoading={deleteAccount.isPending} className="flex-1">Eliminar Cuenta</Button>
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
                <h3 className="text-3xl font-display font-black text-foreground">Centro de Control de Privacidad</h3>
                <p className="text-on-surface-variant">
                  Gestione cómo se protegen sus datos y quién puede acceder a sus registros históricos. El cifrado de alta seguridad está activo por defecto.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Encryption Status Card */}
                <div className="lg:col-span-2 bg-surface-low rounded-[2.5rem] p-8 space-y-8 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                        <Shield className="text-[28px]" />
                      </div>
                      <div>
                        <h4 className="text-xl font-display font-black text-foreground">Estado de Cifrado de Datos</h4>
                        <div className="flex items-center gap-1.5 text-success font-black text-[10px] uppercase tracking-widest mt-1">
                          <Lock className="text-[12px]" />
                          BÓVEDA ASEGURADA
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-on-surface-variant leading-relaxed font-medium">
                    Sus registros están protegidos con tecnología de seguridad avanzada y cifrado automático. Esto garantiza que su información de salud sea privada y que nadie más que usted pueda verla.
                  </p>
                  <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest pt-2">
                    <ShieldCheck className="text-[16px]" />
                    Protección Activa 24/7
                  </div>
                </div>

                {/* Account Security Card (Firebase) */}
                <div className="bg-surface-low rounded-[2.5rem] p-8 space-y-8">
                  <h4 className="text-xl font-display font-black text-foreground">Seguridad de la Cuenta</h4>
                  <p className="text-xs text-on-surface-variant font-medium">Su cuenta está protegida por los sistemas de seguridad de Google.</p>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary shadow-sm">
                          <User className="text-[16px]" />
                        </div>
                        <span className="text-sm font-bold text-foreground">Acceso con Google</span>
                      </div>
                      <span className="text-[10px] font-black text-success uppercase tracking-widest bg-success/10 px-2 py-1 rounded-md">Conectado</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary shadow-sm">
                          <Server className="text-[16px]" />
                        </div>
                        <span className="text-sm font-bold text-foreground">Sincronización Cloud</span>
                      </div>
                      <span className="text-[10px] font-black text-success uppercase tracking-widest bg-success/10 px-2 py-1 rounded-md">Activa</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Medical Data Sharing Card */}
              <div className="bg-surface-low rounded-[3rem] p-6 sm:p-12 space-y-8 sm:space-y-10 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-2xl font-display font-black text-foreground">Compartir Datos Médicos</h4>
                    <p className="text-on-surface-variant text-sm">Permisos granulares para sus datos biométricos sensibles.</p>
                  </div>
                  <div className="px-4 py-2 bg-primary/10 rounded-xl flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest self-start sm:self-center">
                    <ShieldCheck className="text-[16px]" />
                    Entorno de Cumplimiento Médico
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {[
                    { id: 'vitals', label: 'Tensión y Pulso', desc: 'Sus lecturas diarias y ritmo cardíaco', icon: Heart, state: shareVitals, setState: setShareVitals },
                    { id: 'meds', label: 'Medicamentos', desc: 'Información sobre sus pastillas y recetas', icon: Pill, state: shareMedication, setState: setShareMedication },
                    { id: 'emergency', label: 'Acceso de Emergencia', desc: 'Permitir a los médicos de urgencias ver sus datos', icon: Ambulance, state: shareEmergency, setState: setShareEmergency },
                    { id: 'reports', label: 'Informes de Salud', desc: 'Resúmenes mensuales para su médico', icon: History, state: shareReports, setState: setShareReports },
                  ].map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <div 
                        key={item.id} 
                        className="p-5 sm:p-8 rounded-[2.5rem] bg-surface flex items-center justify-between gap-4 sm:gap-6 hover:bg-surface-high/30 transition-all duration-300 group"
                      >
                        <div className="flex items-center gap-3 sm:gap-5 min-w-0">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary/10 rounded-full flex items-center justify-center text-primary shadow-sm shrink-0 group-hover:scale-110 transition-transform">
                            <IconComponent className="text-[22px] sm:text-[26px]" />
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-sm sm:text-base font-bold text-foreground leading-tight">{item.label}</h5>
                            <p className="text-[10px] sm:text-xs text-on-surface-variant leading-tight sm:leading-relaxed mt-0.5 line-clamp-2 md:line-clamp-none">{item.desc}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => item.setState(!item.state)}
                          className={cn(
                            "w-10 h-5 sm:w-12 sm:h-6 rounded-full transition-all relative shrink-0 active:scale-90",
                            item.state ? "bg-primary shadow-lg shadow-primary/20" : "bg-surface-low shadow-inner"
                          )}
                          aria-label={`Compartir ${item.label}`}
                        >
                          <div className={cn(
                            "absolute top-0.5 sm:top-1 w-4 h-4 rounded-full transition-all shadow-md",
                            item.state ? "left-5.5 sm:left-7 bg-white" : "left-0.5 sm:left-1 bg-white",
                          )} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Data Ownership Statement */}
              <div className="bg-primary/5 rounded-[2.5rem] p-8 flex flex-col sm:flex-row items-center gap-6">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-primary shadow-sm flex-shrink-0">
                  <Fingerprint className="text-[28px]" strokeWidth={2.5} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xl font-display font-black text-foreground">Usted es el dueño de sus datos</h4>
                  <p className="text-sm text-on-surface-variant">En TensioTrack, creemos que su información de salud le pertenece solo a usted. Puede descargar sus datos o eliminarlos permanentemente en cualquier momento desde la sección de Datos.</p>
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
              className="bg-surface-low rounded-[3rem] p-6 sm:p-12 space-y-10 shadow-sm"
            >
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 bg-transparent flex items-center justify-center overflow-hidden transition-all duration-700">
                <img src="/logo-tensiotrack.svg" alt="Logo" className="w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-40 lg:h-40" />
              </div>
              <div>
                <h3 className="text-4xl font-display font-black text-foreground tracking-tight">TensioTrack</h3>
                <p className="text-on-surface-variant font-bold uppercase tracking-widest text-xs mt-2">Versión 0.9.8 Beta (Pre-lanzamiento)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
              {/* Mission Card */}
              <div className="bg-surface rounded-[2.5rem] p-6 sm:p-10 space-y-5 sm:space-y-6 shadow-sm hover:bg-surface-high/30 transition-all duration-300 group flex flex-col items-center sm:items-start text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3 sm:gap-6 w-full justify-center sm:justify-start">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary shadow-sm shrink-0 group-hover:scale-110 transition-transform">
                    <Flag className="text-[24px] sm:text-[28px]" />
                  </div>
                  <h4 className="text-lg sm:text-2xl font-display font-black text-foreground leading-tight w-full text-center sm:text-left">Misión</h4>
                </div>
                <p className="text-on-surface-variant leading-relaxed font-medium text-sm sm:text-base w-full text-center sm:text-left">
                  TensioTrack ha sido creado para ayudarle a cuidar de su salud de forma sencilla y segura. Nuestra misión es hacer que llevar el control de su tensión sea una tarea fácil, permitiéndole guardar sus registros a lo largo del tiempo para que usted y su médico tengan siempre una información clara y precisa sobre su bienestar.
                </p>
              </div>

              {/* Medical Disclaimer Card */}
              <div className="bg-surface rounded-[2.5rem] p-6 sm:p-10 space-y-5 sm:space-y-6 shadow-sm hover:bg-surface-high/30 transition-all duration-300 group flex flex-col items-center sm:items-start text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3 sm:gap-6 w-full justify-center sm:justify-start">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center text-destructive shadow-sm shrink-0 group-hover:scale-110 transition-transform">
                    <Gavel className="text-[24px] sm:text-[28px]" />
                  </div>
                  <h4 className="text-[17px] sm:text-2xl font-display font-black text-foreground leading-tight w-full text-center sm:text-left tracking-tight">Descargo de Responsabilidad Clínica</h4>
                </div>
                <p className="text-on-surface-variant leading-relaxed italic font-medium text-sm sm:text-base w-full text-center sm:text-left">
                  Esta aplicación es una herramienta de registro y no sustituye el diagnóstico médico profesional. Consulte siempre con su médico antes de realizar cambios en su tratamiento o si presenta síntomas inusuales. Los datos archivados son para propósitos informativos.
                </p>
                <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 text-primary font-black text-[9px] sm:text-[10px] uppercase tracking-widest pt-4 border-t border-surface-highest/10 w-full mt-auto">
                  <ShieldCheck className="text-[16px] sm:text-[18px]" />
                  Cumplimiento Verificado 2026
                </div>
              </div>
            </div>

            {/* Image grid removed as per revert request */}

            <div className="pt-8 mt-8 flex flex-col items-center justify-center gap-4 w-full border-t border-surface-highest/10">
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-black text-on-surface-variant uppercase tracking-widest whitespace-nowrap">
                <span>Hecho con</span>
                <Heart className="text-[14px] sm:text-[16px] text-destructive fill-current shrink-0" />
                <span>en Gijón, Asturias</span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-on-surface-variant font-medium max-w-xs sm:max-w-md text-center">
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
