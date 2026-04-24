import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";
import { X, LayoutList, Circle, Activity, SlidersHorizontal, CheckCircle2, Calendar, Clock, RefreshCw, Check, Sun, Moon } from "lucide-react";

export interface HistoryFilters {
  quickSelector: string;
  periodId?: number;
  dateFrom?: string;
  dateTo?: string;
  slot: 'all' | 'morning' | 'evening';
  viewMode15Days?: 'A' | 'B' | 'C';
}

interface HistoryFilterModalProps {
  onClose: () => void;
  onApply: (filters: HistoryFilters) => void;
  initialFilters: HistoryFilters;
  availablePeriods: { id: number; label: string }[];
}

export function HistoryFilterModal({ onClose, onApply, initialFilters, availablePeriods }: HistoryFilterModalProps) {
  const [quickSelector, setQuickSelector] = React.useState<string>(initialFilters.quickSelector);
  const [period, setPeriod] = React.useState<string>(initialFilters.periodId ? initialFilters.periodId.toString() : '');
  const [dateFrom, setDateFrom] = React.useState<string>(initialFilters.dateFrom || '');
  const [dateTo, setDateTo] = React.useState<string>(initialFilters.dateTo || '');
  const [slot, setSlot] = React.useState<HistoryFilters['slot']>(initialFilters.slot);
  const [viewMode15Days, setViewMode15Days] = React.useState<'A' | 'B' | 'C'>(initialFilters.viewMode15Days || 'A');

  const quickSelectors = [
    'Hoy', '5 días', '1 semana', '15 días', '1 mes',
    '1 trimestre', '1 semestre', '1 año', 'Todo'
  ];

  const handleApply = () => {
    let normalizedSelector = quickSelector;
    if (quickSelector === 'Hoy') normalizedSelector = '1 día';
    if (quickSelector === 'Todo') normalizedSelector = 'Total';

    onApply({
      quickSelector: normalizedSelector,
      periodId: period ? parseInt(period, 10) : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      slot: slot,
      viewMode15Days: normalizedSelector === '15 días' ? viewMode15Days : undefined
    });
    onClose();
  };

  const handleReset = () => {
    setQuickSelector('1 semana');
    setPeriod('');
    setDateFrom('');
    setDateTo('');
    setSlot('all');
    setViewMode15Days('A');
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
          {/* Abstract background element */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-container/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

          {/* Header Section */}
          <div className="mb-10 relative">
            <h1 className="text-3xl font-display font-black text-on-surface tracking-tight mb-2">
              Filtros Avanzados
            </h1>
            <p className="text-[10px] font-black tracking-[0.2em] text-primary uppercase">
              Explorador de Historial Médico
            </p>
          </div>

          <div className="space-y-10">
            {/* Períodos */}
            <div className="bg-surface-lowest p-6 rounded-[1.5rem]">
              <div className="flex items-center gap-2 mb-4">
                <LayoutList className="text-primary text-[20px]" />
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Navegar por Períodos</span>
              </div>
              <div className="relative">
                <select 
                  value={period}
                  onChange={(e) => {
                    setPeriod(e.target.value);
                    if (e.target.value) setQuickSelector('Total');
                  }}
                  className="w-full appearance-none bg-surface-high text-on-surface text-base font-bold rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer border-none"
                >
                  <option value="">Todos los períodos registrados</option>
                  {availablePeriods.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
                <Circle className="absolute right-6 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
              </div>
            </div>

            {/* Selectores Rápidos */}
            <div className="bg-surface-lowest p-6 rounded-[1.5rem]">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="text-primary text-[20px]" />
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Rangos Temporales</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {quickSelectors.map(selector => (
                  <button
                    key={selector}
                    onClick={() => {
                      setQuickSelector(selector);
                      setPeriod('');
                      setDateFrom('');
                      setDateTo('');
                    }}
                    className={cn(
                      "px-4 py-3 rounded-2xl text-sm font-bold transition-all border-none",
                      (quickSelector === selector || (quickSelector === '1 día' && selector === 'Hoy')) 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "bg-surface-high text-on-surface-variant hover:bg-surface-highest"
                    )}
                  >
                    {selector}
                  </button>
                ))}
              </div>

              {/* Sub-filtro 15 días */}
              <AnimatePresence>
                {quickSelector === '15 días' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="pt-6 border-t border-border"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <SlidersHorizontal className="text-primary text-[18px]" />
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Visualización Especial (15 días)</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { id: 'A', label: 'Modo A: Datos por bloques de período' },
                        { id: 'B', label: 'Modo B: Solo medias por período' },
                        { id: 'C', label: 'Modo C: Vista diaria continua' }
                      ].map(mode => (
                        <button
                          key={mode.id}
                          onClick={() => setViewMode15Days(mode.id as 'A' | 'B' | 'C')}
                          className={cn(
                            "flex items-center justify-between p-4 rounded-xl text-left border-none transition-all",
                            viewMode15Days === mode.id
                              ? "bg-primary/10 text-primary"
                              : "bg-surface-high/50 text-on-surface-variant hover:bg-surface-high"
                          )}
                        >
                          <span className="text-sm font-bold">{mode.label}</span>
                          {viewMode15Days === mode.id && <CheckCircle2 className="text-primary" />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Rango Manual */}
            <div className="bg-surface-lowest p-6 rounded-[1.5rem]">
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="text-primary text-[20px]" />
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Fecha Personalizada</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-on-surface-variant/60 tracking-widest ml-4 uppercase">DESDE</span>
                  <input 
                    type="date" 
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      setQuickSelector('Custom');
                      setPeriod('');
                    }}
                    className="bg-surface-high text-on-surface text-base font-bold rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all border-none"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-on-surface-variant/60 tracking-widest ml-4 uppercase">HASTA</span>
                  <input 
                    type="date" 
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      setQuickSelector('Custom');
                      setPeriod('');
                    }}
                    className="bg-surface-high text-on-surface text-base font-bold rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all border-none"
                  />
                </div>
              </div>
            </div>

            {/* Turno */}
            <div className="bg-surface-lowest p-6 rounded-[1.5rem]">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="text-primary text-[20px]" />
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Turno de captura</span>
              </div>
              <div className="bg-surface-high p-2 rounded-[1.25rem] flex gap-2">
                {[
                  { id: 'all', label: 'AMBAS', icon: Activity },
                  { id: 'morning', label: 'MAÑANA', icon: Sun },
                  { id: 'evening', label: 'NOCHE', icon: Moon }
                ].map(t => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSlot(t.id as any)}
                      className={cn(
                        "flex-1 py-4 text-xs font-black tracking-widest rounded-xl transition-all border-none flex items-center justify-center gap-2",
                        slot === t.id 
                          ? "bg-surface-lowest text-primary shadow-sm" 
                          : "text-on-surface-variant hover:text-on-surface"
                      )}
                    >
                      <Icon size={14} className={cn(slot === t.id ? "text-primary" : "text-on-surface-variant/40")} />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 p-6 sm:p-10 border-t border-border/50 bg-surface-low z-10 shrink-0">
          <button 
            type="button"
            onClick={handleReset}
            className="w-full sm:w-auto px-8 py-4 text-xs font-black tracking-widest uppercase text-on-surface-variant hover:bg-surface-high rounded-full transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="text-sm" />
            Restablecer
          </button>
          <button 
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-4 text-xs font-black tracking-widest uppercase text-on-surface-variant hover:bg-surface-high rounded-full transition-colors order-last sm:order-none flex items-center justify-center gap-2"
          >
            <X className="text-sm" />
            Cancelar
          </button>
          <Button 
            className="w-full sm:flex-1 bg-primary text-white rounded-full py-6 px-12 text-xs font-black tracking-widest uppercase transition-all shadow-xl shadow-primary/25 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            onClick={handleApply}
          >
            <Check className="text-sm" />
            Aplicar Filtros
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
