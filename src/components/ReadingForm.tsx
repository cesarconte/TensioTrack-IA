import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAddReading } from '../lib/api';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Clock,
  Calendar
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
  const [error, setError] = useState<string | null>(null);
  
  const addReading = useAddReading();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const sys = parseInt(systolic);
    const dia = parseInt(diastolic);
    const fc = pulse ? parseInt(pulse) : undefined;

    // Clinical range validation
    if (sys < 60 || sys > 300) return setError('PAS fuera de rango clínico (60-300)');
    if (dia < 40 || dia > 200) return setError('PAD fuera de rango clínico (40-200)');
    if (fc && (fc < 30 || fc > 250)) return setError('FC fuera de rango clínico (30-250)');

    try {
      await addReading.mutateAsync({
        systolic: sys,
        diastolic: dia,
        heartRate: fc,
        slot
      });
      
      if (step < 3) {
        setStep(step + 1);
        setSystolic('');
        setDiastolic('');
        setPulse('');
      } else {
        onComplete();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
      <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Sesión de {slot === 'morning' ? 'Mañana' : 'Noche'}</h3>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Toma {step} de 3</p>
          </div>
        </div>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors">
          <AlertCircle className="w-5 h-5" />
        </button>
      </div>

      <div className="p-8">
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={cn(
                "h-1.5 rounded-full transition-all duration-500",
                s === step ? "w-8 bg-indigo-600" : s < step ? "w-4 bg-emerald-500" : "w-4 bg-slate-200"
              )} 
            />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Sistólica (PAS)</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value)}
                  placeholder="120"
                  className="w-full h-14 bg-slate-50 border-none rounded-2xl px-4 font-mono text-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">mmHg</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Diastólica (PAD)</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value)}
                  placeholder="80"
                  className="w-full h-14 bg-slate-50 border-none rounded-2xl px-4 font-mono text-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">mmHg</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Frecuencia Cardíaca</label>
            <div className="relative">
              <input 
                type="number" 
                value={pulse}
                onChange={(e) => setPulse(e.target.value)}
                placeholder="72"
                className="w-full h-14 bg-slate-50 border-none rounded-2xl px-4 font-mono text-xl focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <Heart className="absolute right-12 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">lpm</span>
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-sm font-medium flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </motion.div>
          )}

          <button 
            type="submit" 
            disabled={addReading.isPending}
            className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {addReading.isPending ? "Guardando..." : (
              <>
                {step === 3 ? "Finalizar Sesión" : "Siguiente Toma"}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 p-4 bg-amber-50 rounded-2xl border border-amber-100">
          <div className="flex gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Recordatorio AMPA:</strong> Asegúrate de haber estado en reposo 5 minutos. 
              Evita hablar durante la toma y mantén el brazo a la altura del corazón.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
