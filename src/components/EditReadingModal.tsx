import React, { useState, useEffect } from 'react';
import { useUpdateReading, Reading } from '../lib/api';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { 
  Heart, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  X,
  Plus,
  Minus,
  MessageSquare,
  Save
} from 'lucide-react';

interface EditReadingModalProps {
  reading: Reading;
  onClose: () => void;
}

export const EditReadingModal: React.FC<EditReadingModalProps> = ({ reading, onClose }) => {
  const [systolic, setSystolic] = useState(reading.systolic.toString());
  const [diastolic, setDiastolic] = useState(reading.diastolic.toString());
  const [pulse, setPulse] = useState(reading.heartRate?.toString() || '');
  const [notes, setNotes] = useState(reading.notes || '');
  const [error, setError] = useState<string | null>(null);
  
  const updateReading = useUpdateReading();

  const sys = parseInt(systolic) || 0;
  const dia = parseInt(diastolic) || 0;
  const fc = parseInt(pulse) || 0;
  
  const getStatus = () => {
    if (sys === 0 || dia === 0) return 'none';
    if (sys >= 135 || dia >= 85) return 'danger';
    if (sys >= 130 || dia >= 80) return 'warning';
    if (sys < 100 || dia < 60) return 'low';
    return 'normal';
  };

  const getPulseStatus = () => {
    if (fc === 0) return 'none';
    if (fc > 100) return 'high';
    if (fc < 60) return 'low';
    return 'normal';
  };

  const status = getStatus();
  const pulseStatus = getPulseStatus();

  const getValidationError = () => {
    if (systolic && (sys < 60 || sys > 300)) return 'La presión sistólica (PAS) debe estar entre 60 y 300 mmHg.';
    if (diastolic && (dia < 40 || dia > 200)) return 'La presión diastólica (PAD) debe estar entre 40 y 200 mmHg.';
    if (pulse && (fc < 30 || fc > 250)) return 'La frecuencia cardíaca (FC) debe estar entre 30 y 250 lpm.';
    return null;
  };

  const validationError = getValidationError();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = getValidationError();
    if (validation) {
      setError(validation);
      return;
    }

    try {
      await updateReading.mutateAsync({
        id: reading.id,
        systolic: sys,
        diastolic: dia,
        heartRate: pulse ? parseInt(pulse) : undefined,
        notes: notes.trim() || undefined
      });
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const adjustValue = (setter: React.Dispatch<React.SetStateAction<string>>, current: string, delta: number) => {
    const val = parseInt(current) || 120;
    setter((val + delta).toString());
  };

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
        className={cn(
          "relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border transition-all duration-500 max-h-[90vh] flex flex-col",
          status === 'danger' ? "border-rose-200 dark:border-rose-900/50" : 
          status === 'warning' ? "border-amber-200 dark:border-amber-900/50" :
          status === 'normal' ? "border-emerald-200 dark:border-emerald-900/50" :
          status === 'low' ? "border-sky-200 dark:border-sky-900/50" :
          "border-slate-100 dark:border-slate-800"
        )}
      >
        <style dangerouslySetInnerHTML={{ __html: `
          input[type=number]::-webkit-inner-spin-button, 
          input[type=number]::-webkit-outer-spin-button { 
            -webkit-appearance: none; 
            margin: 0; 
          }
          input[type=number] {
            -moz-appearance: textfield;
          }
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
        <div className={cn(
          "p-6 border-b transition-colors duration-500 flex items-center justify-between shrink-0",
          status === 'danger' ? "bg-rose-50/50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/30" : 
          status === 'warning' ? "bg-amber-50/50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30" :
          status === 'normal' ? "bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30" :
          status === 'low' ? "bg-sky-50/50 dark:bg-sky-900/20 border-sky-100 dark:border-sky-900/30" :
          "bg-slate-50/50 dark:bg-slate-800/50 border-slate-50 dark:border-slate-800"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center text-white transition-colors duration-500",
              status === 'danger' ? "bg-rose-600 dark:bg-rose-500" : 
              status === 'warning' ? "bg-amber-500 dark:bg-amber-400" :
              status === 'normal' ? "bg-emerald-500 dark:bg-emerald-400" :
              status === 'low' ? "bg-sky-500 dark:bg-sky-400" :
              "bg-indigo-600 dark:bg-indigo-500"
            )}>
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Editar Medición</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">
                {new Date(reading.recordedAt).toLocaleDateString()} • {new Date(reading.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-400 dark:text-slate-500" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Sistólica (PAS)</label>
                <div className="relative group">
                  <input 
                    type="number" 
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                    className={cn(
                      "w-full h-16 border-2 rounded-2xl px-5 font-mono text-2xl focus:ring-0 transition-all text-slate-900 dark:text-white",
                      systolic && (sys < 60 || sys > 300) ? "bg-rose-100 dark:bg-rose-900/30 border-rose-500 text-rose-900 dark:text-rose-100" :
                      status === 'danger' && sys >= 135 ? "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-900/30 focus:border-rose-500 text-rose-700 dark:text-rose-300" : 
                      status === 'warning' && sys >= 130 ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/30 focus:border-amber-500 text-amber-700 dark:text-amber-300" :
                      status === 'normal' ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900/30 focus:border-emerald-500 text-emerald-700 dark:text-emerald-300" :
                      status === 'low' && sys < 100 ? "bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-900/30 focus:border-sky-500 text-sky-700 dark:text-sky-300" :
                      "bg-slate-50 dark:bg-slate-800 border-transparent focus:border-indigo-500 dark:focus:border-indigo-400"
                    )}
                    required
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
                    <button type="button" onClick={() => adjustValue(setSystolic, systolic, 1)} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"><Plus className="w-3 h-3" /></button>
                    <span className="text-[8px] font-black uppercase text-slate-300 dark:text-slate-600">mmHg</span>
                    <button type="button" onClick={() => adjustValue(setSystolic, systolic, -1)} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"><Minus className="w-3 h-3" /></button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Diastólica (PAD)</label>
                <div className="relative group">
                  <input 
                    type="number" 
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                    className={cn(
                      "w-full h-16 border-2 rounded-2xl px-5 font-mono text-2xl focus:ring-0 transition-all text-slate-900 dark:text-white",
                      diastolic && (dia < 40 || dia > 200) ? "bg-rose-100 dark:bg-rose-900/30 border-rose-500 text-rose-900 dark:text-rose-100" :
                      status === 'danger' && dia >= 85 ? "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-900/30 focus:border-rose-500 text-rose-700 dark:text-rose-300" : 
                      status === 'warning' && dia >= 80 ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/30 focus:border-amber-500 text-amber-700 dark:text-amber-300" :
                      status === 'normal' ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900/30 focus:border-emerald-500 text-emerald-700 dark:text-emerald-300" :
                      status === 'low' && dia < 60 ? "bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-900/30 focus:border-sky-500 text-sky-700 dark:text-sky-300" :
                      "bg-slate-50 dark:bg-slate-800 border-transparent focus:border-indigo-500 dark:focus:border-indigo-400"
                    )}
                    required
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
                    <button type="button" onClick={() => adjustValue(setDiastolic, diastolic, 1)} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"><Plus className="w-3 h-3" /></button>
                    <span className="text-[8px] font-black uppercase text-slate-300 dark:text-slate-600">mmHg</span>
                    <button type="button" onClick={() => adjustValue(setDiastolic, diastolic, -1)} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"><Minus className="w-3 h-3" /></button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Frecuencia Cardíaca</label>
              <div className="relative group">
                <input 
                  type="number" 
                  value={pulse}
                  onChange={(e) => setPulse(e.target.value)}
                  className={cn(
                    "w-full h-16 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-2xl px-5 font-mono text-2xl focus:ring-0 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-slate-900 dark:text-white",
                    pulse && (fc < 30 || fc > 250) ? "bg-rose-100 dark:bg-rose-900/30 border-rose-500 text-rose-900 dark:text-rose-100" :
                    pulseStatus === 'high' ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/30" :
                    pulseStatus === 'low' ? "bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-900/30" :
                    pulseStatus === 'normal' ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900/30" : ""
                  )}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                  <Heart className={cn(
                    "w-6 h-6 animate-pulse",
                    pulseStatus === 'high' ? "text-rose-600 dark:text-rose-500" :
                    pulseStatus === 'low' ? "text-sky-600 dark:text-sky-500" :
                    pulseStatus === 'normal' ? "text-emerald-600 dark:text-emerald-500" : "text-rose-500 dark:text-rose-400"
                  )} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Notas</label>
              <div className="relative">
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Añade una nota..."
                  className="w-full min-h-[100px] bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-2xl px-5 py-4 text-sm font-medium focus:ring-0 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 resize-none"
                />
                <div className="absolute right-4 top-4">
                  <MessageSquare className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-bold flex items-center gap-2 border border-rose-100 dark:border-rose-900/30">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={updateReading.isPending || !!validationError}
              className="w-full h-14 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {updateReading.isPending ? "Guardando..." : (
                <>
                  <Save className="w-5 h-5" />
                  Guardar Cambios
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
