import * as React from "react";
import { Button } from "./ui/Button";
import { signInWithPopup, auth, googleProvider } from "../firebase";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import { Shield, CheckCircle2, LogIn, Heart, BrainCircuit, TrendingUp } from "lucide-react";

export function Login() {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Sesión iniciada correctamente");
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        toast.error("Error al iniciar sesión");
        console.error(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Left Side: Image Hero */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <img 
          src="https://loremflickr.com/800/1200/heart,care,medical" 
          alt="TensioTrack Health" 
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-dim/90 mix-blend-multiply" />
        
        <div className="absolute inset-0 p-16 flex flex-col justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center">
              <img 
                src="/logo-tensiotrack.svg" 
                alt="Logo" 
                className="w-full h-full object-contain filter brightness-0 invert" 
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="text-2xl font-display font-black tracking-tight">TensioTrack</span>
          </div>
 
          <div className="space-y-6">
            <h2 className="text-4xl lg:text-5xl xl:text-6xl font-display font-black leading-[1.1]">
              Cuidamos de su <br className="hidden sm:block" />
              <span className="text-primary-container">corazón</span>,<br className="hidden xl:block" /> paso a paso.
            </h2>
            <p className="text-lg xl:text-xl text-primary-foreground/80 max-w-md font-medium leading-relaxed">
              La herramienta profesional para el seguimiento de su presión arterial, diseñada para ser sencilla, segura y precisa.
            </p>
            <div className="flex gap-4 pt-4">
              <div className="px-6 py-3 bg-surface-highest/10 backdrop-blur-md rounded-2xl border border-border/20 flex items-center gap-3">
                <Shield className="text-[20px] text-success" />
                <span className="text-sm font-bold">Datos Cifrados</span>
              </div>
              <div className="px-6 py-3 bg-surface-highest/10 backdrop-blur-md rounded-2xl border border-border/20 flex items-center gap-3">
                <CheckCircle2 className="text-[20px] text-primary-container" />
                <span className="text-sm font-bold">Protocolo AMPA</span>
              </div>
            </div>
          </div>
 
          <div className="text-sm font-medium text-primary-foreground/60">
            © 2026 TensioTrack Professional. Todos los derechos reservados.
          </div>
        </div>
      </div>
 
      {/* Right Side: Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-surface-low">
        <div className="max-w-md w-full space-y-10">
          <div className="flex flex-col items-center lg:items-start gap-4">
            <div className="lg:hidden w-20 h-20 flex items-center justify-center transform -rotate-6">
              <img 
                src="/logo-tensiotrack.svg" 
                alt="Logo" 
                className="w-full h-full object-contain" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="text-center lg:text-left space-y-2">
              <h1 className="text-4xl font-display font-black text-foreground tracking-tight">
                Bienvenido de <span className="text-primary">nuevo</span>
              </h1>
              <p className="text-on-surface-variant font-medium">
                Inicie sesión para acceder a su historial de salud y análisis de IA.
              </p>
            </div>
          </div>
 
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Shield, label: 'Privacidad', color: 'text-success' },
              { icon: Heart, label: 'Salud', color: 'text-destructive' },
              { icon: BrainCircuit, label: 'IA Análisis', color: 'text-primary' },
              { icon: TrendingUp, label: 'Evolución', color: 'text-warning' },
            ].map((item, i) => {
              const IconComp = item.icon;
              return (
              <div key={i} className="bg-surface-high p-5 rounded-[3rem] border-none flex flex-col items-center lg:items-start gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center bg-primary/10", item.color)}>
                  <IconComp className="text-[20px]" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{item.label}</span>
              </div>
              )
            })}
          </div>
 
          <div className="space-y-6">
            <Button 
              size="lg" 
              className="w-full"
              onClick={handleLogin}
              isLoading={isLoading}
            >
              <LogIn className="text-[20px] mr-3" />
              Continuar con Google
            </Button>
 
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-black text-on-surface-variant">
                <span className="bg-surface-low px-4">Seguridad Garantizada</span>
              </div>
            </div>
 
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest text-center leading-relaxed">
              Sus datos están protegidos por cifrado de extremo a extremo. <br />
              Al continuar, acepta nuestros términos de servicio.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
