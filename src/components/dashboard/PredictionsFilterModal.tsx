import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";
import { Filter, Calendar, ChevronRight, X, Search } from "lucide-react";
import { Cycle } from "../../types";

interface PredictionsFilterModalProps {
  onClose: () => void;
  onApply: (cycleIndex: number) => void;
  historicalCycles: Cycle[];
  currentPeriodLabel: string;
  selectedCycleIndex: number;
}

export function PredictionsFilterModal({ 
  onClose, 
  onApply, 
  historicalCycles, 
  currentPeriodLabel,
  selectedCycleIndex 
}: PredictionsFilterModalProps) {
  const [selectedYear, setSelectedYear] = React.useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = React.useState<number>(new Date().getMonth());
  const [localSelectedIndex, setLocalSelectedIndex] = React.useState<number>(selectedCycleIndex);

  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const years = React.useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(new Date().getFullYear());
    historicalCycles.forEach(c => {
      yearsSet.add(new Date(c.startDate).getFullYear());
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [historicalCycles]);

  const filteredCycles = React.useMemo(() => {
    return historicalCycles.map((cycle, index) => ({ cycle, index })).filter(({ cycle }) => {
      const d = new Date(cycle.startDate);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    });
  }, [historicalCycles, selectedYear, selectedMonth]);

  const handleApply = () => {
    onApply(localSelectedIndex);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-xl bg-card rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-border"
      >
        {/* Header */}
        <div className="p-8 border-b border-border bg-surface-low relative">
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 p-2 text-on-surface-variant hover:bg-surface-high rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-full text-primary">
              <Filter size={18} />
            </div>
            <p className="text-[10px] font-black tracking-widest text-primary uppercase">Configuración de Análisis</p>
          </div>
          <h2 className="text-2xl font-display font-black text-on-surface">Filtrar Períodos</h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Month/Year Selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black tracking-widest text-on-surface-variant uppercase ml-4">Año</label>
              <div className="relative">
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full appearance-none bg-surface-low text-on-surface font-bold rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer border-none"
                >
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-primary pointer-events-none" size={16} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black tracking-widest text-on-surface-variant uppercase ml-4">Mes</label>
              <div className="relative">
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="w-full appearance-none bg-surface-low text-on-surface font-bold rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer border-none"
                >
                  {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-primary pointer-events-none" size={16} />
              </div>
            </div>
          </div>

          {/* Current Period Option */}
          <div className="space-y-4">
             <label className="text-[10px] font-black tracking-widest text-on-surface-variant uppercase ml-4">Período Seleccionado</label>
             
             <div className="space-y-2">
                <button 
                  onClick={() => setLocalSelectedIndex(-1)}
                  className={cn(
                    "w-full flex items-center justify-between p-6 rounded-2xl transition-all border",
                    localSelectedIndex === -1 
                      ? "bg-primary/5 border-primary text-on-surface" 
                      : "bg-surface-lowest border-border text-on-surface-variant hover:border-primary/30"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                      localSelectedIndex === -1 ? "bg-primary text-white" : "bg-surface-low text-on-surface-variant/40"
                    )}>
                      <Calendar size={18} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold">{currentPeriodLabel}</p>
                      <p className="text-[10px] font-medium opacity-60 italic">Período en curso</p>
                    </div>
                  </div>
                  {localSelectedIndex === -1 && <div className="w-2 h-2 rounded-full bg-primary" />}
                </button>

                {filteredCycles.length > 0 ? (
                  filteredCycles.map(({ cycle, index }) => (
                    <button 
                      key={index}
                      onClick={() => setLocalSelectedIndex(index)}
                      className={cn(
                        "w-full flex items-center justify-between p-6 rounded-2xl transition-all border",
                        localSelectedIndex === index 
                          ? "bg-primary/5 border-primary text-on-surface" 
                          : "bg-surface-lowest border-border text-on-surface-variant hover:border-primary/30"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                          localSelectedIndex === index ? "bg-primary text-white" : "bg-surface-low text-on-surface-variant/40"
                        )}>
                          <Search size={18} />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold">
                            Ciclo {new Date(cycle.startDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })} - {new Date(cycle.endDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                          </p>
                          <p className="text-[10px] font-medium opacity-60">Evaluado • {cycle.days.length} días</p>
                        </div>
                      </div>
                      {localSelectedIndex === index && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </button>
                  ))
                ) : (
                  selectedMonth !== new Date().getMonth() && (
                    <div className="p-8 text-center bg-surface-lowest rounded-2xl border border-dashed border-border opacity-60">
                      <p className="text-xs font-medium italic">No se encontraron ciclos clínicos para este mes.</p>
                    </div>
                  )
                )}
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-border bg-surface-low flex gap-4">
          <Button 
            variant="secondary"
            className="flex-1 rounded-full py-6 font-bold text-xs uppercase tracking-widest"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button 
            className="flex-[2] rounded-full py-6 font-black text-xs uppercase tracking-widest"
            onClick={handleApply}
          >
            Confirmar Selección
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
