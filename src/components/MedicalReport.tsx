import * as React from "react";
import { FileText, X, Sun, Moon, Calendar, Leaf, Download, Share, Activity, TrendingUp, ChevronLeft, ChevronRight, User, Scale, Ruler } from "lucide-react";
import { DashboardData, Reading, Cycle } from "../types";
import { calculateCorrelations } from "../domain/correlations";
import { cn } from "../lib/utils";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/Tooltip";
import { ShareModal } from "./ShareModal";
import { exportToExcel } from "../lib/exportExcel";
import { useAppStore } from "../store/useAppStore";

interface MedicalReportProps {
  dashboard: DashboardData | null;
  allReadings: Reading[] | null;
  onClose: () => void;
}

export function MedicalReport({ dashboard, allReadings, onClose }: MedicalReportProps) {
  const { user } = useAppStore();
  const [isShareOpen, setIsShareOpen] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [cycleIndex, setCycleIndex] = React.useState(0);
  
  const handleExport = async () => {
    if (!allReadings) return;
    setIsExporting(true);
    try {
      await exportToExcel(allReadings, dashboard, user);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
    } finally {
      setIsExporting(false);
    }
  };
  
  const allCycles = React.useMemo(() => {
    if (!dashboard) return [];
    const current: Cycle = {
      startDate: dashboard.stats.periodDays[dashboard.stats.periodDays.length - 1]?.date || '',
      endDate: dashboard.stats.periodDays[0]?.date || '',
      averages: dashboard.stats.periodAverages,
      finalAverage: dashboard.stats.finalAverage,
      days: dashboard.stats.periodDays
    };
    const cycles = [];
    if (current.days.length > 0) cycles.push(current);
    if (dashboard.stats.historicalCycles?.length > 0) {
      cycles.push(...dashboard.stats.historicalCycles);
    }
    return cycles;
  }, [dashboard]);

  const activeCycle = allCycles[cycleIndex] || null;

  const correlations = activeCycle && allReadings ? calculateCorrelations(allReadings, {
    systolic: activeCycle.finalAverage?.systolic || 0,
    diastolic: activeCycle.finalAverage?.diastolic || 0
  }) : [];

  const shareUrl = window.location.origin;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-slate-100 dark:border-slate-800">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-display font-black text-slate-900 dark:text-white truncate">Informe Médico</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">Protocolo AMPA • Resumen Ejecutivo</p>
            </div>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors shrink-0"
                aria-label="Cerrar informe"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Cerrar informe</TooltipContent>
          </Tooltip>
        </div>

        {allCycles.length > 1 && (
          <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 flex justify-center">
            <div className="flex items-center justify-center gap-3 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm w-full sm:w-auto">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-8 h-8 rounded-xl shrink-0"
                    onClick={() => setCycleIndex(Math.min(allCycles.length - 1, cycleIndex + 1))}
                    disabled={cycleIndex === allCycles.length - 1}
                    aria-label="Ciclo anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Ciclo anterior</TooltipContent>
              </Tooltip>
              <div className="flex flex-col items-center px-2 min-w-[120px]">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Ciclo {allCycles.length - cycleIndex} de {allCycles.length}
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {activeCycle?.startDate ? new Date(activeCycle.startDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : ''} - {activeCycle?.endDate ? new Date(activeCycle.endDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : ''}
                </span>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-8 h-8 rounded-xl shrink-0"
                    onClick={() => setCycleIndex(Math.max(0, cycleIndex - 1))}
                    disabled={cycleIndex === 0}
                    aria-label="Ciclo siguiente"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Ciclo siguiente</TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
          {/* Patient Profile Summary */}
          {user && (user.age || user.weight || user.height) && (
            <section className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Perfil del Paciente</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <User className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">Edad</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.age || '--'} años</p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <Scale className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">Peso</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.weight || '--'} kg</p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <Ruler className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">Altura</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.height || '--'} cm</p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <Activity className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">IMC</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {user.weight && user.height 
                        ? (user.weight / Math.pow(user.height / 100, 2)).toFixed(1)
                        : '--'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {user.isSmoker && <Badge variant="secondary" className="bg-rose-50 text-rose-600 border-rose-100">Fumador</Badge>}
                {user.hasDiabetes && <Badge variant="secondary" className="bg-amber-50 text-amber-600 border-amber-100">Diabetes</Badge>}
                {user.isHypertensiveMedicated && <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-emerald-100">Medicado HTA</Badge>}
                {user.activityLevel && (
                  <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 border-indigo-100 capitalize">
                    Actividad: {user.activityLevel === 'sedentary' ? 'Sedentaria' : user.activityLevel === 'moderate' ? 'Moderada' : 'Activa'}
                  </Badge>
                )}
              </div>
            </section>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-8 bg-slate-50 dark:bg-slate-800/50 border-none">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-5 h-5 text-slate-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Días Completados</span>
              </div>
              <p className="text-5xl font-display font-black text-slate-900 dark:text-white">{activeCycle?.days.length || 0}</p>
              <p className="text-xs text-slate-500 mt-2">De los 5 días del protocolo AMPA</p>
            </Card>

            <Card className="p-6 sm:p-8 bg-indigo-600 border-none text-white shadow-xl shadow-indigo-100 dark:shadow-none">
              <div className="flex items-center gap-3 mb-4">
                <Activity className="w-5 h-5 text-indigo-200 shrink-0" />
                <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest truncate">Media Global (AMPA)</span>
              </div>
              <p className="text-4xl sm:text-5xl font-display font-black flex items-baseline flex-wrap gap-x-2">
                <span>
                  {activeCycle?.finalAverage 
                    ? `${activeCycle.finalAverage.systolic}/${activeCycle.finalAverage.diastolic}`
                    : '--/--'}
                </span>
                <span className="text-lg sm:text-xl font-medium text-indigo-200">mmHg</span>
              </p>
              <p className="text-xs text-indigo-100 mt-2">Promedio final del ciclo seleccionado</p>
            </Card>
          </div>

          {/* Period Averages */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-display font-black text-slate-900 dark:text-white uppercase tracking-wider">Promedios por Periodo</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sistólica (PAS)</span>
                  <Badge variant="secondary">mmHg</Badge>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <div className="flex items-center gap-2 text-amber-500 mb-1">
                      <Sun className="w-3 h-3" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Mañana</span>
                    </div>
                    <p className="text-3xl font-display font-black text-slate-900 dark:text-white">
                      {activeCycle?.averages.morning?.systolic || '--'}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-indigo-500 mb-1">
                      <Moon className="w-3 h-3" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Noche</span>
                    </div>
                    <p className="text-3xl font-display font-black text-slate-900 dark:text-white">
                      {activeCycle?.averages.evening?.systolic || '--'}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Diastólica (PAD)</span>
                  <Badge variant="secondary">mmHg</Badge>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <div className="flex items-center gap-2 text-amber-500 mb-1">
                      <Sun className="w-3 h-3" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Mañana</span>
                    </div>
                    <p className="text-3xl font-display font-black text-slate-900 dark:text-white">
                      {activeCycle?.averages.morning?.diastolic || '--'}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-indigo-500 mb-1">
                      <Moon className="w-3 h-3" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Noche</span>
                    </div>
                    <p className="text-3xl font-display font-black text-slate-900 dark:text-white">
                      {activeCycle?.averages.evening?.diastolic || '--'}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Daily Breakdown */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-display font-black text-slate-900 dark:text-white uppercase tracking-wider">Desglose Diario</h3>
            </div>
            <div className="border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                    <th className="px-8 py-5 font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px]">Día</th>
                    <th className="px-8 py-5 font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px]">Mañana (PAS/PAD)</th>
                    <th className="px-8 py-5 font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-[10px]">Noche (PAS/PAD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {activeCycle?.days.map((day, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-xs font-black text-indigo-600 dark:text-indigo-400">
                            {idx + 1}
                          </div>
                          <span className="font-bold text-slate-700 dark:text-slate-300 capitalize">
                            {new Date(day.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        {day.morningAvg ? (
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-display font-black text-slate-900 dark:text-white">{day.morningAvg.systolic}</span>
                            <span className="text-slate-300 dark:text-slate-600 font-light">/</span>
                            <span className="text-lg font-display font-black text-slate-600 dark:text-slate-400">{day.morningAvg.diastolic}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-700 font-mono">-- / --</span>
                        )}
                      </td>
                      <td className="px-8 py-5">
                        {day.eveningAvg ? (
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-display font-black text-slate-900 dark:text-white">{day.eveningAvg.systolic}</span>
                            <span className="text-slate-300 dark:text-slate-600 font-light">/</span>
                            <span className="text-lg font-display font-black text-slate-600 dark:text-slate-400">{day.eveningAvg.diastolic}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-700 font-mono">-- / --</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex gap-4">
          <Button 
            variant="secondary" 
            className="flex-1 h-14" 
            onClick={handleExport}
            disabled={isExporting || !allReadings || allReadings.length === 0}
          >
            <Download className={cn("w-5 h-5", isExporting && "animate-bounce")} />
            {isExporting ? 'Generando Excel...' : 'Descargar Excel'}
          </Button>
          <Button variant="primary" className="flex-1 h-14" onClick={() => setIsShareOpen(true)}>
            <Share className="w-5 h-5" />
            Compartir con Médico
          </Button>
        </div>
      </div>

      <ShareModal 
        isOpen={isShareOpen} 
        onClose={() => setIsShareOpen(false)} 
        url={shareUrl} 
      />
    </div>
  );
}
