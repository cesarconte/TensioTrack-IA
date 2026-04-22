import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";
import { Cycle, DayStats } from "../../types";
import { X, Check, BrainCircuit, ArrowLeftRight, ArrowRightLeft, Activity, TrendingUp, Utensils, Moon } from "lucide-react";

export interface AnalysisFilters {
  cycleId: string; // "current" or startDate
  month?: string; // e.g. "2024-04"
  healthFocus: 'general' | 'tension-peaks' | 'lifestyle-correlation' | 'circadian-rhythm';
  isComparative: boolean;
}

interface AnalysisFilterModalProps {
  onClose: () => void;
  onApply: (filters: AnalysisFilters) => void;
  initialFilters: AnalysisFilters;
  historicalCycles: Cycle[];
  currentPeriod: {
    days: DayStats[];
    isComplete: boolean;
    startDate: string;
    endDate: string;
  };
}

export function AnalysisFilterModal({ 
  onClose, 
  onApply, 
  initialFilters, 
  historicalCycles,
  currentPeriod
}: AnalysisFilterModalProps) {
  const [selectedYear, setSelectedYear] = React.useState<number>(
    initialFilters.month ? parseInt(initialFilters.month.split('-')[0]) : new Date().getFullYear()
  );
  const [selectedMonth, setSelectedMonth] = React.useState<string>(
    initialFilters.month || new Date().toISOString().substring(0, 7)
  );
  const [selectedCycleId, setSelectedCycleId] = React.useState<string>(initialFilters.cycleId);
  const [healthFocus, setHealthFocus] = React.useState<AnalysisFilters['healthFocus']>(initialFilters.healthFocus);
  const [isComparative, setIsComparative] = React.useState<boolean>(initialFilters.isComparative || false);

  // Combine all cycles for selection
  const allCycles = React.useMemo(() => {
    const list = historicalCycles.map(c => ({
      id: c.startDate,
      label: `Período ${new Date(c.startDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })} - ${new Date(c.endDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}`,
      startDate: c.startDate,
      isComplete: true
    }));

    // Add current period
    list.unshift({
      id: 'current',
      label: `Período Actual`,
      startDate: currentPeriod.startDate,
      isComplete: currentPeriod.isComplete
    });

    return list;
  }, [historicalCycles, currentPeriod]);

  // Extract unique years from cycles
  const availableYears = React.useMemo(() => {
    const years = new Set<number>();
    allCycles.forEach(c => {
      years.add(new Date(c.startDate).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [allCycles]);

  // Extract months for the currently selected year
  const availableMonthsInYear = React.useMemo(() => {
    const months = new Set<string>();
    allCycles.forEach(c => {
      if (new Date(c.startDate).getFullYear() === selectedYear) {
        months.add(c.startDate.substring(0, 7));
      }
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [allCycles, selectedYear]);

  // Filter cycles by selected month
  const filteredCycles = React.useMemo(() => {
    return allCycles.filter(c => c.startDate.startsWith(selectedMonth));
  }, [allCycles, selectedMonth]);

  const handleApply = () => {
    onApply({
      cycleId: selectedCycleId,
      month: selectedMonth,
      healthFocus,
      isComparative
    });
    onClose();
  };

  const getMonthName = (monthStr: string) => {
    const [_, month] = monthStr.split('-');
    const date = new Date(2000, parseInt(month) - 1);
    const name = date.toLocaleDateString('es-ES', { month: 'long' });
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" 
        onClick={onClose} 
      />
      
      {/* Modal Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        className="relative w-full max-w-2xl bg-surface-low rounded-[2.5rem] shadow-2xl border border-border flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 p-2 text-on-surface-variant hover:bg-surface-high rounded-full transition-colors z-50 shrink-0"
          aria-label="Cerrar filtros"
        >
          <X className="" />
        </button>

        {/* Scrollable Content Area */}
        <div className="overflow-y-auto p-6 sm:p-10 md:p-12 pb-8 scrollbar-hide flex-1">
          <div className="mb-10 relative">
            <h1 className="text-3xl font-display font-black text-on-surface tracking-tight mb-2">
              Análisis Inteligente
            </h1>
            <p className="text-[10px] font-black tracking-[0.2em] text-primary uppercase">
              Configuración de Muestra Clínica
            </p>
          </div>

          <div className="space-y-6">
            {/* Hierarchical Filter Card */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-border shadow-sm">
              <div className="space-y-8">
                {/* Year Selector (Top Level Tabs) */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Año</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableYears.map(year => (
                      <button
                        key={year}
                        onClick={() => {
                          setSelectedYear(year);
                          // Reset month to first available in year
                          const firstMonth = allCycles.find(c => new Date(c.startDate).getFullYear() === year)?.startDate.substring(0, 7);
                          if (firstMonth) setSelectedMonth(firstMonth);
                        }}
                        className={cn(
                          "px-6 py-2 rounded-full text-xs font-black tracking-widest uppercase transition-all",
                          selectedYear === year 
                            ? "bg-primary text-white shadow-lg shadow-primary/20" 
                            : "bg-surface-high text-on-surface-variant hover:text-on-surface"
                        )}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Month Selector (Mid Level - Large rounded list) */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Mes de seguimiento</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {availableMonthsInYear.map(m => (
                      <button
                        key={m}
                        onClick={() => {
                          setSelectedMonth(m);
                          const firstInMonth = allCycles.find(c => c.startDate.startsWith(m));
                          if (firstInMonth) setSelectedCycleId(firstInMonth.id);
                        }}
                        className={cn(
                          "px-6 py-4 rounded-2xl text-sm font-bold transition-all border",
                          selectedMonth === m 
                            ? "bg-white border-primary text-primary shadow-sm" 
                            : "bg-surface-high/30 border-transparent text-on-surface-variant hover:border-border"
                        )}
                      >
                        {getMonthName(m)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Period Selector (Final Selection) */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Registros de Período</span>
                  </div>
                  <div className="space-y-3">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={selectedMonth}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-3"
                      >
                        {filteredCycles.map(c => (
                          <button
                            key={c.id}
                            onClick={() => setSelectedCycleId(c.id)}
                            className={cn(
                              "w-full flex items-center justify-between p-5 rounded-[1.5rem] text-left transition-all border",
                              selectedCycleId === c.id
                                ? "bg-primary/5 border-primary/20 shadow-sm"
                                : "bg-surface-lowest border-transparent hover:border-border"
                            )}
                          >
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-2.5 h-2.5 rounded-full",
                                c.isComplete ? "bg-success" : "bg-warning"
                              )} />
                              <div>
                                <span className={cn(
                                  "text-sm font-bold block",
                                  selectedCycleId === c.id ? "text-primary " : "text-on-surface"
                                )}>
                                  {c.label}
                                </span>
                                <span className="text-[10px] text-on-surface-variant/50 font-medium">
                                  {c.id === 'current' ? 'Fase de recolección activa' : 'Registro clínico verificado'}
                                </span>
                              </div>
                            </div>
                            {selectedCycleId === c.id && (
                              <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center">
                                <Check className="text-[16px]" />
                              </div>
                            )}
                          </button>
                        ))}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>

            {/* Health Focus (Professional Customization) */}
            <div className="bg-surface-low p-8 rounded-[2.5rem] border border-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full text-primary">
                    <BrainCircuit className="text-[20px]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Enfoque Clínico</p>
                    <p className="text-xs font-bold text-on-surface">Personalice el algoritmo del reporte</p>
                  </div>
                </div>

                {/* Comparative Toggle (New Suggestion) */}
                <button
                  onClick={() => setIsComparative(!isComparative)}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-2xl border transition-all select-none group",
                    isComparative ? "bg-primary text-white border-primary" : "bg-white border-border text-on-surface-variant hover:bg-surface-high"
                  )}
                >
                  {isComparative ? <ArrowLeftRight className="text-[18px]" /> : <ArrowRightLeft className="text-[18px]" />}
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {isComparative ? 'Comparativa Activa' : 'Activar Comparativa'}
                  </span>
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'general', label: 'General', icon: Activity },
                  { id: 'tension-peaks', label: 'Picos Críticos', icon: TrendingUp },
                  { id: 'lifestyle-correlation', label: 'Vida & Dieta', icon: Utensils },
                  { id: 'circadian-rhythm', label: 'Nocturno', icon: Moon },
                ].map(focus => {
                  const IconComp = focus.icon;
                  return (
                  <button
                    key={focus.id}
                    onClick={() => setHealthFocus(focus.id as any)}
                    className={cn(
                      "flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 sm:gap-3 p-4 rounded-2xl text-center sm:text-left border-none transition-all min-h-[100px] sm:min-h-0",
                      healthFocus === focus.id
                        ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]"
                        : "bg-white text-on-surface-variant hover:bg-surface-high shadow-sm border border-border/10"
                    )}
                  >
                    <IconComp className="text-[20px] sm:text-[18px] opacity-80" />
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest leading-tight balance">
                      {focus.label}
                    </span>
                  </button>
                )})}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 p-6 sm:p-10 border-t border-border/50 bg-surface-low z-10 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 py-4 text-xs font-black tracking-widest uppercase text-on-surface-variant hover:bg-surface-high rounded-full transition-colors"
          >
            Cerrar
          </button>
          <Button 
            className="flex-[2] bg-primary text-white rounded-full py-6 px-12 text-xs font-black tracking-widest uppercase transition-all shadow-xl shadow-primary/25 hover:scale-105 active:scale-95"
            onClick={handleApply}
          >
            Aplicar Configuración
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
