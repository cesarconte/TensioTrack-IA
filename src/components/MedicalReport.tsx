import * as React from "react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { Share2, FileText, RefreshCw, User, BarChart3, TrendingUp, TrendingDown, Sun, Moon, Activity, Calendar, ChevronLeft, ChevronRight, Info, StickyNote, MessageSquare, Stethoscope } from "lucide-react";
import { DashboardData, Reading, Cycle } from "../types";
import { getBloodPressureStatus, getBloodPressureStyle } from "../domain/health";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { exportToExcel } from "../lib/exportExcel";
import { useAppStore } from "../store/useAppStore";
import { ShareModal } from "./ShareModal";

interface MedicalReportProps {
  dashboard: DashboardData | null;
  allReadings: Reading[] | null;
  userProfile?: any;
}

const CircularProgress = ({ status, className }: { status: ReturnType<typeof getBloodPressureStyle>, className?: string }) => {
  const size = 160;
  const stroke = 10;
  const center = size / 2;
  const radius = center - stroke;
  const circumference = radius * 2 * Math.PI;

  // MD3 Gauge Logic: Progress based on clinical severity
  const getProgress = (label: string) => {
    switch (label) {
      case 'HIPERTENSIÓN': return 1.0;
      case 'NORMAL-ALTA': return 0.75;
      case 'NORMAL': return 0.5;
      case 'HIPOTENSIÓN': return 0.25;
      default: return 0.5;
    }
  };

  const progress = getProgress(status.label);
  const offset = circumference - (progress * circumference);

  return (
    <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg height={size} width={size} className="transform -rotate-90 block overflow-visible">
        <circle
          stroke="rgba(0,0,0,0.05)" // Ultra soft surface-variant for trace
          fill="transparent"
          strokeWidth={stroke}
          r={radius}
          cx={center}
          cy={center}
        />
        <circle
          stroke={status.hex}
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: offset }}
          r={radius}
          cx={center}
          cy={center}
          className="transition-all duration-1000 ease-in-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 overflow-hidden pointer-events-none">
        <span className={cn("text-[14px] font-black uppercase tracking-tight leading-none mb-1 text-wrap", status.color)}>
          {status.label}
        </span>
        <span className="text-[10px] font-medium text-on-surface-variant/60 leading-tight block whitespace-nowrap">
          Estado General
        </span>
      </div>
    </div>
  );
};

const PDFIcon = ({ size = 18, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M7 13h2a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H7v2" />
    <path d="M12 13h1a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-1v-4z" />
    <path d="M17 13h3v4" />
    <path d="M17 15h2" />
  </svg>
);

export function MedicalReport({ dashboard, allReadings, userProfile }: MedicalReportProps) {
  const { user: loggedInUser, activePatientId, activePatientName } = useAppStore();
  const user = userProfile || loggedInUser;
  const isDoctor = loggedInUser?.role === 'doctor';
  const isViewingPatient = isDoctor && !!activePatientId;

  const [isDownloading, setIsDownloading] = React.useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);
  const [cycleIndex, setCycleIndex] = React.useState(0);
  
  const handleDownloadPDF = async () => {
    const input = document.getElementById('medical-report-content');
    if (!input) return;
    
    setIsDownloading(true);
    try {
      const width = input.scrollWidth;
      const height = input.scrollHeight;

      const imgData = await toPng(input, {
        canvasWidth: width * 2,
        canvasHeight: height * 2,
        width: width,
        height: height,
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#FDF7FE',
        skipFonts: true,
        fontEmbedCSS: '',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          width: `${width}px`,
          height: `${height}px`
        },
        filter: (node) => {
          if (node.tagName?.toLowerCase() === 'link' && (node as HTMLLinkElement).rel === 'stylesheet') {
            const href = (node as HTMLLinkElement).href;
            if (href && href.includes('fonts.googleapis.com')) {
              return false;
            }
          }
          return true;
        }
      });
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const margin = 15;
      const maxPdfWidth = pdf.internal.pageSize.getWidth();
      const pdfWidth = maxPdfWidth - (margin * 2);
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', margin, margin, pdfWidth, pdfHeight);
      pdf.save(`informe_medico_tensiotrack_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("Informe descargado con éxito");
    } catch (err) {
      console.error("Error generating PDF:", err);
      toast.error("Hubo un error al generar el PDF");
    } finally {
      setIsDownloading(false);
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
  const previousCycle = allCycles[cycleIndex + 1] || null;

  // Calculate trends
  const trends = React.useMemo(() => {
    if (!activeCycle?.finalAverage || !previousCycle?.finalAverage) return null;
    return {
      systolic: activeCycle.finalAverage.systolic - previousCycle.finalAverage.systolic,
      diastolic: activeCycle.finalAverage.diastolic - previousCycle.finalAverage.diastolic,
      heartRate: activeCycle.finalAverage.heartRate - previousCycle.finalAverage.heartRate,
    };
  }, [activeCycle, previousCycle]);

  // Aggregate clinical findings for the period
  const insights = React.useMemo(() => {
    if (!activeCycle || !allReadings) return null;
    
    // Filter readings for this specific period using date strings (robust)
    const periodReadings = allReadings.filter(r => {
      return r.date >= activeCycle.startDate && r.date <= activeCycle.endDate;
    });

    if (periodReadings.length === 0) return null;

    const totalReadings = periodReadings.length;
    const notes = periodReadings
      .filter(r => r.notes && r.notes.trim() !== "")
      .map(r => ({ note: r.notes!, date: r.recordedAt, slot: r.slot }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Stability: % of optimal/normal readings
    // We recalculate status to be 100% sure of the logic
    const stableCount = periodReadings.filter(r => {
      const status = getBloodPressureStatus(r.systolic, r.diastolic);
      return status === 'normal' || status === 'hypotension'; // hypotension is "low" but usually not "danger" in this context
    }).length;

    const stabilityPercent = Math.round((stableCount / totalReadings) * 100);

    // Diurnal variation
    let morningHigher = false;
    if (activeCycle.averages.morning && activeCycle.averages.evening) {
      morningHigher = activeCycle.averages.morning.systolic > activeCycle.averages.evening.systolic + 5;
    }

    return {
      totalReadings,
      stabilityPercent,
      morningHigher,
      notes
    };
  }, [activeCycle, allReadings]);

  const formatDateShort = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  const periodLabel = activeCycle 
    ? `Período ${allCycles.length - cycleIndex}: ${formatDateShort(activeCycle.startDate)} — ${formatDateShort(activeCycle.endDate)}`
    : 'Cargando período...';

  // Styles based on status
  const globalStatus = activeCycle?.finalAverage 
    ? getBloodPressureStatus(activeCycle.finalAverage.systolic, activeCycle.finalAverage.diastolic)
    : 'normal';
  const globalStyle = getBloodPressureStyle(globalStatus);

  const morningStatus = activeCycle?.averages.morning
    ? getBloodPressureStatus(activeCycle.averages.morning.systolic, activeCycle.averages.morning.diastolic)
    : 'normal';
  const morningStyle = getBloodPressureStyle(morningStatus);

  const eveningStatus = activeCycle?.averages.evening
    ? getBloodPressureStatus(activeCycle.averages.evening.systolic, activeCycle.averages.evening.diastolic)
    : 'normal';
  const eveningStyle = getBloodPressureStyle(eveningStatus);

  return (
    <div id="medical-report-content" className="w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Consultation Mode Banner (Doctor viewing Patient) */}
      <AnimatePresence>
        {isViewingPatient && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden px-4 sm:px-0"
          >
            <div className="bg-primary/5 border border-primary/20 rounded-[2.5rem] p-6 mb-2 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-foreground tracking-tight">Modo Consulta Activo</h4>
                  <p className="text-sm font-medium text-on-surface-variant">Generando informe para <span className="text-primary font-bold">{activePatientName}</span></p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full font-bold px-6 border-primary/20 text-primary hover:bg-primary/5"
                onClick={() => useAppStore.getState().setActivePatientId(null, null)}
              >
                Cerrar Sesión
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. HEADER (Title, Nav & Export) */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 px-4 sm:px-0">
        <div className="space-y-1 shrink-0 min-w-max">
          <h1 className="text-3xl sm:text-4xl font-display font-black text-foreground tracking-tight leading-none whitespace-nowrap shrink-0">Informe Médico</h1>
          <p className="text-[13px] font-medium text-on-surface-variant/70 capitalize leading-relaxed whitespace-nowrap shrink-0">{periodLabel}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 sm:gap-4 mt-2 lg:mt-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 sm:gap-4 flex-grow sm:flex-grow-0">
            <Button 
              variant="primary" 
              size="md"
              isLoading={isDownloading}
              onClick={handleDownloadPDF}
              className="rounded-full px-8 bg-linear-to-br from-[#6750A5] to-[#BBA2FD] text-white transition-all font-black tracking-widest text-[10px] uppercase flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-[1.03] active:scale-[0.98] min-h-[44px] py-3"
            >
              {!isDownloading && <PDFIcon className="mr-2.5" size={18} />}
              {isDownloading ? 'Generando...' : 'Descargar PDF'}
            </Button>

            <Button 
              variant="secondary" 
              size="md"
              onClick={() => setIsShareModalOpen(true)}
              className="rounded-full px-8 bg-[#E9E6F0] text-[#1A1A1A] transition-all font-black tracking-widest text-[10px] uppercase flex items-center justify-center shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-[0.98] border-none min-h-[44px] py-3"
            >
              <Share2 className="mr-2.5" size={18} />
              Compartir con Doctor
            </Button>
          </div>
        
          <div className="flex items-center bg-surface-low/50 rounded-full shadow-inner border border-border/20 px-1 h-11 self-center sm:self-auto">
            <Button 
              variant="ghost" 
              className="rounded-full w-9 h-9 p-0 text-on-surface hover:bg-surface-low transition-all active:scale-90"
              onClick={() => setCycleIndex(Math.min(allCycles.length - 1, cycleIndex + 1))}
              disabled={cycleIndex === allCycles.length - 1}
              size="icon"
              aria-label="Período anterior"
            >
              <ChevronLeft size={20} />
            </Button>
            
            <div className="px-4 flex flex-col items-center justify-center min-w-max shrink-0">
              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-on-surface-variant/40 leading-none mb-1 whitespace-nowrap">Periodo</span>
              <span className="text-[11px] font-black tabular-nums tracking-tighter text-on-surface leading-none whitespace-nowrap shrink-0 flex items-center justify-center">
                {allCycles.length - cycleIndex} <span className="text-on-surface-variant/30 mx-0.5">/</span> {allCycles.length}
              </span>
            </div>

            <Button 
              variant="ghost" 
              className="rounded-full w-9 h-9 p-0 text-on-surface hover:bg-surface-low transition-all active:scale-90"
              onClick={() => setCycleIndex(Math.max(0, cycleIndex - 1))}
              disabled={cycleIndex === 0}
              size="icon"
              aria-label="Período siguiente"
            >
              <ChevronRight size={20} />
            </Button>
          </div>
        </div>
      </header>

      {/* 2. PATIENT PROFILE (Top Full Width) */}
      <Card className="bg-surface-low border-none shadow-none rounded-[3rem] p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
               <User size={24} />
             </div>
             <div className="shrink-0 min-w-max">
                <h2 className="text-lg font-display font-black text-foreground whitespace-nowrap shrink-0">Perfil del Paciente</h2>
                <p className="text-xs font-medium text-on-surface-variant/60 whitespace-nowrap shrink-0">
                  {user?.displayName || 'Paciente'}
                </p>
             </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-6 lg:gap-10">
            <div className="space-y-1">
               <p className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest">Edad</p>
               <p className="text-lg font-black text-foreground">{user?.age || '--'} <span className="text-xs font-medium text-on-surface-variant/60">años</span></p>
            </div>
            <div className="space-y-1">
               <p className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest">Peso / Altura</p>
               <p className="text-lg font-black text-foreground">
                 {user?.weight || '--'} <span className="text-xs font-medium text-on-surface-variant/60">kg</span>
                 {' / '}
                 {user?.height || '--'} <span className="text-xs font-medium text-on-surface-variant/60">cm</span>
               </p>
            </div>
            <div className="space-y-1">
               <p className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-widest">IMC</p>
               <p className="text-lg font-black text-foreground">
                 {user?.weight && user?.height ? (user.weight / Math.pow(user.height / 100, 2)).toFixed(1) : '--'}
               </p>
            </div>
            <div className="flex flex-col gap-1 border-l border-border/30 pl-6 h-full justify-center">
              {user?.isHypertensiveMedicated && <span className="text-xs font-bold text-success flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-success" /> Medicado HTA</span>}
              {user?.hasDiabetes && <span className="text-xs font-bold text-warning flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-warning" /> Diabetes</span>}
              {(!user?.isHypertensiveMedicated && !user?.hasDiabetes) && <span className="text-xs font-medium text-on-surface-variant/40">Sin patologías</span>}
            </div>
          </div>
        </div>
      </Card>

      {/* 3. GRID: Resumen Global (Full Width) */}
      <div className="grid grid-cols-1 gap-6 lg:gap-8 items-stretch">
        
        {/* Resumen Global (Full width) */}
        <Card className="@container bg-surface-low border-none shadow-none rounded-[3rem] p-8 lg:p-10 flex flex-col justify-center overflow-hidden">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <BarChart3 size={20} />
            </div>
            <h3 className="text-xl font-display font-black text-foreground whitespace-nowrap">Resumen Global</h3>
          </div>

          <div className="flex flex-col @4xl:flex-row items-start @4xl:items-center justify-between gap-10 @4xl:gap-6 @6xl:gap-10">
            <div className="flex flex-col sm:flex-row items-start lg:items-center gap-12 sm:gap-16 @4xl:gap-8 @6xl:gap-16 w-full @4xl:w-auto relative min-w-0">
              <div className="flex flex-col gap-6 sm:gap-10 min-w-0 sm:min-w-[140px] w-full sm:w-auto">
                <p className="text-[11px] font-bold text-on-surface-variant/60 uppercase tracking-widest leading-none shrink-0">
                  Promedio Tensión<br className="hidden sm:block" /> Arterial
                </p>
                <div className="flex items-baseline gap-2 relative">
                  <span className="text-5xl sm:text-6xl lg:text-7xl @4xl:text-5xl @6xl:text-6xl font-black font-display tracking-tighter text-foreground whitespace-nowrap shrink-0">
                    {activeCycle?.finalAverage ? `${activeCycle.finalAverage.systolic}/${activeCycle.finalAverage.diastolic}` : '--/--'}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-on-surface-variant/40 tracking-widest uppercase mb-2 shrink-0">mmHg</span>
                  
                  {trends && (
                    <div className={cn(
                      "absolute -top-6 -right-2 sm:left-0 sm:-top-8 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-black shadow-sm border bg-background",
                      trends.systolic > 0 
                        ? "text-destructive border-destructive/20" 
                        : "text-success border-success/20"
                    )}>
                      {trends.systolic > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {Math.abs(trends.systolic).toFixed(1)}
                    </div>
                  )}
                </div>
              </div>

              <div className="hidden sm:block w-[1px] h-24 bg-border/40 relative top-4 shrink-0"></div>

              <div className="flex flex-col gap-6 sm:gap-10 min-w-0 sm:min-w-[140px] w-full sm:w-auto">
                <p className="text-[11px] font-bold text-on-surface-variant/60 uppercase tracking-widest leading-none shrink-0">
                  Promedio<br className="hidden sm:block" /> Frecuencia Cardíaca
                </p>
                <div className="flex items-baseline gap-2 relative">
                  <span className="text-5xl sm:text-6xl lg:text-7xl @4xl:text-5xl @6xl:text-6xl font-black font-display tracking-tighter text-foreground whitespace-nowrap shrink-0">
                    {activeCycle?.finalAverage?.heartRate || '--'}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-on-surface-variant/40 tracking-widest uppercase mb-2 shrink-0">PPM</span>
                  
                  {trends && (
                    <div className={cn(
                      "absolute -top-6 -right-2 sm:left-0 sm:-top-8 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-black shadow-sm border bg-background",
                      trends.heartRate > 0 
                        ? "text-warning border-warning/20" 
                        : "text-success border-success/20"
                    )}>
                      {trends.heartRate > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {Math.abs(trends.heartRate)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="shrink-0 bg-primary/5 rounded-[2.5rem] w-full @4xl:w-auto @4xl:flex-1 @4xl:max-w-[320px] min-h-[180px] h-auto @4xl:h-[240px] flex items-center justify-center border border-primary/10 py-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-b from-transparent to-primary/5 rounded-[2.5rem]" />
               <CircularProgress status={globalStyle} />
            </div>
          </div>
        </Card>

        {/* 4. GRID: Promedios Mañana & Noche (Two Columns on Desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* Promedio Mañana */}
          <Card className="bg-surface-low border-none shadow-none rounded-[3rem] p-6 flex flex-col justify-between min-h-[160px]">
             <div className="flex items-start justify-between mb-4">
                 <div className="flex items-center gap-2 shrink-0">
                  <Sun size={20} className="text-warning shrink-0" />
                  <span className="text-sm font-bold text-foreground whitespace-nowrap shrink-0">Promedio Mañana</span>
                </div>
                <div className={cn("px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest", morningStyle.bg, morningStyle.color)}>
                  {morningStyle.label}
                </div>
             </div>
             <div className="flex items-end justify-between">
               <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black font-display tracking-tighter text-foreground whitespace-nowrap shrink-0">
                      {activeCycle?.averages.morning ? `${activeCycle.averages.morning.systolic}/${activeCycle.averages.morning.diastolic}` : '--/--'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-on-surface-variant/40 tracking-widest uppercase">mmHg</span>
               </div>
               <div className="text-right">
                  <span className="text-2xl font-black font-display text-foreground">{activeCycle?.averages.morning?.heartRate || '--'}</span>
                  <div className="text-[9px] font-bold text-on-surface-variant/40 uppercase tracking-widest leading-none mt-1">PPM</div>
               </div>
             </div>
          </Card>

           {/* Promedio Noche */}
           <Card className="bg-surface-low border-none shadow-none rounded-[3rem] p-6 flex flex-col justify-between min-h-[160px]">
             <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2 shrink-0">
                  <Moon size={20} className="text-primary shrink-0" />
                  <span className="text-sm font-bold text-foreground whitespace-nowrap shrink-0">Promedio Noche</span>
                </div>
                <div className={cn("px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest", eveningStyle.bg, eveningStyle.color)}>
                  {eveningStyle.label}
                </div>
             </div>
             <div className="flex items-end justify-between">
               <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black font-display tracking-tighter text-foreground whitespace-nowrap shrink-0">
                      {activeCycle?.averages.evening ? `${activeCycle.averages.evening.systolic}/${activeCycle.averages.evening.diastolic}` : '--/--'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-on-surface-variant/40 tracking-widest uppercase">mmHg</span>
               </div>
               <div className="text-right">
                  <span className="text-2xl font-black font-display text-foreground">{activeCycle?.averages.evening?.heartRate || '--'}</span>
                  <div className="text-[9px] font-bold text-on-surface-variant/40 uppercase tracking-widest leading-none mt-1">PPM</div>
               </div>
             </div>
          </Card>
        </div>
      </div>

      {/* 5. HALLAZGOS CLÍNICOS (Información Médica de Valor) */}
      {insights && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <Card className="bg-surface-low border-none shadow-none rounded-[3rem] p-8 lg:p-10 flex flex-col space-y-6">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Activity size={20} />
                  </div>
                  <h3 className="text-lg font-display font-black text-foreground">Estabilidad</h3>
                </div>
                {/* Structure matching the observations card to ensure symmetry */}
                <div className="opacity-0 pointer-events-none select-none">
                  <Badge variant="secondary" className="bg-primary/5 text-primary border-none text-[10px] font-black px-3 py-1">
                    0 NOTAS
                  </Badge>
                </div>
             </div>
             
             <div className="flex-1 flex flex-col justify-center items-center py-4">
                <div className="text-6xl font-black font-display text-primary tracking-tighter">
                  {insights.stabilityPercent}%
                </div>
                <div className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest mt-2">Lecturas en Rango Óptimo</div>
             </div>

             <div className="pt-4 border-t border-border/10 space-y-3">
               <div className="flex justify-between items-center text-xs">
                 <span className="font-medium text-on-surface-variant">Total de lecturas</span>
                 <span className="font-black text-foreground">{insights.totalReadings}</span>
               </div>
               {insights.morningHigher && (
                 <div className="p-3 rounded-2xl bg-warning/5 border border-warning/10">
                   <p className="text-[11px] font-bold text-warning-variant flex items-center gap-2">
                     <Info size={16} />
                     Posible HTA matutina detectada
                   </p>
                 </div>
               )}
             </div>
          </Card>

          <Card className="bg-surface-low border-none shadow-none rounded-[3rem] p-8 lg:p-10 flex flex-col space-y-6">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <div className="relative">
                      <FileText size={20} />
                      <MessageSquare size={10} className="absolute -bottom-0.5 -right-0.5" />
                    </div>
                  </div>
                  <h3 className="text-lg font-display font-black text-foreground">Observaciones del Período</h3>
                </div>
                {insights.notes.length > 0 && (
                  <Badge variant="secondary" className="bg-primary/5 text-primary border-none text-[10px] font-black px-3 py-1">
                    {insights.notes.length} NOTAS
                  </Badge>
                )}
             </div>

             <div className="flex-1 min-h-[140px] max-h-[220px] overflow-y-auto pr-2 scrollbar-hide">
                {insights.notes.length > 0 ? (
                  <div className="space-y-4">
                    {insights.notes.map((n, i) => (
                      <div key={i} className="flex gap-4 p-4 rounded-2xl bg-surface-low/30 border border-border/10">
                        <div className="flex-shrink-0 mt-1">
                          {n.slot === 'morning' ? <Sun size={18} className="text-on-surface-variant/40" /> : <Moon size={18} className="text-on-surface-variant/40" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground/80 leading-relaxed italic">"{n.note}"</p>
                          <p className="text-[10px] text-on-surface-variant/50 mt-2 flex items-center gap-1.5 uppercase font-black tracking-widest">
                            {formatDateShort(n.date)} • {n.slot === 'morning' ? 'Mañana' : 'Noche'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-30 py-8">
                    <StickyNote size={48} />
                    <p className="text-xs font-bold uppercase tracking-widest">Sin notas registradas</p>
                  </div>
                )}
             </div>
          </Card>
        </div>
      )}

      {/* 6. TABLE: Desglose Diario */}
      <Card className="bg-surface-low border-none shadow-none rounded-[3rem] overflow-hidden p-2 sm:p-4">
        <div className="p-6 md:p-8 flex items-center justify-between">
          <h3 className="text-xl font-display font-black text-foreground">Desglose Diario</h3>
          <div className="flex items-center gap-2 text-on-surface-variant/60">
             <Calendar size={16} />
             <span className="text-xs font-medium">Últimos {activeCycle?.days.length || 0} días analizados</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[700px]">
             <thead>
               <tr className="border-y border-border/40 bg-surface-low/30">
                 <th className="px-8 py-4 font-bold text-on-surface-variant/50 uppercase tracking-wider text-[10px]">Fecha</th>
                 <th className="px-8 py-4 font-bold text-on-surface-variant/50 uppercase tracking-wider text-[10px]">Mañana (mmHg)</th>
                 <th className="px-8 py-4 font-bold text-on-surface-variant/50 uppercase tracking-wider text-[10px]">Noche (mmHg)</th>
                 <th className="px-8 py-4 font-bold text-on-surface-variant/50 uppercase tracking-wider text-[10px]">Pulso (PPM)</th>
                 <th className="px-8 py-4 font-bold text-on-surface-variant/50 uppercase tracking-wider text-[10px] text-right">Estado</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-border/20">
               {activeCycle?.days.map((day, idx) => {
                 // Format Date
                 const d = new Date(day.date);
                 const formattedDate = d.toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' });
                 
                 // Calc Daily Average to determine Status Badge
                 let totalSys = 0, totalDia = 0, count = 0, avgHr = 0, countHr = 0;
                 if (day.morningAvg) { totalSys += day.morningAvg.systolic; totalDia += day.morningAvg.diastolic; count++; if (day.morningAvg.heartRate) { avgHr += day.morningAvg.heartRate; countHr++; } }
                 if (day.eveningAvg) { totalSys += day.eveningAvg.systolic; totalDia += day.eveningAvg.diastolic; count++; if (day.eveningAvg.heartRate) { avgHr += day.eveningAvg.heartRate; countHr++; } }
                 
                 let dayStatusLabel: ReturnType<typeof getBloodPressureStyle> | null = null;
                 if (count > 0) {
                   const avgDaySys = Math.round(totalSys / count);
                   const avgDayDia = Math.round(totalDia / count);
                   dayStatusLabel = getBloodPressureStyle(getBloodPressureStatus(avgDaySys, avgDayDia));
                 }
                 
                 const finalHr = countHr > 0 ? Math.round(avgHr / countHr) : '--';

                 return (
                   <tr key={idx} className="hover:bg-primary/5 transition-colors">
                     <td className="px-8 py-5">
                       <span className="font-bold text-foreground capitalize">{formattedDate}</span>
                     </td>
                     <td className="px-8 py-5">
                       {day.morningAvg ? (
                         <span className="font-medium text-foreground">{day.morningAvg.systolic} / {day.morningAvg.diastolic}</span>
                       ) : <span className="text-on-surface-variant/30">-- / --</span>}
                     </td>
                     <td className="px-8 py-5">
                       {day.eveningAvg ? (
                         <span className="font-medium text-foreground">{day.eveningAvg.systolic} / {day.eveningAvg.diastolic}</span>
                       ) : <span className="text-on-surface-variant/30">-- / --</span>}
                     </td>
                     <td className="px-8 py-5 font-medium text-foreground">
                        {finalHr}
                     </td>
                     <td className="px-8 py-5 text-right">
                       {dayStatusLabel ? (
                         <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full", dayStatusLabel.bg, dayStatusLabel.color)}>
                            <div className="w-1.5 h-1.5 rounded-full bg-current" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{dayStatusLabel.label}</span>
                         </div>
                       ) : (
                         <span className="text-on-surface-variant/30 text-xs">Sin datos</span>
                       )}
                     </td>
                   </tr>
                 );
               })}
             </tbody>
          </table>
        </div>
      </Card>

      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        url={window.location.origin} 
      />
    </div>
  );
}
