import * as React from "react";
import { useReadings, useDeleteReading, useAvailablePeriods } from "../../lib/api";
import { useAppStore } from "../../store/useAppStore";
import { Card, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/Tooltip";
import { Badge } from "../ui/Badge";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Reading } from "../../types";
import { HistoryFilterModal, HistoryFilters } from "./HistoryFilterModal";
import { getBloodPressureStatus, getBloodPressureStyle } from "../../domain/health";
import { StickyNote, Edit3, Trash2, X, ChevronRight, Filter, Plus, SlidersHorizontal, Calendar, Activity, History as HistoryIcon, ChevronLeft, Sun, Moon, PieChart, Stethoscope, Heart, FileText } from "lucide-react";

export function History() {
  const [activeFilters, setActiveFilters] = React.useState<HistoryFilters>({
    quickSelector: '1 semana',
    slot: 'all'
  });
  const [isFilterModalOpen, setIsFilterModalOpen] = React.useState(false);
  const { data: availablePeriods = [] } = useAvailablePeriods();
  
  // Convert quickSelector to dateFrom/dateTo if needed
  const queryFilters = React.useMemo(() => {
    let dateFrom = activeFilters.dateFrom;
    let dateTo = activeFilters.dateTo;
    let limit: number | undefined = undefined;

    if (activeFilters.periodId) {
      dateFrom = undefined;
      dateTo = undefined;
    } else if (activeFilters.dateFrom || activeFilters.dateTo) {
      // Manual range takes precedence over quick selector if set
      dateFrom = activeFilters.dateFrom;
      dateTo = activeFilters.dateTo;
    } else if (activeFilters.quickSelector === '1 día') {
      // Today
      const today = new Date();
      dateFrom = today.toISOString().split('T')[0];
      dateTo = dateFrom;
    } else if (activeFilters.quickSelector === '5 días') {
      // We will handle this by getting the last 5 unique days or the selected period
      // If no period is selected, we just get the last 5 days
      const today = new Date();
      const past = new Date();
      past.setDate(today.getDate() - 4);
      dateFrom = past.toISOString().split('T')[0];
      dateTo = today.toISOString().split('T')[0];
    } else if (activeFilters.quickSelector === '1 semana') {
      const today = new Date();
      const past = new Date();
      past.setDate(today.getDate() - 6);
      dateFrom = past.toISOString().split('T')[0];
      dateTo = today.toISOString().split('T')[0];
    } else if (activeFilters.quickSelector === '15 días') {
      const today = new Date();
      const past = new Date();
      past.setDate(today.getDate() - 14);
      dateFrom = past.toISOString().split('T')[0];
      dateTo = today.toISOString().split('T')[0];
    } else if (activeFilters.quickSelector === '1 mes') {
      const today = new Date();
      const past = new Date();
      past.setDate(today.getDate() - 30);
      dateFrom = past.toISOString().split('T')[0];
      dateTo = today.toISOString().split('T')[0];
    } else if (activeFilters.quickSelector === '1 trimestre') {
      const today = new Date();
      const past = new Date();
      past.setDate(today.getDate() - 90);
      dateFrom = past.toISOString().split('T')[0];
      dateTo = today.toISOString().split('T')[0];
    } else if (activeFilters.quickSelector === '1 semestre') {
      const today = new Date();
      const past = new Date();
      past.setDate(today.getDate() - 180);
      dateFrom = past.toISOString().split('T')[0];
      dateTo = today.toISOString().split('T')[0];
    } else if (activeFilters.quickSelector === '1 año') {
      const today = new Date();
      const past = new Date();
      past.setDate(today.getDate() - 365);
      dateFrom = past.toISOString().split('T')[0];
      dateTo = today.toISOString().split('T')[0];
    } else if (activeFilters.quickSelector === 'Total') {
      dateFrom = undefined;
      dateTo = undefined;
    }

    return {
      slot: activeFilters.slot,
      periodId: activeFilters.periodId,
      dateFrom,
      dateTo,
      limit
    };
  }, [activeFilters]);

  const { data: readings, isLoading } = useReadings(queryFilters);
  const { isDarkMode, setReadingFormOpen, setEditingReading, setActiveTab, user, activePatientId, activePatientName } = useAppStore();
  
  const isDoctor = user?.role === 'doctor';
  const isViewingPatient = isDoctor && !!activePatientId;
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

  const itemsPerPage = activeFilters.quickSelector === '1 día' ? 1 : 10;
  const totalPages = Math.ceil(groupedByDate.length / itemsPerPage);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeFilters, totalPages]);

  const currentDaysData = groupedByDate.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getReadingStatus = (sys: number, dia: number) => {
    const status = getBloodPressureStatus(sys, dia);
    return getBloodPressureStyle(status);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReading.mutateAsync(id);
      toast.success("Lectura eliminada");
    } catch (error) {
      toast.error("Error al eliminar la lectura");
    }
  };

  // Calculate dynamic data for bottom cards based on the active filters
  const analyzedData = React.useMemo(() => {
    if (!readings) return { readings: [], label: 'los últimos 7 días', noun: 'semanal', expectedToComplete: 42 };
    
    // Si hay un periodo seleccionado, usamos todos los datos de ese periodo para el análisis
    const filteredReadings = activeFilters.periodId 
      ? readings.filter(r => Number(r.periodId) === Number(activeFilters.periodId))
      : readings;

    let label = 'los últimos 7 días';
    let noun = 'semanal';
    let daysCount = 7;

    // Determine period details based on quickSelector or custom range
    if (activeFilters.periodId) {
      label = `el Período ${activeFilters.periodId}`;
      noun = 'del periodo';
      daysCount = 15; // Assuming periods are 15 days by default, or we could calculate if needed
    } else if (activeFilters.dateFrom && activeFilters.dateTo) {
      const d1 = new Date(activeFilters.dateFrom);
      const d2 = new Date(activeFilters.dateTo);
      daysCount = Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24)) + 1);
      label = 'el periodo seleccionado';
      noun = 'del periodo';
    } else {
      switch (activeFilters.quickSelector) {
        case '1 día':
          label = 'hoy';
          noun = 'diaria';
          daysCount = 1;
          break;
        case '5 días':
          label = 'los últimos 5 días';
          noun = 'de 5 días';
          daysCount = 5;
          break;
        case '1 semana':
          label = 'la última semana';
          noun = 'semanal';
          daysCount = 7;
          break;
        case '15 días':
          label = 'los últimos 15 días';
          noun = 'quincenal';
          daysCount = 15;
          break;
        case '1 mes':
          label = 'el último mes';
          noun = 'mensual';
          daysCount = 30;
          break;
        case '1 trimestre':
          label = 'el último trimestre';
          noun = 'trimestral';
          daysCount = 90;
          break;
        case '1 semestre':
          label = 'el último semestre';
          noun = 'semestral';
          daysCount = 180;
          break;
        case '1 año':
          label = 'el último año';
          noun = 'anual';
          daysCount = 365;
          break;
        case 'Total':
          label = 'todo tu historial';
          noun = 'global';
          // We'll calculate daysCount based on the data if possible, else default
          if (readings.length > 0) {
            const dates = readings.map(r => new Date(r.date).getTime());
            const minDate = Math.min(...dates);
            const maxDate = Math.max(...dates);
            daysCount = Math.max(1, Math.ceil((maxDate - minDate) / (1000 * 3600 * 24)) + 1);
          } else {
            daysCount = 1;
          }
          break;
      }
    }

    return {
      readings: filteredReadings,
      label,
      noun,
      expectedToComplete: daysCount * 6 // 3 lecturas mañana + 3 lecturas noche
    };
  }, [readings, activeFilters]);

  const completionRate = analyzedData.expectedToComplete > 0 
    ? Math.round((analyzedData.readings.length / analyzedData.expectedToComplete) * 100) 
    : 0;
  const displayRate = completionRate > 100 ? 100 : completionRate;

  const avgSys = analyzedData.readings.length > 0 ? Math.round(analyzedData.readings.reduce((acc, r) => acc + r.systolic, 0) / analyzedData.readings.length) : 0;
  const avgDia = analyzedData.readings.length > 0 ? Math.round(analyzedData.readings.reduce((acc, r) => acc + r.diastolic, 0) / analyzedData.readings.length) : 0;

  let trendTitle = "Sin datos\nsuficientes.";
  let trendDesc = "Registra tus mediciones diarias para ver tu tendencia.";

  if (analyzedData.readings.length > 0) {
    const noun = analyzedData.noun;
    const label = analyzedData.label;
    const status = getBloodPressureStatus(avgSys, avgDia);

    if (status === 'hypertension') {
      trendTitle = `Tu tendencia\n${noun} indica\nHipertensión.`;
      trendDesc = `Tus niveles promedio son ${avgSys}/${avgDia} mmHg ${label}. Se recomienda consultar con un profesional de la salud de inmediato.`;
    } else if (status === 'hypotension') {
      trendTitle = `Tu tendencia\n${noun} indica\nHipotensión.`;
      trendDesc = `Tus niveles promedio son ${avgSys}/${avgDia} mmHg ${label}. Consulta con tu médico para ajustar tu tratamiento.`;
    } else if (status === 'normal-high') {
      trendTitle = `Tu tendencia\n${noun} es\nNormal-Alta.`;
      trendDesc = `Tus niveles promedio son ${avgSys}/${avgDia} mmHg ${label}. Mantén una vigilancia activa de tus hábitos saludables.`;
    } else {
      trendTitle = `Tu tendencia\n${noun} es\nNormal.`;
      trendDesc = `Tus niveles promedio son ${avgSys}/${avgDia} mmHg ${label}. ¡Excelente! Sigue manteniendo tu control diario.`;
    }
  }

  const formatRelativeDate = (dateString: string) => {
    // Usamos split('-') para evitar desfases de zona horaria con new Date(string)
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = year === today.getFullYear() && (month - 1) === today.getMonth() && day === today.getDate();
    const isYesterday = year === yesterday.getFullYear() && (month - 1) === yesterday.getMonth() && day === yesterday.getDate();

    const formattedDate = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }).toUpperCase();

    if (isToday) return `HOY, ${formattedDate}`;
    if (isYesterday) return `AYER, ${formattedDate}`;
    return formattedDate;
  };

  const renderReading = (reading: Reading) => {
    const isExpanded = expandedReadingId === reading.id;
    const status = getReadingStatus(reading.systolic, reading.diastolic);
    
    // Para la hora usamos recordedAt
    const timeObj = new Date(reading.recordedAt);
    const timeString = timeObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
    
    // Para la fecha usamos el campo 'date' del registro
    const [year, month, day] = reading.date.split('-').map(Number);
    const dateStr = new Date(year, month - 1, day).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    const relativeDateString = formatRelativeDate(reading.date);
    const isMorning = reading.slot === 'morning';
    
    if (isExpanded) {
      return (
        <motion.div 
          key={reading.id}
          layout
          className="flex flex-col lg:flex-row bg-surface-low rounded-[3rem] shadow-none overflow-hidden relative border-none"
        >
          <div className="flex-1 p-6 lg:p-8">
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  {isMorning ? <Sun className="w-[28px] h-[28px]" /> : <Moon className="w-[28px] h-[28px]" />}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-2xl font-bold text-foreground">{timeString}</span>
                    <Badge className="bg-surface-low text-on-surface-variant text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 border-none">
                      {isMorning ? 'MAÑANA' : 'NOCHE'}
                    </Badge>
                  </div>
                  <span className="text-sm font-medium text-on-surface-variant">
                    Lectura {reading.order} • {dateStr}
                  </span>
                </div>
              </div>
              <Badge className={cn("px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border-none", status.bg, status.color)}>
                {status.label}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-12 lg:gap-16">
              <div>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">PRESIÓN ARTERIAL</span>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <span className="text-5xl font-display font-black text-foreground">{reading.systolic}/{reading.diastolic}</span>
                  <span className="text-sm font-bold text-on-surface-variant">mmHg</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">PULSO</span>
                <div className="flex items-center gap-2 mt-2">
                  <Heart className="text-primary text-2xl fill-current" />
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-5xl font-display font-black text-foreground">{reading.heartRate || '--'}</span>
                    <span className="text-sm font-bold text-on-surface-variant">ppm</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-80 bg-surface-low p-6 lg:p-8 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <StickyNote className="text-on-surface-variant text-[20px]" />
              <span className="text-sm font-bold text-foreground">Notas del Paciente</span>
            </div>
            <div className="bg-surface-low rounded-2xl p-5 mb-6 flex-1 shadow-sm border border-border/50">
              <p className="text-sm text-on-surface-variant italic leading-relaxed">
                {reading.notes ? `"${reading.notes}"` : "Sin notas adicionales."}
              </p>
            </div>
            {!isDoctor && (
            <div className="flex flex-col gap-3 mt-auto">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingReading(reading);
                  setReadingFormOpen(true);
                }}
                className="w-full py-3.5 bg-surface-high hover:bg-surface-highest rounded-xl text-sm font-bold text-foreground flex items-center justify-center gap-2 transition-colors"
              >
                <Edit3 className="text-[18px]" />
                Editar Registro
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(reading.id);
                }}
                className="w-full py-3.5 text-destructive hover:bg-destructive/5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Trash2 className="text-[18px]" />
                Eliminar
              </button>
            </div>
            )}
            <button 
              onClick={() => setExpandedReadingId(null)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-surface-high text-on-surface-variant hover:bg-surface-highest lg:hidden"
            >
              <X className="text-[20px]" />
            </button>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div 
        key={reading.id}
        layout
        onClick={() => setExpandedReadingId(reading.id)}
        className="flex flex-col sm:flex-row sm:items-center justify-between bg-surface-low rounded-[2.5rem] p-5 sm:p-6 hover:bg-surface-high transition-all cursor-pointer gap-4 sm:gap-6 border-none"
      >
        <div className="flex items-center gap-4 sm:w-1/3">
          <div className="w-12 h-12 rounded-2xl bg-surface-lowest flex items-center justify-center text-on-surface-variant shrink-0 shadow-sm">
            {isMorning ? <Sun className="w-[24px] h-[24px]" /> : <Moon className="w-[24px] h-[24px]" />}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-bold text-foreground">{timeString}</span>
              <Badge className="bg-surface-high text-on-surface-variant text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border-none">
                {isMorning ? 'MAÑANA' : 'NOCHE'}
              </Badge>
            </div>
            <span className="text-xs font-medium text-on-surface-variant uppercase tracking-widest">
              {relativeDateString}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-8 sm:gap-12 sm:w-1/3">
          <div>
            <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">PRESIÓN</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-display font-black text-foreground">{reading.systolic}/{reading.diastolic}</span>
              <span className="text-[10px] font-bold text-on-surface-variant">mmHg</span>
            </div>
          </div>
          <div>
            <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">PULSO</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-display font-black text-foreground">{reading.heartRate || '--'}</span>
              <span className="text-[10px] font-bold text-on-surface-variant">ppm</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-1/3">
          <Badge className={cn("px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border-none", status.bg, status.color)}>
            {status.label}
          </Badge>
          <ChevronRight className="text-on-surface-variant text-[24px]" />
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-8 pb-24 sm:pb-0">
      {/* Consultation Mode Banner (Doctor viewing Patient) */}
      <AnimatePresence>
        {isViewingPatient && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-primary/5 border border-primary/20 rounded-[2.5rem] p-6 mb-2 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-foreground tracking-tight">Modo Consulta Activo</h4>
                  <p className="text-sm font-medium text-on-surface-variant">Revisando historial de <span className="text-primary font-bold">{activePatientName}</span></p>
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

      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-display font-black text-foreground mb-2">
            {isViewingPatient ? `Historial de ${activePatientName}` : "Historial Médico"}
          </h2>
          <p className="text-sm font-medium text-on-surface-variant">
            {isViewingPatient ? `Registros médicos de ${activePatientName}` : "Revisa y gestiona tus registros diarios de vitales."}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Button 
            variant="secondary" 
            onClick={() => setIsFilterModalOpen(true)}
            className="bg-surface-high hover:bg-surface-highest text-foreground rounded-full px-6 py-4 sm:py-2 flex items-center justify-center gap-2 font-bold relative"
          >
            <Filter className="text-[20px]" />
            Filtrar
            {(activeFilters.quickSelector !== '1 semana' || activeFilters.slot !== 'all' || activeFilters.periodId || activeFilters.dateFrom || activeFilters.dateTo) && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background"></span>
            )}
          </Button>
          {!isDoctor && (
          <Button 
            onClick={() => setReadingFormOpen(true)}
            className="bg-primary hover:bg-primary/90 text-white rounded-full px-6 py-4 sm:py-2 flex items-center justify-center gap-2 font-bold shadow-md shadow-primary/20"
          >
            <Plus className="text-[20px]" />
            Nuevo Registro
          </Button>
          )}
        </div>
      </section>

      {/* Active Filters Display */}
      {(activeFilters.quickSelector !== '1 día' || activeFilters.slot !== 'all' || activeFilters.periodId || activeFilters.dateFrom || activeFilters.dateTo) && (
        <div className="flex flex-wrap items-center gap-3 mb-8 bg-surface-low/50 p-4 rounded-3xl border border-border/50">
          <div className="flex items-center gap-2 mr-2">
            <SlidersHorizontal className="text-primary text-lg" />
            <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Filtros Activos</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {activeFilters.periodId && (
              <Badge className="bg-surface-lowest text-primary px-4 py-2 rounded-full text-xs font-bold border-none flex items-center gap-2 shadow-sm">
                Período {activeFilters.periodId}
                <button onClick={() => setActiveFilters(prev => ({ ...prev, periodId: undefined }))} className="hover:bg-primary/10 p-0.5 rounded-full transition-colors leading-none">
                  <X className="text-[16px]" />
                </button>
              </Badge>
            )}

            {!activeFilters.periodId && (activeFilters.dateFrom || activeFilters.dateTo) && (
              <Badge className="bg-surface-lowest text-primary px-4 py-2 rounded-full text-xs font-bold border-none flex items-center gap-2 shadow-sm">
                <Calendar className="text-[14px]" />
                {activeFilters.dateFrom || '?'} — {activeFilters.dateTo || '?'}
                <button onClick={() => setActiveFilters(prev => ({ ...prev, dateFrom: undefined, dateTo: undefined }))} className="hover:bg-primary/10 p-0.5 rounded-full transition-colors leading-none">
                  <X className="text-[16px]" />
                </button>
              </Badge>
            )}

            {!activeFilters.periodId && !activeFilters.dateFrom && !activeFilters.dateTo && activeFilters.quickSelector !== '1 semana' && (
              <Badge className="bg-surface-lowest text-primary px-4 py-2 rounded-full text-xs font-bold border-none flex items-center gap-2 shadow-sm">
                <Activity className="text-[14px]" />
                {activeFilters.quickSelector}
                <button onClick={() => setActiveFilters(prev => ({ ...prev, quickSelector: '1 semana' }))} className="hover:bg-primary/10 p-0.5 rounded-full transition-colors leading-none">
                  <X className="text-[16px]" />
                </button>
              </Badge>
            )}

            {activeFilters.slot !== 'all' && (
              <Badge className="bg-surface-lowest text-primary px-4 py-2 rounded-full text-xs font-bold border-none flex items-center gap-2 shadow-sm">
                {activeFilters.slot === 'morning' ? <Sun className="text-[14px]" /> : <Moon className="text-[14px]" />}
                {activeFilters.slot === 'morning' ? 'MAÑANA' : 'NOCHE'}
                <button onClick={() => setActiveFilters(prev => ({ ...prev, slot: 'all' }))} className="hover:bg-primary/10 p-0.5 rounded-full transition-colors leading-none">
                  <X className="text-[16px]" />
                </button>
              </Badge>
            )}

            {activeFilters.quickSelector === '15 días' && activeFilters.viewMode15Days && (
              <Badge className="bg-primary/10 text-primary px-4 py-2 rounded-full text-xs font-bold border-none flex items-center gap-2">
                MODO {activeFilters.viewMode15Days}
              </Badge>
            )}
          </div>

          <button 
            onClick={() => setActiveFilters({ quickSelector: '1 semana', slot: 'all' })}
            className="text-[10px] font-black tracking-widest text-primary hover:text-primary/80 ml-auto px-4 py-2 uppercase transition-all"
          >
            LIMPIAR TODO
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-surface-low rounded-[3rem] animate-pulse border-none" />
            ))}
          </div>
        ) : totalPages === 0 ? (
          <Card className="py-24 text-center border-dashed border-2 border-border bg-transparent shadow-none">
            <CardContent>
              <div className="w-24 h-24 bg-surface-low rounded-full flex items-center justify-center mx-auto mb-6">
                <HistoryIcon className="text-[48px] text-on-surface-variant/20" />
              </div>
              <h3 className="text-xl font-display font-black text-foreground">Sin registros</h3>
              <p className="text-on-surface-variant text-sm max-w-xs mx-auto mt-2">No se encontraron mediciones para los filtros seleccionados.</p>
          <Button variant="secondary" className="mt-8 rounded-full px-8" onClick={() => setActiveFilters({ quickSelector: '1 semana', slot: 'all' })}>
            Limpiar Filtros
          </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-12">
            {/* Pagination Header */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-surface-low p-3 sm:p-4 rounded-full border-none shadow-none gap-4">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-12 h-12 rounded-full bg-surface-high flex items-center justify-center text-on-surface-variant hover:bg-surface-highest transition-colors disabled:opacity-50"
                  >
                    <ChevronLeft className="" />
                  </button>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                      {activeFilters.quickSelector === '1 día' ? 'DÍA' : 'PÁGINA'} {currentPage}
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      {currentDaysData.length > 0 && new Date(currentDaysData[0].date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      {currentDaysData.length > 1 && ` - ${new Date(currentDaysData[currentDaysData.length - 1].date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`}
                    </span>
                  </div>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-12 h-12 rounded-full bg-surface-high flex items-center justify-center text-on-surface-variant hover:bg-surface-highest transition-colors disabled:opacity-50"
                  >
                    <ChevronRight className="" />
                  </button>
                </div>
                <div className="px-6 py-3 rounded-full bg-surface-high text-[10px] font-bold text-on-surface-variant tracking-widest uppercase hidden sm:block">
                  PÁGINA <span className="text-foreground">{currentPage}</span> DE <span className="text-foreground">{totalPages}</span>
                </div>
              </div>
            )}

            <div className="space-y-16">
              {(() => {
                if (activeFilters.quickSelector === '15 días' && activeFilters.viewMode15Days === 'A') {
                  const periods = new Map<number, typeof currentDaysData>();
                  currentDaysData.forEach(day => {
                    const pid = day.morning[0]?.periodId || day.evening[0]?.periodId || 0;
                    if (!periods.has(pid)) periods.set(pid, []);
                    periods.get(pid)!.push(day);
                  });
                  return Array.from(periods.entries()).map(([pid, days]) => (
                    <div key={`period-${pid}`} className="space-y-8 bg-surface-low/30 p-6 rounded-[2rem] border border-border">
                      <h2 className="text-2xl font-display font-black text-primary">PERÍODO {pid}</h2>
                      {days.map((dayData) => (
                        <div key={dayData.date} className="space-y-8">
                          {/* Date Header for the Day */}
                          <div className="flex items-center gap-4 pb-4 border-b border-border">
                            <div className="w-12 h-12 rounded-full bg-surface-low flex items-center justify-center text-primary shrink-0">
                              <Calendar className="" />
                            </div>
                            <div>
                              <h3 className="text-xl font-display font-bold text-foreground">
                                {new Date(dayData.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
                              </h3>
                            </div>
                          </div>

                          {/* Morning Section */}
                          {dayData.morning.length > 0 && (
                            <div className="space-y-6">
                              <div className="flex items-center gap-3 px-2">
                                <Sun className="text-on-surface-variant text-[20px]" />
                                <h4 className="font-bold text-on-surface-variant uppercase tracking-widest text-xs">Sesión de Mañana</h4>
                              </div>
                              <div className="grid grid-cols-1 gap-4">
                                {dayData.morning.map(renderReading)}
                              </div>
                            </div>
                          )}

                          {/* Evening Section */}
                          {dayData.evening.length > 0 && (
                            <div className="space-y-6">
                              <div className="flex items-center gap-3 px-2">
                                <Moon className="text-on-surface-variant text-[20px]" />
                                <h4 className="font-bold text-on-surface-variant uppercase tracking-widest text-xs">Sesión de Noche</h4>
                              </div>
                              <div className="grid grid-cols-1 gap-4">
                                {dayData.evening.map(renderReading)}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ));
                }

                if (activeFilters.quickSelector === '15 días' && activeFilters.viewMode15Days === 'B') {
                  const periods = new Map<number, typeof currentDaysData>();
                  currentDaysData.forEach(day => {
                    const pid = day.morning[0]?.periodId || day.evening[0]?.periodId || 0;
                    if (!periods.has(pid)) periods.set(pid, []);
                    periods.get(pid)!.push(day);
                  });
                  return Array.from(periods.entries()).map(([pid, days]) => {
                    let totalSys = 0, totalDia = 0, totalHr = 0, count = 0;
                    days.forEach(d => {
                      d.morning.forEach(r => { totalSys += r.systolic; totalDia += r.diastolic; totalHr += (r.heartRate || 0); count++; });
                      d.evening.forEach(r => { totalSys += r.systolic; totalDia += r.diastolic; totalHr += (r.heartRate || 0); count++; });
                    });
                    const avgSys = count > 0 ? Math.round(totalSys / count) : 0;
                    const avgDia = count > 0 ? Math.round(totalDia / count) : 0;
                    const avgHr = count > 0 ? Math.round(totalHr / count) : 0;
                    const status = getReadingStatus(avgSys, avgDia);

                    return (
                      <div key={`period-avg-${pid}`} className="bg-surface-low rounded-[2rem] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <PieChart className="text-[28px]" />
                          </div>
                          <div>
                            <h3 className="text-xl font-display font-bold text-foreground">PERÍODO {pid}</h3>
                            <span className="text-sm font-medium text-on-surface-variant">{days.length} días registrados</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          <div>
                            <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">MEDIA PRESIÓN</span>
                            <div className="flex items-baseline gap-1 mt-0.5">
                              <span className="text-3xl font-display font-black text-foreground">{avgSys}/{avgDia}</span>
                              <span className="text-xs font-bold text-on-surface-variant">mmHg</span>
                            </div>
                          </div>
                          <Badge className={cn("px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border-none", status.bg, status.color)}>
                            {status.label}
                          </Badge>
                        </div>
                      </div>
                    );
                  });
                }

                // Default rendering (Mode C or other filters)
                return currentDaysData.map((dayData, index) => (
                  <div key={dayData.date} className="space-y-8">
                    {/* Date Header for the Day */}
                    <div className="flex items-center gap-4 pb-4 border-b border-border">
                      <div className="w-12 h-12 rounded-full bg-surface-low flex items-center justify-center text-primary shrink-0">
                        <Calendar className="" />
                      </div>
                      <div>
                        <h3 className="text-xl font-display font-bold text-foreground">
                          {new Date(dayData.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
                        </h3>
                        {dayData.morning[0]?.periodId && (
                          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                            PERÍODO {dayData.morning[0]?.periodId || dayData.evening[0]?.periodId}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Morning Section */}
                    {dayData.morning.length > 0 && (
                      <div className="space-y-6">
                        <div className="flex items-center gap-3 px-2">
                          <Sun className="text-on-surface-variant text-[20px]" />
                          <h4 className="font-bold text-on-surface-variant uppercase tracking-widest text-xs">Sesión de Mañana</h4>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          {dayData.morning.map(renderReading)}
                        </div>
                      </div>
                    )}

                    {/* Evening Section */}
                    {dayData.evening.length > 0 && (
                      <div className="space-y-6">
                        <div className="flex items-center gap-3 px-2">
                          <Moon className="text-on-surface-variant text-[20px]" />
                          <h4 className="font-bold text-on-surface-variant uppercase tracking-widest text-xs">Sesión de Noche</h4>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          {dayData.evening.map(renderReading)}
                        </div>
                      </div>
                    )}
                  </div>
                ));
              })()}
            </div>

            {/* Bottom Pagination Controls (for long lists) */}
            {totalPages > 1 && currentDaysData.length > 0 && (
              <div className="flex items-center justify-center gap-4 pt-4 pb-8">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setCurrentPage(p => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="mr-2 text-[16px]" />
                  Anterior
                </Button>
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                  {currentPage} / {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setCurrentPage(p => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                  <ChevronRight className="ml-2 text-[16px]" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Cards Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-16">
        <div className="lg:col-span-2 bg-primary rounded-[2.5rem] p-8 sm:p-12 text-primary-foreground flex flex-col justify-between h-full min-h-[300px]">
          <div>
            <h3 className="text-3xl sm:text-4xl font-display font-bold mb-6 leading-tight whitespace-pre-line">
              {trendTitle}
            </h3>
            <p className="text-primary-foreground/80 text-sm sm:text-base leading-relaxed mb-10 max-w-md">
              {trendDesc}
            </p>
          </div>
          <button 
            onClick={() => setActiveTab('report')}
            className="bg-white/20 hover:bg-white/30 text-white rounded-full py-3.5 px-8 text-sm font-bold w-fit transition-colors flex items-center justify-center"
          >
            <FileText className="w-5 h-5 mr-2 shrink-0" />
            Ver Informe
          </button>
        </div>

        <Card className="p-8 sm:p-12 flex flex-col justify-between h-full min-h-[300px]">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-8">
            <Stethoscope className="text-[28px]" />
          </div>
          <div>
            <h3 className="text-6xl font-display font-black text-foreground mb-4">{displayRate}%</h3>
            <p className="text-on-surface-variant text-base font-medium leading-relaxed">
              Registros completados {analyzedData.label}
            </p>
          </div>
        </Card>
      </div>
      
      <AnimatePresence>
        {isFilterModalOpen && (
          <HistoryFilterModal 
            onClose={() => setIsFilterModalOpen(false)} 
            onApply={(filters) => setActiveFilters(filters)}
            initialFilters={activeFilters}
            availablePeriods={availablePeriods}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

