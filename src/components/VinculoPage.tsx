import * as React from "react";
import { useAppStore } from "../store/useAppStore";
import { useUpdateUserProfile } from "../lib/api";
import { motion } from "motion/react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import { Camera, Fingerprint, CheckCircle2, Lock, Zap, ArrowLeft } from "lucide-react";
import { cn } from "../lib/utils";

export function VinculoPage({ isStandalone = true }: { isStandalone?: boolean }) {
  const { user, setActiveTab, isDarkMode } = useAppStore();
  const updateUserProfile = useUpdateUserProfile();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);

  const isDoctor = user?.role === 'doctor';

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecciona una imagen");
      return;
    }

    setIsUploadingAvatar(true);
    
    try {
      const reader = new FileReader();
      const uploadPromise = new Promise<string>((resolve, reject) => {
        reader.onload = (event) => {
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
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          };
          img.onerror = () => reject(new Error("Error al procesar la imagen"));
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

  return (
    <div className={cn("space-y-8", isStandalone ? "animate-in fade-in slide-in-from-bottom-4 duration-700" : "")}>
      {isStandalone && (
         <div className="flex flex-col gap-2 mb-4">
            <h1 className="text-4xl font-display font-black text-foreground tracking-tight">Validación Médica</h1>
            <p className="text-on-surface-variant text-lg">Administra tu identidad profesional y credenciales de vinculación.</p>
         </div>
      )}

      {/* Identity & Credential Redesign */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Section: Identity Card */}
        <div className="lg:col-span-7 xl:col-span-8 group">
          <div className="h-full relative overflow-hidden bg-surface-low rounded-[3.5rem] p-10 sm:p-12 border border-surface-highest/5 shadow-sm transition-all duration-500 hover:shadow-xl hover:border-primary/10">
            <div className="relative flex flex-col md:flex-row items-center md:items-start gap-10">
              
              {/* Avatar Section */}
              <div className="relative shrink-0">
                <div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-primary/30 to-primary/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-white dark:bg-card p-1.5 shadow-2xl">
                  <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-surface-high relative border-4 border-background">
                    {user?.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt="Profile" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer" 
                      />
                    ) : (
                      <span className="text-6xl font-display font-black text-primary/20">
                        {user?.displayName?.charAt(0).toUpperCase() || (isDoctor ? 'D' : 'P')}
                      </span>
                    )}
                    
                    {isUploadingAvatar && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                        <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute bottom-2 right-2 w-12 h-12 bg-white dark:bg-card rounded-2xl shadow-xl flex items-center justify-center text-on-surface hover:text-primary transition-all active:scale-90 border border-border/50 group/cam"
                >
                  <Camera size={20} strokeWidth={2.5} className="group-hover/cam:scale-110 transition-transform" />
                </button>
                <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left space-y-6">
                <div className="space-y-4">
                  <div className="inline-flex px-5 py-2 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-[0.25em] text-primary shadow-sm">
                    {isDoctor ? 'MÉDICO COLEGIADO' : 'PACIENTE ACTIVO'}
                  </div>
                  <h2 className="text-4xl sm:text-5xl xl:text-6xl font-display font-black text-on-surface tracking-tighter leading-none break-words">
                    {user?.displayName || (isDoctor ? 'Médico' : 'Paciente')}
                  </h2>
                </div>
                
                <p className="max-w-xl text-lg text-on-surface-variant font-medium leading-relaxed opacity-70 mx-auto md:mx-0">
                  {isDoctor 
                    ? 'Establece vínculos de confianza con tus pacientes compartiendo tu credencial digital autorizada.' 
                    : 'Personaliza tu perfil de salud para optimizar los reportes analíticos de nuestra IA.'}
                </p>

                {isDoctor && (
                  <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    <div className="px-4 py-2.5 rounded-2xl bg-white/50 dark:bg-black/10 border border-border/40 flex items-center gap-3">
                      <Fingerprint size={16} className="text-primary/60" />
                      <span className="text-[11px] font-black uppercase tracking-wider text-on-surface/80">CÓDIGO MANUAL</span>
                    </div>
                    <div className="px-4 py-2.5 rounded-2xl bg-white/50 dark:bg-black/10 border border-border/40 flex items-center gap-3">
                      <Camera size={16} className="text-primary/60" />
                      <span className="text-[11px] font-black uppercase tracking-wider text-on-surface/80">ESCANEO DIRECTO</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Digital Credential */}
        {isDoctor && (
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="h-full bg-white dark:bg-[#1C1B1F] rounded-[3.5rem] shadow-2xl shadow-primary/5 border border-primary/20 p-10 flex flex-col items-center justify-between gap-8 relative overflow-hidden group/qr">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                 <Zap size={120} className="text-primary" />
              </div>
              
              <div className="text-center space-y-1">
                <span className="text-[10px] font-black text-primary/50 uppercase tracking-[0.4em]">CREDENCIAL DIGITAL</span>
              </div>
              
              <div className="bg-white p-5 rounded-3xl shadow-inner relative z-10 group-hover/qr:scale-105 transition-transform duration-700 ring-1 ring-primary/5">
                {user?.uid && (
                  <QRCodeCanvas 
                    value={user.uid}
                    size={180}
                    level="H"
                    includeMargin={false}
                  />
                )}
              </div>

              <div className="w-full space-y-3 relative z-10">
                <div className="bg-surface-low rounded-2xl p-4 border border-border/50 text-center">
                  <span className="text-sm font-mono font-black text-primary tracking-widest select-all break-all">{user?.uid}</span>
                </div>
                <p className="text-[10px] text-center text-on-surface-variant font-bold uppercase tracking-widest opacity-40">Identificador Único Profesional</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {isDoctor && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-8 px-2 sm:px-0"
        >
          <div className="bg-primary/5 dark:bg-primary/10 ethereal-blur border border-primary/10 rounded-[3.5rem] p-8 overflow-hidden relative group">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <Lock size={24} />
                </div>
                <div>
                  <h4 className="text-xl font-display font-black text-on-surface">Seguridad Biométrica</h4>
                  <p className="text-on-surface-variant text-sm font-medium opacity-70">Cifrado médico de extremo a extremo activo.</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  if (user?.uid) {
                    navigator.clipboard.writeText(user.uid);
                    toast.success("Código copiado al portapapeles", {
                      icon: <CheckCircle2 className="text-success" size={18} />
                    });
                  }
                }}
                className="px-8 py-4 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/30 hover:bg-primary-high transition-all active:scale-95"
              >
                Copiar Identificador
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
