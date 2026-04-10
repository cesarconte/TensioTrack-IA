import * as React from "react";
import { Activity, LogIn, Shield, Heart, Brain, TrendingUp } from "lucide-react";
import { Button } from "./ui/Button";
import { signInWithPopup, auth, googleProvider } from "../firebase";
import { toast } from "sonner";

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-200 dark:shadow-none transform -rotate-6">
            <Activity className="text-white w-10 h-10" />
          </div>
          <h1 className="text-4xl font-display font-black text-slate-900 dark:text-white tracking-tight">
            Tensio<span className="text-indigo-600">Track</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xs">
            Tu compañero inteligente para el seguimiento de la presión arterial bajo el protocolo AMPA.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 py-8">
          {[
            { icon: Shield, label: 'Privacidad', color: 'text-emerald-500' },
            { icon: Heart, label: 'Salud', color: 'text-rose-500' },
            { icon: Brain, label: 'IA Análisis', color: 'text-indigo-500' },
            { icon: TrendingUp, label: 'Evolución', color: 'text-amber-500' },
          ].map((item, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center gap-2">
              <item.icon className={item.color + " w-6 h-6"} />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</span>
            </div>
          ))}
        </div>

        <Button 
          size="lg" 
          className="w-full shadow-xl shadow-indigo-200 dark:shadow-none"
          onClick={handleLogin}
          isLoading={isLoading}
        >
          <LogIn className="w-5 h-5 mr-2" />
          Iniciar con Google
        </Button>

        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
          Al iniciar sesión, aceptas nuestras políticas de privacidad y términos de uso médico.
        </p>
      </div>
    </div>
  );
}
