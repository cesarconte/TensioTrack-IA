import React from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Info, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle, 
  Activity,
  Clock,
  Coffee,
  Wind,
  Heart
} from 'lucide-react';
import { cn } from '../lib/utils';

interface InfoModalProps {
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ onClose }) => {
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
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
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 dark:shadow-none">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-black text-slate-900 dark:text-white">Guía y Valores AMPA</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Protocolo Médico Oficial</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl transition-colors">
            <X className="w-6 h-6 text-slate-400 dark:text-slate-500" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar space-y-10">
          {/* Ranges Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Activity className="w-5 h-5" />
              <h3 className="font-display font-black text-lg uppercase tracking-tight">Clasificación de Valores (mmHg)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ranges.map((range, idx) => (
                <div key={idx} className={cn("p-5 rounded-[2rem] border transition-all hover:shadow-md", range.bg, range.border)}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn("text-[10px] font-black uppercase tracking-widest", range.color)}>{range.label}</span>
                    <span className={cn("font-mono font-bold", range.color)}>{range.range}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{range.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Protocol Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Clock className="w-5 h-5" />
              <h3 className="font-display font-black text-lg uppercase tracking-tight">¿Cómo realizar una toma correcta?</h3>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                      {step.icon}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{step.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Additional Info */}
          <section className="space-y-4">
            <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/30 flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-sm">
                <Heart className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-indigo-900 dark:text-indigo-300 text-sm">¿Por qué es importante el AMPA?</h4>
                <p className="text-xs text-indigo-800 dark:text-indigo-400 leading-relaxed">
                  La Automedida de la Presión Arterial (AMPA) es más fiable que la toma en consulta, ya que evita el "efecto bata blanca" y permite obtener un promedio real de tu vida cotidiana durante varios días.
                </p>
              </div>
            </div>
            <div className="p-6 bg-rose-50 dark:bg-rose-900/20 rounded-[2rem] border border-rose-100 dark:border-rose-900/30 flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 shadow-sm">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-rose-900 dark:text-rose-300 text-sm">Aviso Médico</h4>
                <p className="text-xs text-rose-800 dark:text-rose-400 leading-relaxed">
                  TensioTrack es una herramienta de seguimiento. Si obtienes valores de hipertensión de forma persistente o sientes síntomas como dolor de cabeza intenso, mareos o visión borrosa, contacta con tu médico de inmediato.
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button 
            onClick={onClose}
            className="w-full h-14 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl font-bold hover:bg-slate-800 dark:hover:bg-slate-600 transition-all shadow-lg shadow-slate-200 dark:shadow-none"
          >
            Entendido
          </button>
        </div>
      </motion.div>
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}} />
    </div>
  );
};
