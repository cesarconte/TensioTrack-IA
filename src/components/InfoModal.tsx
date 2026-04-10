import * as React from "react";
import { motion } from "motion/react";
import { 
  X, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  Activity,
  Clock,
  Coffee,
  Heart
} from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/Tooltip";

interface InfoModalProps {
  onClose: () => void;
}

export function InfoModal({ onClose }: InfoModalProps) {
  const ranges = [
    { 
      label: 'Hipertensión', 
      range: '≥ 135 / 85', 
      desc: 'Valores por encima del objetivo clínico en domicilio.',
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-900/20',
      border: 'border-rose-100 dark:border-rose-900/30'
    },
    { 
      label: 'Normal-Alta', 
      range: '130-134 / 80-84', 
      desc: 'Ligeramente elevado. Requiere vigilancia y cambios de hábito.',
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-100 dark:border-amber-900/30'
    },
    { 
      label: 'Normal', 
      range: '100-129 / 60-79', 
      desc: 'Rango óptimo de salud cardiovascular.',
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-100 dark:border-emerald-900/30'
    },
    { 
      label: 'Baja', 
      range: '< 100 / 60', 
      desc: 'Presión inferior a lo habitual. Consultar si hay síntomas.',
      color: 'text-sky-600 dark:text-sky-400',
      bg: 'bg-sky-50 dark:bg-sky-900/20',
      border: 'border-sky-100 dark:border-sky-900/30'
    },
  ];

  const steps = [
    { icon: <Clock className="w-5 h-5" />, text: 'Reposa sentado al menos 5 minutos antes de la toma.' },
    { icon: <Coffee className="w-5 h-5" />, text: 'Evita café, tabaco o ejercicio 30 min. antes.' },
    { icon: <Activity className="w-5 h-5" />, text: 'Espalda apoyada y brazo a la altura del corazón.' },
    { icon: <CheckCircle2 className="w-5 h-5" />, text: 'Realiza 3 tomas seguidas con 1 min. de descanso entre ellas.' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 w-full max-w-2xl h-full sm:h-[85vh] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border-none sm:border border-slate-100 dark:border-slate-800 my-auto"
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-display font-black text-slate-900 dark:text-white truncate">Guía AMPA</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">Protocolo Médico Oficial</p>
            </div>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors shrink-0"
                aria-label="Cerrar guía"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Cerrar guía</TooltipContent>
          </Tooltip>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
          <section className="space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Clasificación de Valores</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ranges.map((range, idx) => (
                <div key={idx} className={cn("p-5 rounded-3xl border transition-all", range.bg, range.border)}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn("text-[10px] font-black uppercase tracking-widest", range.color)}>{range.label}</span>
                    <span className={cn("font-mono font-bold", range.color)}>{range.range}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{range.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pasos para una toma correcta</h3>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                      {step.icon}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{step.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl border border-indigo-100 dark:border-indigo-900/30 flex gap-4 items-start">
              <Heart className="w-5 h-5 text-indigo-600 shrink-0 mt-1" />
              <div className="space-y-1">
                <h4 className="font-bold text-indigo-900 dark:text-indigo-300 text-sm">¿Por qué AMPA?</h4>
                <p className="text-xs text-indigo-800 dark:text-indigo-400 leading-relaxed">
                  Permite obtener un promedio real de tu presión arterial en tu entorno habitual, evitando el estrés de la consulta médica.
                </p>
              </div>
            </div>
            <div className="p-6 bg-rose-50 dark:bg-rose-900/20 rounded-3xl border border-rose-100 dark:border-rose-900/30 flex gap-4 items-start">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-1" />
              <div className="space-y-1">
                <h4 className="font-bold text-rose-900 dark:text-rose-300 text-sm">Aviso Importante</h4>
                <p className="text-xs text-rose-800 dark:text-rose-400 leading-relaxed">
                  Si obtienes valores altos de forma persistente o sientes síntomas graves, contacta con tu médico de inmediato.
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800">
          <Button className="w-full h-14" onClick={onClose}>
            Entendido
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
