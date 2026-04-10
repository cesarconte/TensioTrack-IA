import * as React from "react";
import { useReadings, useDeleteReading } from "../../lib/api";
import { useAppStore } from "../../store/useAppStore";
import { 
  History as HistoryIcon, 
  Search, 
  Filter, 
  Calendar as CalendarIcon,
  X,
  Heart,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Settings,
  MessageSquare,
  Trash2,
  Clock
} from "lucide-react";
import { Card, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/Tooltip";
import { Badge } from "../ui/Badge";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Reading } from "../../types";

export function History() {
  const [historyFilter, setHistoryFilter] = React.useState<'all' | 'morning' | 'evening'>('all');
  const [dateFilter, setDateFilter] = React.useState<string>('');
  const { data: readings, isLoading } = useReadings({ slot: historyFilter, date: dateFilter });
  const { isDarkMode, setReadingFormOpen, setEditingReading } = useAppStore();
  const [expandedReadingId, setExpandedReadingId] = React.useState<string | null>(null);
  const deleteReading = useDeleteReading();

  const [currentPage, setCurrentPage] = React.useState(1);

  const groupedByDate = React.useMemo(() => {
    if (!readings) return [];
    
    const groups: Record<string, Reading[]> = {};
    readings.forEach(r => {
      if (!groups[r.date]) groups[r.date] = [];
      groups[r.date].push(r);
    });
    
    return Object.entries(groups)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, dayReadings]) => ({
        date,
        morning: dayReadings.filter(r => r.slot === 'morning').sort((a, b) => a.order - b.order),
        evening: dayReadings.filter(r => r.slot === 'evening').sort((a, b) => a.order - b.order),
      }));
  }, [readings]);

  const totalPages = groupedByDate.length;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [historyFilter, dateFilter, totalPages]);

  const currentDayData = groupedByDate[currentPage - 1];

  const getReadingStatus = (sys: number, dia: number) => {
    if (sys >= 135 || dia >= 85) return { label: 'Hipertensión', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', variant: 'danger' as const };
    if (sys >= 130 || dia >= 80) return { label: 'Normal-Alta', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', variant: 'warning' as const };
    if (sys < 100 || dia < 60) return { label: 'Baja', color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100', variant: 'info' as const };
    return { label: 'Normal', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', variant: 'success' as const };
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReading.mutateAsync(id);
      toast.success("Lectura eliminada");
    } catch (error) {
      toast.error("Error al eliminar la lectura");
    }
  };

  const renderReading = (reading: Reading) => {
    const isExpanded = expandedReadingId === reading.id;
    const status = getReadingStatus(reading.systolic, reading.diastolic);
    const dateObj = new Date(reading.recordedAt);
    
    return (
      <motion.div 
        key={reading.id}
        layout
        className={cn(
          "bg-white dark:bg-slate-900 rounded-[2rem] border transition-all duration-300 overflow-hidden",
          isExpanded ? "border-indigo-200 dark:border-indigo-800 shadow-xl" : "border-slate-100 dark:border-slate-800 hover:border-indigo-100 dark:hover:border-indigo-900"
        )}
      >
        <div 
          onClick={() => setExpandedReadingId(isExpanded ? null : reading.id)}
          className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer group gap-4"
        >
          <div className="flex items-center gap-5">
            <div className={cn(
              "w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-mono transition-all duration-500",
              isExpanded ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none" : "bg-slate-50 dark:bg-slate-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30"
            )}>
              <span className={cn(
                "text-xl font-black leading-none",
                isExpanded ? "text-white" : "text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
              )}>{reading.systolic}</span>
              <span className={cn(
                "text-[10px] font-black uppercase mt-1",
                isExpanded ? "text-indigo-200" : "text-slate-400 dark:text-slate-500"
              )}>{reading.diastolic}</span>
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <Badge variant="secondary" className="text-[9px] px-2 py-0.5">
                  {reading.slot === 'morning' ? 'Mañana' : 'Noche'}
                </Badge>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Toma {reading.order}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span className="text-sm font-black text-slate-900 dark:text-white">{reading.heartRate || '--'} <span className="text-[10px] font-bold text-slate-400">lpm</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-50 dark:border-slate-800">
            <div className="flex flex-col items-end">
              <Badge variant={status.variant} className="px-3 py-1">
                {status.label}
              </Badge>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">
                {dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </span>
            </div>
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
              isExpanded ? "bg-indigo-50 text-indigo-600" : "text-slate-300 group-hover:text-indigo-400"
            )}>
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </div>
        </div>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 pb-6 pt-2 border-t border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/10"
            >
              <div className="space-y-6">
                {reading.notes && (
                  <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-2 mb-3 text-indigo-600 dark:text-indigo-400">
                      <MessageSquare className="w-4 h-4" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Notas del paciente</p>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic">
                      "{reading.notes}"
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button 
                    variant="secondary" 
                    className="flex-1 h-12"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingReading(reading);
                      setReadingFormOpen(true);
                    }}
                  >
                    <Settings className="w-4 h-4" />
                    Editar
                  </Button>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="w-12 h-12 p-0 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(reading.id);
                        }}
                        aria-label="Eliminar lectura"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Eliminar lectura</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="space-y-8 pb-24 sm:pb-0">
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
            <HistoryIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-black text-slate-900 dark:text-white">Historial</h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Todas tus mediciones registradas</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            {(['all', 'morning', 'evening'] as const).map((filter) => (
              <button 
                key={filter}
                onClick={() => setHistoryFilter(filter)}
                className={cn(
                  "flex-1 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  historyFilter === filter ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                {filter === 'all' ? 'Todos' : filter === 'morning' ? 'Mañana' : 'Noche'}
              </button>
            ))}
          </div>

          <div className="relative">
            <input 
              type="date" 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full h-11 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl px-4 text-xs font-bold text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            {dateFilter && (
              <button 
                onClick={() => setDateFilter('')}
                className="absolute -top-2 -right-2 w-6 h-6 bg-slate-900 dark:bg-slate-700 text-white rounded-full flex items-center justify-center hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors shadow-lg"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-white dark:bg-slate-900 rounded-[2rem] animate-pulse border border-slate-100 dark:border-slate-800" />
            ))}
          </div>
        ) : totalPages === 0 ? (
          <Card className="py-24 text-center border-dashed border-2 bg-transparent">
            <CardContent>
              <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <HistoryIcon className="w-12 h-12 text-slate-200 dark:text-slate-700" />
              </div>
              <h3 className="text-xl font-display font-black text-slate-900 dark:text-white">Sin registros</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto mt-2">No se encontraron mediciones para los filtros seleccionados.</p>
              <Button variant="secondary" className="mt-8" onClick={() => {setHistoryFilter('all'); setDateFilter('');}}>
                Limpiar Filtros
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Pagination Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                    {new Date(currentDayData.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {currentDayData.morning.length + currentDayData.evening.length} tomas registradas
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Página {currentPage} de {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="w-10 h-10 rounded-xl"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        aria-label="Página anterior"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Página anterior</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="w-10 h-10 rounded-xl"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        aria-label="Página siguiente"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Página siguiente</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>

            {/* Morning Section */}
            {currentDayData.morning.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <Sun className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-widest text-sm">Sesión de Mañana</h4>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {currentDayData.morning.map(renderReading)}
                </div>
              </div>
            )}

            {/* Evening Section */}
            {currentDayData.evening.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Moon className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-widest text-sm">Sesión de Noche</h4>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {currentDayData.evening.map(renderReading)}
                </div>
              </div>
            )}

            {/* Bottom Pagination Controls (for long lists) */}
            {(currentDayData.morning.length + currentDayData.evening.length) > 3 && (
              <div className="flex items-center justify-center gap-4 pt-4 pb-8">
                <Button 
                  variant="outline" 
                  className="rounded-xl"
                  onClick={() => {
                    setCurrentPage(p => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Anterior
                </Button>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  {currentPage} / {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  className="rounded-xl"
                  onClick={() => {
                    setCurrentPage(p => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
