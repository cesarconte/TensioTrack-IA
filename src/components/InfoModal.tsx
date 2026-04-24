import * as React from "react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import { Button } from "./ui/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/Tooltip";
import { Clock, Coffee, Heart, CheckCircle2, Book, X, AlertCircle } from "lucide-react";

interface InfoModalProps {
  onClose: () => void;
}

export function InfoModal({ onClose }: InfoModalProps) {
  const ranges = [
    { 
      label: 'Hipertensión', 
      range: '≥ 135 / 85', 
      desc: 'Valores por encima del objetivo clínico en domicilio.',
      color: 'text-destructive',
      bg: 'bg-destructive/10',
      border: 'border-destructive/20'
    },
    { 
      label: 'Normal-Alta', 
      range: '130-134 / 80-84', 
      desc: 'Ligeramente elevado. Requiere vigilancia y cambios de hábito.',
      color: 'text-warning',
      bg: 'bg-warning/10',
      border: 'border-warning/20'
    },
    { 
      label: 'Normal', 
      range: '100-129 / 60-79', 
      desc: 'Rango óptimo de salud cardiovascular.',
      color: 'text-success',
      bg: 'bg-success/10',
      border: 'border-success/20'
    },
    { 
      label: 'Baja', 
      range: '< 100 / 60', 
      desc: 'Presión inferior a lo habitual. Consultar si hay síntomas.',
      color: 'text-info',
      bg: 'bg-info/10',
      border: 'border-info/20'
    },
  ];

  const pulseRanges = [
    {
      label: 'Taquicardia',
      range: '> 100 ppm',
      desc: 'Frecuencia cardíaca elevada en reposo.',
      color: 'text-destructive',
      bg: 'bg-destructive/10'
    },
    {
      label: 'Normal',
      range: '60 - 100 ppm',
      desc: 'Ritmo cardíaco estándar para un adulto en reposo.',
      color: 'text-success',
      bg: 'bg-success/10'
    },
    {
      label: 'Bradicardia',
      range: '< 60 ppm',
      desc: 'Frecuencia cardíaca baja. Normal en deportistas.',
      color: 'text-warning',
      bg: 'bg-warning/10'
    }
  ];

  const steps = [
    { icon: <Clock className="text-[20px]" />, text: 'Reposa sentado al menos 5 minutos antes de la lectura.' },
    { icon: <Coffee className="text-[20px]" />, text: 'Evita café, tabaco o ejercicio 30 min. antes.' },
    { icon: <Heart className="text-[20px]" />, text: 'Espalda apoyada y brazo a la altura del corazón.' },
    { icon: <CheckCircle2 className="text-[20px]" />, text: 'Realiza 3 lecturas seguidas con 1 min. de descanso entre ellas.' },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-card w-full max-w-2xl h-full sm:h-[85vh] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col my-auto border-none sm:border border-border"
      >
        <div className="p-6 flex items-center justify-between bg-surface-low/50">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-sm shrink-0">
              <Book className="text-[24px]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-display font-black text-foreground truncate">Guía AMPA</h2>
              <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest truncate">Protocolo Médico Oficial</p>
            </div>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-surface-high rounded-full transition-all shrink-0 hover:scale-110 active:scale-90"
                aria-label="Cerrar guía"
              >
                <X className="text-[24px] text-on-surface-variant" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Cerrar guía</TooltipContent>
          </Tooltip>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
          <section className="space-y-6">
            <h3 className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Clasificación de Presión Arterial</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ranges.map((range, idx) => (
                <div key={idx} className={cn("p-5 rounded-[2.5rem] transition-all", range.bg)}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn("text-[10px] font-black uppercase tracking-widest", range.color)}>{range.label}</span>
                    <span className={cn("font-mono font-bold", range.color)}>{range.range}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed font-medium">{range.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Clasificación de Pulso</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {pulseRanges.map((range, idx) => (
                <div key={idx} className={cn("p-5 rounded-[2.5rem] transition-all", range.bg)}>
                  <div className="flex flex-col gap-1 mb-2">
                    <span className={cn("text-[10px] font-black uppercase tracking-widest", range.color)}>{range.label}</span>
                    <span className={cn("font-mono font-bold text-lg", range.color)}>{range.range}</span>
                  </div>
                  <p className="text-[10px] text-on-surface-variant leading-relaxed font-medium">{range.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Pasos para una lectura correcta</h3>
            <div className="bg-surface-low rounded-[2.5rem] p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 shadow-sm flex items-center justify-center text-primary shrink-0">
                      {step.icon}
                    </div>
                    <p className="text-xs text-on-surface-variant font-medium leading-relaxed">{step.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="p-6 bg-primary/5 rounded-[2.5rem] flex gap-4 items-start">
              <Heart className="text-[20px] text-primary shrink-0 mt-1" />
              <div className="space-y-1">
                <h4 className="font-bold text-primary text-sm">¿Por qué AMPA?</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Permite obtener un promedio real de tu presión arterial en tu entorno habitual, evitando el estrés de la consulta médica.
                </p>
              </div>
            </div>
            <div className="p-6 bg-destructive/5 rounded-[2.5rem] flex gap-4 items-start">
              <AlertCircle className="text-[20px] text-destructive shrink-0 mt-1" />
              <div className="space-y-1">
                <h4 className="font-bold text-destructive text-sm">Aviso Importante</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Si obtienes valores altos de forma persistente o sientes síntomas graves, contacta con tu médico de inmediato.
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="p-6 bg-surface-low/50 sm:bg-transparent mt-auto sticky bottom-0">
          <Button 
            size="lg"
            className="w-full h-14 sm:h-16 rounded-full text-xs sm:text-sm font-black tracking-[0.2em] uppercase bg-linear-to-br from-primary to-primary-container text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 border-none" 
            onClick={onClose}
          >
            <CheckCircle2 className="w-5 h-5" />
            Entendido
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
