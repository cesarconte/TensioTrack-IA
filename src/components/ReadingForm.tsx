import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAddReading } from '../lib/api';
import { cn } from '../lib/utils';
import { getClinicalStatus } from '../domain/clinicalStatus';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  X,
  Clock,
  Calendar,
  Plus,
  Minus,
  MessageSquare
} from 'lucide-react';

interface ReadingFormProps {
  slot: 'morning' | 'evening';
  onComplete: () => void;
  onCancel: () => void;
}

export const ReadingForm: React.FC<ReadingFormProps> = ({ slot, onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const addReading = useAddReading();

  const sys = parseInt(systolic) || 0;
  const dia = parseInt(diastolic) || 0;
  const fc = parseInt(pulse) || 0;
  
  const getStatus = () => {
    if (sys === 0 || dia === 0) return 'none';
    return getClinicalStatus(sys, dia);
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
    const fc = pulse ? parseInt(pulse) : 0;
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

    const fc = pulse ? parseInt(pulse) : undefined;

    try {
      await addReading.mutateAsync({
        systolic: sys,
        diastolic: dia,
        heartRate: fc,
        slot,
        notes: notes.trim() || undefined
      });
      
      if (step < 3) {
        setStep(step + 1);
        setSystolic('');
        setDiastolic('');
        setPulse('');
        setNotes('');
      } else {
        onComplete();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const adjustValue = (setter: React.Dispatch<React.SetStateAction<string>>, current: string, delta: number) => {
    const val = parseInt(current) || 120;
    setter((val + delta).toString());
  };

  return (
    <div className={cn(
      "bg-white rounded-[2rem] shadow-2xl overflow-hidden border transition-all duration-500 max-h-[90vh] flex flex-col",
      status === 'danger' ? "border-rose-200" : 
      status === 'high' ? "border-orange-200" :
      status === 'warning' ? "border-amber-200" :
      status === 'normal' ? "border-emerald-200" :
      status === 'low' ? "border-sky-200" :
      "border-slate-100"
    )}>
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
        "p-5 border-b transition-colors duration-500 flex items-center justify-between shrink-0",
        status === 'danger' ? "bg-rose-50/50 border-rose-100" : 
        status === 'high' ? "bg-orange-50/50 border-orange-100" :
        status === 'warning' ? "bg-amber-50/50 border-amber-100" :
        status === 'normal' ? "bg-emerald-50/50 border-emerald-100" :
        status === 'low' ? "bg-sky-50/50 border-sky-100" :
        "bg-slate-50/50 border-slate-50"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center text-white transition-colors duration-500",
            status === 'danger' ? "bg-rose-600" : 
            status === 'high' ? "bg-orange-500" :
            status === 'warning' ? "bg-amber-500" :
            status === 'normal' ? "bg-emerald-500" :
            status === 'low' ? "bg-sky-500" :
            "bg-indigo-600"
          )}>
            {status === 'danger' || status === 'warning' || status === 'low' ? (
              <AlertCircle className="w-4 h-4" />
            ) : status === 'normal' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Activity className="w-4 h-4" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 leading-tight">Sesión de {slot === 'morning' ? 'Mañana' : 'Noche'}</h3>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Toma {step} de 3</p>
          </div>
        </div>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={cn(
                "h-1 rounded-full transition-all duration-500",
                s === step ? "w-6 bg-indigo-600" : s < step ? "w-3 bg-emerald-500" : "w-3 bg-slate-200"
              )} 
            />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sistólica (PAS)</label>
              <div className="relative group">
                <input 
                  type="number" 
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value)}
                  placeholder="120"
                  className={cn(
                    "w-full h-16 border-2 rounded-2xl px-5 font-mono text-2xl focus:ring-0 transition-all text-slate-900",
                    systolic && (sys < 60 || sys > 300) ? "bg-rose-100 border-rose-500 text-rose-900 animate-pulse" :
                    status === 'danger' && sys >= 135 ? "bg-rose-50 border-rose-200 focus:border-rose-500 text-rose-700" : 
                    (status === 'high' && sys >= 135) ? "bg-orange-50 border-orange-200 focus:border-orange-500 text-orange-700" :
                    status === 'warning' && sys >= 130 ? "bg-amber-50 border-amber-200 focus:border-amber-500 text-amber-700" :
                    status === 'normal' ? "bg-emerald-50 border-emerald-200 focus:border-emerald-500 text-emerald-700" :
                    status === 'low' && sys < 100 ? "bg-sky-50 border-sky-200 focus:border-sky-500 text-sky-700" :
                    "bg-slate-50 border-transparent focus:border-indigo-500"
                  )}
                  required
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
                  <button 
                    type="button"
                    onClick={() => adjustValue(setSystolic, systolic, 1)}
                    className={cn(
                      "p-1 hover:bg-white hover:shadow-sm rounded-lg transition-all",
                      status === 'danger' && sys >= 135 ? "text-rose-400 hover:text-rose-600" : 
                      status === 'high' && sys >= 135 ? "text-orange-400 hover:text-orange-600" :
                      status === 'warning' && sys >= 130 ? "text-amber-400 hover:text-amber-600" :
                      status === 'normal' ? "text-emerald-400 hover:text-emerald-600" :
                      status === 'low' && sys < 100 ? "text-sky-400 hover:text-sky-600" :
                      "text-slate-400 hover:text-indigo-600"
                    )}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-tighter",
                    status === 'danger' && sys >= 135 ? "text-rose-300" : 
                    status === 'high' && sys >= 135 ? "text-orange-300" :
                    status === 'warning' && sys >= 130 ? "text-amber-300" :
                    status === 'normal' ? "text-emerald-300" :
                    status === 'low' && sys < 100 ? "text-sky-300" :
                    "text-slate-300"
                  )}>mmHg</span>
                  <button 
                    type="button"
                    onClick={() => adjustValue(setSystolic, systolic, -1)}
                    className={cn(
                      "p-1 hover:bg-white hover:shadow-sm rounded-lg transition-all",
                      status === 'danger' && sys >= 135 ? "text-rose-400 hover:text-rose-600" : 
                      status === 'high' && sys >= 135 ? "text-orange-400 hover:text-orange-600" :
                      status === 'warning' && sys >= 130 ? "text-amber-400 hover:text-amber-600" :
                      status === 'normal' ? "text-emerald-400 hover:text-emerald-600" :
                      status === 'low' && sys < 100 ? "text-sky-400 hover:text-sky-600" :
                      "text-slate-400 hover:text-indigo-600"
                    )}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Diastólica (PAD)</label>
              <div className="relative group">
                <input 
                  type="number" 
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value)}
                  placeholder="80"
                  className={cn(
                    "w-full h-16 border-2 rounded-2xl px-5 font-mono text-2xl focus:ring-0 transition-all text-slate-900",
                    diastolic && (dia < 40 || dia > 200) ? "bg-rose-100 border-rose-500 text-rose-900 animate-pulse" :
                    status === 'danger' && dia >= 85 ? "bg-rose-50 border-rose-200 focus:border-rose-500 text-rose-700" : 
                    status === 'high' && dia >= 85 ? "bg-orange-50 border-orange-200 focus:border-orange-500 text-orange-700" :
                    status === 'warning' && dia >= 80 ? "bg-amber-50 border-amber-200 focus:border-amber-500 text-amber-700" :
                    status === 'normal' ? "bg-emerald-50 border-emerald-200 focus:border-emerald-500 text-emerald-700" :
                    status === 'low' && dia < 60 ? "bg-sky-50 border-sky-200 focus:border-sky-500 text-sky-700" :
                    "bg-slate-50 border-transparent focus:border-indigo-500"
                  )}
                  required
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
                  <button 
                    type="button"
                    onClick={() => adjustValue(setDiastolic, diastolic, 1)}
                    className={cn(
                      "p-1 hover:bg-white hover:shadow-sm rounded-lg transition-all",
                      status === 'danger' && dia >= 85 ? "text-rose-400 hover:text-rose-600" : 
                      status === 'high' && dia >= 85 ? "text-orange-400 hover:text-orange-600" :
                      status === 'warning' && dia >= 80 ? "text-amber-400 hover:text-amber-600" :
                      status === 'normal' ? "text-emerald-400 hover:text-emerald-600" :
                      status === 'low' && dia < 60 ? "text-sky-400 hover:text-sky-600" :
                      "text-slate-400 hover:text-indigo-600"
                    )}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-tighter",
                    status === 'danger' && dia >= 85 ? "text-rose-300" : 
                    status === 'high' && dia >= 85 ? "text-orange-300" :
                    status === 'warning' && dia >= 80 ? "text-amber-300" :
                    status === 'normal' ? "text-emerald-300" :
                    status === 'low' && dia < 60 ? "text-sky-300" :
                    "text-slate-300"
                  )}>mmHg</span>
                  <button 
                    type="button"
                    onClick={() => adjustValue(setDiastolic, diastolic, -1)}
                    className={cn(
                      "p-1 hover:bg-white hover:shadow-sm rounded-lg transition-all",
                      status === 'danger' && dia >= 85 ? "text-rose-400 hover:text-rose-600" : 
                      status === 'high' && dia >= 85 ? "text-orange-400 hover:text-orange-600" :
                      status === 'warning' && dia >= 80 ? "text-amber-400 hover:text-amber-600" :
                      status === 'normal' ? "text-emerald-400 hover:text-emerald-600" :
                      status === 'low' && dia < 60 ? "text-sky-400 hover:text-sky-600" :
                      "text-slate-400 hover:text-indigo-600"
                    )}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Frecuencia Cardíaca</label>
            <div className="relative group">
              <input 
                type="number" 
                value={pulse}
                onChange={(e) => setPulse(e.target.value)}
                placeholder="72"
                className={cn(
                  "w-full h-16 border-2 rounded-2xl px-5 font-mono text-2xl focus:ring-0 transition-all text-slate-900",
                  pulse && (fc < 30 || fc > 250) ? "bg-rose-100 border-rose-500 text-rose-900 animate-pulse" :
                  pulseStatus === 'high' ? "bg-amber-50 border-amber-200 focus:border-amber-500 text-amber-700" :
                  pulseStatus === 'low' ? "bg-sky-50 border-sky-200 focus:border-sky-500 text-sky-700" :
                  pulseStatus === 'normal' ? "bg-emerald-50 border-emerald-200 focus:border-emerald-500 text-emerald-700" :
                  "bg-slate-50 border-transparent focus:border-indigo-500"
                )}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                <Heart className={cn(
                  "w-6 h-6 animate-pulse transition-colors duration-500",
                  pulseStatus === 'high' ? "text-rose-600" :
                  pulseStatus === 'low' ? "text-sky-600" :
                  pulseStatus === 'normal' ? "text-emerald-600" :
                  "text-rose-500"
                )} />
                <div className="flex flex-col items-center gap-1">
                  <button 
                    type="button"
                    onClick={() => adjustValue(setPulse, pulse, 1)}
                    className={cn(
                      "p-1 hover:bg-white hover:shadow-sm rounded-lg transition-all",
                      pulseStatus === 'high' ? "text-rose-400 hover:text-rose-600" :
                      pulseStatus === 'low' ? "text-sky-400 hover:text-sky-600" :
                      pulseStatus === 'normal' ? "text-emerald-400 hover:text-emerald-600" :
                      "text-slate-400 hover:text-indigo-600"
                    )}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-tighter",
                    pulseStatus === 'high' ? "text-rose-300" :
                    pulseStatus === 'low' ? "text-sky-300" :
                    pulseStatus === 'normal' ? "text-emerald-300" :
                    "text-slate-300"
                  )}>lpm</span>
                  <button 
                    type="button"
                    onClick={() => adjustValue(setPulse, pulse, -1)}
                    className={cn(
                      "p-1 hover:bg-white hover:shadow-sm rounded-lg transition-all",
                      pulseStatus === 'high' ? "text-rose-400 hover:text-rose-600" :
                      pulseStatus === 'low' ? "text-sky-400 hover:text-sky-600" :
                      pulseStatus === 'normal' ? "text-emerald-400 hover:text-emerald-600" :
                      "text-slate-400 hover:text-indigo-600"
                    )}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notas (Opcional)</label>
            <div className="relative group">
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Después de caminar..."
                className="w-full min-h-[80px] bg-slate-50 border-2 border-transparent rounded-2xl px-5 py-3 text-sm focus:ring-0 focus:border-indigo-500 transition-all text-slate-900 resize-none"
              />
              <div className="absolute right-4 top-3">
                <MessageSquare className="w-4 h-4 text-slate-300" />
              </div>
            </div>
          </div>

          {(error || validationError) && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-sm font-medium flex items-center gap-2 border border-rose-100"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {validationError || error}
            </motion.div>
          )}

          <button 
            type="submit" 
            disabled={addReading.isPending || !!validationError}
            className={cn(
              "w-full h-14 rounded-2xl font-bold text-base shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50",
              !!validationError ? "bg-slate-200 text-slate-400 shadow-none cursor-not-allowed" :
              status === 'danger' ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200" : 
              status === 'high' ? "bg-orange-600 hover:bg-orange-700 text-white shadow-orange-200" :
              status === 'warning' ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200" :
              status === 'normal' ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200" :
              status === 'low' ? "bg-sky-600 hover:bg-sky-700 text-white shadow-sky-200" :
              "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"
            )}
          >
            {addReading.isPending ? "Guardando..." : (
              <>
                {step === 3 ? "Finalizar Sesión" : "Siguiente Toma"}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className={cn(
          "mt-6 p-3 rounded-2xl border transition-all duration-500",
          status === 'danger' || pulseStatus === 'high' ? "bg-rose-50 border-rose-100" : 
          status === 'high' ? "bg-orange-50 border-orange-100" :
          status === 'warning' || pulseStatus === 'low' ? "bg-amber-50 border-amber-100" :
          status === 'normal' && pulseStatus === 'normal' ? "bg-emerald-50 border-emerald-100" :
          status === 'low' ? "bg-sky-50 border-sky-100" :
          "bg-amber-50 border-amber-100"
        )}>
          <div className="flex gap-2">
            {(status === 'danger' || status === 'high' || status === 'warning' || status === 'low' || pulseStatus === 'high' || pulseStatus === 'low') ? (
              <AlertCircle className={cn(
                "w-4 h-4 shrink-0 mt-0.5",
                (status === 'danger' || pulseStatus === 'high') ? "text-rose-600" : 
                (status === 'high') ? "text-orange-600" :
                (status === 'warning' || pulseStatus === 'low') ? "text-amber-600" :
                "text-sky-600"
              )} />
            ) : (status === 'normal' && pulseStatus === 'normal') ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className={cn(
              "text-[10px] leading-relaxed space-y-1",
              (status === 'danger' || pulseStatus === 'high') ? "text-rose-800" : 
              (status === 'high') ? "text-orange-800" :
              (status === 'warning' || pulseStatus === 'low') ? "text-amber-800" :
              (status === 'normal' && pulseStatus === 'normal') ? "text-emerald-800" :
              status === 'low' ? "text-sky-800" :
              "text-amber-800"
            )}>
              {/* Blood Pressure Message */}
              <div>
                {status === 'danger' ? (
                  <><strong>Hipertensión (AMPA):</strong> Valores por encima del objetivo (135/85).</>
                ) : status === 'high' ? (
                  <><strong>Hipertensión AMPA:</strong> Valor por encima del objetivo domiciliario (&ge;135/85).</>
                ) : status === 'warning' ? (
                  <><strong>Presión Elevada:</strong> Ligeramente por encima del rango óptimo.</>
                ) : status === 'normal' ? (
                  <><strong>Presión Normal:</strong> Valores dentro de los límites saludables.</>
                ) : status === 'low' ? (
                  <><strong>Presión Baja:</strong> Valores inferiores a lo normal (100/60).</>
                ) : (
                  <><strong>Recordatorio AMPA:</strong> Reposo de 5 min. antes de la toma.</>
                )}
              </div>

              {/* Pulse Message */}
              {pulseStatus !== 'none' && (
                <div className="pt-1 border-t border-current/10">
                  {pulseStatus === 'high' ? (
                    <><strong>Taquicardia:</strong> Tu pulso es superior a 100 lpm en reposo. Asegúrate de estar relajado.</>
                  ) : pulseStatus === 'low' ? (
                    <><strong>Bradicardia:</strong> Tu pulso es inferior a 60 lpm. Si eres deportista esto puede ser normal.</>
                  ) : (
                    <><strong>Pulso Normal:</strong> Tu frecuencia cardíaca está en el rango óptimo (60-100 lpm).</>
                  )}
                </div>
              )}
              
              {status === 'none' && pulseStatus === 'none' && (
                <p>Evita hablar durante la toma y mantén el brazo a la altura del corazón.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
