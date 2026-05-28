import * as React from "react";
import { useDashboard, useReadings } from "../../lib/api";
import { useAppStore } from "../../store/useAppStore";
import { calculateBMI, getBMICategory } from "../../lib/conversions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { AIPredictions } from "../AIPredictions";
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  ReferenceArea,
  AreaChart,
  Area
} from 'recharts';

import { getCachedAnalysis, generateAndCacheAnalysis } from '../../services/aiService';
import { toast } from 'sonner';
import { getBloodPressureStatus, getBloodPressureStyle, getPulseStatus, getPulseStyle } from "../../domain/health";
import { Sparkles, Loader2, LayoutDashboard, Target, HeartPulse, AlertCircle, Plus, Info, Clock, CalendarCheck, Calendar, ChevronDown, UserCheck, BarChart3, ShieldCheck, Check, ArrowRight, BrainCircuit, Activity, Heart, TrendingUp, TrendingDown, Minus, Sun, Moon, Stethoscope, FileText } from "lucide-react";

const LocalPulseStatusDisplay = ({ hr }: { hr: number | null | undefined }) => {
  if (!hr) return <Badge variant="secondary" className="bg-surface-low text-on-surface-variant/40 px-2 py-0.5 border-none text-[10px] uppercase font-bold tracking-widest leading-none">--</Badge>;
  const status = getPulseStatus(hr);
  const style = getPulseStyle(status);
  return (
    <Badge className={cn("px-2 py-0.5 border-none text-[10px] uppercase font-bold tracking-widest leading-none", style.bg, style.color)}>
      {style.label}
    </Badge>
  );
};

interface AnalysisCardProps {
  title: string;
  subtitle: string;
  imageSeed: string;
  customImageUrl?: string;
  statisticalAnalysis: string;
  aiAnalysis: string | null;
  isGenerating: boolean;
  onGenerate: () => void;
  comparisonText: string;
  comparisonTrend: 'up' | 'down' | 'stable';
  periodLabel: string;
  icon: React.ReactNode;
}

const AnalysisCard = ({ 
  title, 
  subtitle, 
  imageSeed, 
  customImageUrl,
  statisticalAnalysis, 
  aiAnalysis, 
  isGenerating, 
  onGenerate,
  comparisonText,
  comparisonTrend,
  periodLabel,
  icon
}: AnalysisCardProps) => (
  <Card className="bg-surface-low border-none shadow-none rounded-[3rem] overflow-hidden h-full">
    <CardHeader className="pb-6">
      <div className="flex justify-between items-start">
        <div>
          <CardDescription className="text-primary font-black">VISIÓN GENERAL</CardDescription>
          <CardTitle className="text-2xl font-black text-foreground">{title}</CardTitle>
        </div>
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary shadow-sm shrink-0">
          {icon}
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-8">
      <div className="flex flex-col gap-6">
        <div className="w-full aspect-video rounded-3xl overflow-hidden bg-surface-high relative shadow-inner">
          <img 
            src={customImageUrl || `https://picsum.photos/seed/${imageSeed}/800/450`} 
            alt="Analysis Visualization" 
            className="w-full h-full object-cover opacity-90"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-low/40 to-transparent" />
        </div>
        <div className="w-full flex flex-col gap-4">
          <p className="text-sm text-on-surface-variant leading-relaxed font-medium">
            {aiAnalysis || statisticalAnalysis}
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <div className={cn(
              "px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-sm",
              comparisonTrend === 'up' ? "bg-destructive/10 text-destructive" : 
              comparisonTrend === 'down' ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
            )}>
              <div className="flex items-center">
                {comparisonTrend === 'up' ? <TrendingUp className="text-[14px]" /> : comparisonTrend === 'down' ? <TrendingDown className="text-[14px]" /> : <Minus className="text-[14px]" />}
              </div>
              {comparisonText}
            </div>
            <div className="px-3 py-1.5 bg-surface-high text-on-surface-variant rounded-full text-[10px] font-bold shadow-sm">
              {periodLabel}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-border flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shadow-sm shrink-0">
            <Sparkles className="text-[24px]" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-on-surface">Análisis Médico IA</h4>
            <p className="text-[10px] text-on-surface-variant font-medium">{subtitle}</p>
          </div>
        </div>
        <Button 
          onClick={onGenerate}
          disabled={isGenerating}
          className="w-full rounded-full py-6 bg-primary hover:bg-primary-dark text-white font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <Loader2 className="animate-spin text-[20px]" />
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generar Informe IA
            </>
          )}
        </Button>
      </div>
    </CardContent>
  </Card>
);

export function Dashboard() {
  const { data: dashboard, isLoading } = useDashboard();
  
  // Atomic Selectors for Performance (O(1) renders)
  const user = useAppStore(s => s.user);
  const activePatientId = useAppStore(s => s.activePatientId);
  const activePatientName = useAppStore(s => s.activePatientName);
  const isDoctor = user?.role === 'doctor';
  const isViewingPatient = isDoctor && !!activePatientId;
  const displayName = isViewingPatient ? activePatientName : user?.displayName;

  const setReadingFormOpen = useAppStore(s => s.setReadingFormOpen);
  const setInfoModalOpen = useAppStore(s => s.setInfoModalOpen);
  const unitSystem = useAppStore(s => s.unitSystem);
  const autoBmi = useAppStore(s => s.autoBmi);
  const showTrends = useAppStore(s => s.showTrends);
  const measurementFrequency = useAppStore(s => s.measurementFrequency);
  const isDarkMode = useAppStore(s => s.isDarkMode);

  const [chartFilter, setChartFilter] = React.useState<'both' | 'pas' | 'pad'>('both');
  const [chartPeriod, setChartPeriod] = React.useState<'today' | 'period' | '15d' | 'month'>('month');
  const [finalPeriod, setFinalPeriod] = React.useState<'period' | 'fortnight' | 'month' | 'quarter' | 'semester' | 'year' | 'total'>('month');
  
  const [aiAnalysisBp, setAiAnalysisBp] = React.useState<string | null>(null);
  const [isGeneratingBp, setIsGeneratingBp] = React.useState(false);
  const [aiAnalysisPulse, setAiAnalysisPulse] = React.useState<string | null>(null);
  const [isGeneratingPulse, setIsGeneratingPulse] = React.useState(false);

  const { data: allReadings } = useReadings();

  const timeContext = React.useMemo(() => {
    const hour = new Date().getHours();
    
    // Time slots definition:
    // Morning: 06:00 - 12:00
    // Afternoon: 12:00 - 18:00
    // Evening: 18:00 - 21:00
    // Night: 21:00 - 06:00
    
    if (hour >= 6 && hour < 12) {
      return {
        greeting: "Buenos días",
        image: "/tensiotrack-morning.png",
        message: "Comience el día con una sonrisa y salud cardiovascular."
      };
    } else if (hour >= 12 && hour < 18) {
      return {
        greeting: "Buenas tardes",
        image: "/tensiotrack-afternoon.png",
        message: "Continúe con sus hábitos saludables y mantenga la energía."
      };
    } else if (hour >= 18 && hour < 21) {
      return {
        greeting: "Buen atardecer",
        image: "/tensiotrack-evening.png",
        message: "Un momento para la calma y la reflexión del día."
      };
    } else {
      return {
        greeting: "Buenas noches",
        image: "/tensiotrack-night.png",
        message: "Es momento de descansar y preparar el cuerpo para mañana."
      };
    }
  }, []);

  React.useEffect(() => {
    const loadCachedBp = async () => {
      const cached = await getCachedAnalysis('bp', finalPeriod);
      setAiAnalysisBp(cached);
    };
    loadCachedBp();
  }, [finalPeriod]);

  React.useEffect(() => {
    const loadCachedPulse = async () => {
      const cached = await getCachedAnalysis('pulse', finalPeriod);
      setAiAnalysisPulse(cached);
    };
    loadCachedPulse();
  }, [finalPeriod]);

  const handleGenerateBpAnalysis = async (dataStr: string) => {
    try {
      setIsGeneratingBp(true);
      const analysis = await generateAndCacheAnalysis('bp', finalPeriod, dataStr);
      setAiAnalysisBp(analysis);
      toast.success('Análisis generado con éxito');
    } catch (error) {
      console.error(error);
      toast.error('Error al generar el análisis');
    } finally {
      setIsGeneratingBp(false);
    }
  };

  const handleGeneratePulseAnalysis = async (dataStr: string) => {
    try {
      setIsGeneratingPulse(true);
      const analysis = await generateAndCacheAnalysis('pulse', finalPeriod, dataStr);
      setAiAnalysisPulse(analysis);
      toast.success('Análisis generado con éxito');
    } catch (error) {
      console.error(error);
      toast.error('Error al generar el análisis');
    } finally {
      setIsGeneratingPulse(false);
    }
  };

  const bmi = React.useMemo(() => {
    if (!user?.weight || !user?.height) return 0;
    return calculateBMI(user.weight, user.height, unitSystem);
  }, [user?.weight, user?.height, unitSystem]);

  const bmiCategory = React.useMemo(() => getBMICategory(bmi), [bmi]);

  const periodAvgSystolic = React.useMemo(() => {
    const morning = dashboard?.stats.periodAverages.morning?.systolic;
    const evening = dashboard?.stats.periodAverages.evening?.systolic;
    if (morning && evening) return Math.round((morning + evening) / 2);
    return morning || evening || null;
  }, [dashboard?.stats.periodAverages]);

  const periodAvgDiastolic = React.useMemo(() => {
    const morning = dashboard?.stats.periodAverages.morning?.diastolic;
    const evening = dashboard?.stats.periodAverages.evening?.diastolic;
    if (morning && evening) return Math.round((morning + evening) / 2);
    return morning || evening || null;
  }, [dashboard?.stats.periodAverages]);

  const chartData = React.useMemo(() => {
    if (!allReadings) return { morning: { systolic: 0, diastolic: 0 }, evening: { systolic: 0, diastolic: 0 }, label: 'Sin datos' };

    let filteredReadings = allReadings;
    let label = '';
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (chartPeriod === 'today') {
      filteredReadings = allReadings.filter(r => r.date === todayStr);
      label = 'Registros del día';
    } else if (chartPeriod === 'period') {
      // Last 5 days
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(now.getDate() - 5);
      const fiveDaysAgoStr = fiveDaysAgo.toISOString().split('T')[0];
      filteredReadings = allReadings.filter(r => r.date >= fiveDaysAgoStr && r.date <= todayStr);
      label = 'Registros de los últimos 5 días';
    } else if (chartPeriod === '15d') {
      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(now.getDate() - 15);
      const fifteenDaysAgoStr = fifteenDaysAgo.toISOString().split('T')[0];
      filteredReadings = allReadings.filter(r => r.date >= fifteenDaysAgoStr && r.date <= todayStr);
      label = 'Registros de los últimos 15 días (3 períodos)';
    } else if (chartPeriod === 'month') {
      const currentMonthStr = todayStr.substring(0, 7);
      filteredReadings = allReadings.filter(r => r.date.startsWith(currentMonthStr));
      label = 'Registros del mes actual';
    }

    const morningReadings = filteredReadings.filter(r => r.slot === 'morning');
    const eveningReadings = filteredReadings.filter(r => r.slot === 'evening');

    const calcAvg = (readings: any[]) => {
      if (readings.length === 0) return { systolic: 0, diastolic: 0 };
      const sysSum = readings.reduce((sum, r) => sum + r.systolic, 0);
      const diaSum = readings.reduce((sum, r) => sum + r.diastolic, 0);
      return {
        systolic: Math.round(sysSum / readings.length),
        diastolic: Math.round(diaSum / readings.length)
      };
    };

    return {
      morning: calcAvg(morningReadings),
      evening: calcAvg(eveningReadings),
      label
    };
  }, [allReadings, chartPeriod]);

  const trendData = React.useMemo(() => {
    if (!allReadings) return { data: [], label: 'Sin datos', avgSys: 0, avgDia: 0 };

    let filteredReadings = allReadings;
    let label = '';
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const getDaysAgoStr = (days: number) => {
      const d = new Date(now);
      d.setDate(now.getDate() - days);
      return d.toISOString().split('T')[0];
    };

    if (finalPeriod === 'period') {
      filteredReadings = allReadings.filter(r => r.date >= getDaysAgoStr(5) && r.date <= todayStr);
      label = 'Últimos 5 días';
    } else if (finalPeriod === 'fortnight') {
      filteredReadings = allReadings.filter(r => r.date >= getDaysAgoStr(15) && r.date <= todayStr);
      label = 'Últimos 15 días';
    } else if (finalPeriod === 'month') {
      filteredReadings = allReadings.filter(r => r.date >= getDaysAgoStr(30) && r.date <= todayStr);
      label = 'Últimos 30 días';
    } else if (finalPeriod === 'quarter') {
      filteredReadings = allReadings.filter(r => r.date >= getDaysAgoStr(90) && r.date <= todayStr);
      label = 'Últimos 90 días';
    } else if (finalPeriod === 'semester') {
      filteredReadings = allReadings.filter(r => r.date >= getDaysAgoStr(180) && r.date <= todayStr);
      label = 'Últimos 6 meses';
    } else if (finalPeriod === 'year') {
      filteredReadings = allReadings.filter(r => r.date >= getDaysAgoStr(365) && r.date <= todayStr);
      label = 'Último año';
    } else if (finalPeriod === 'total') {
      filteredReadings = allReadings;
      label = 'Desde el inicio';
    }

    // Group by date to get daily averages
    const dailyData = filteredReadings.reduce((acc, reading) => {
      if (!acc[reading.date]) {
        acc[reading.date] = { sysSum: 0, diaSum: 0, hrSum: 0, count: 0 };
      }
      acc[reading.date].sysSum += reading.systolic;
      acc[reading.date].diaSum += reading.diastolic;
      if (reading.heartRate) {
        acc[reading.date].hrSum += reading.heartRate;
      }
      acc[reading.date].count += 1;
      return acc;
    }, {} as Record<string, { sysSum: number, diaSum: number, hrSum: number, count: number }>);

    const data = Object.keys(dailyData).sort().map(date => {
      const day = dailyData[date];
      const dateObj = new Date(date);
      return {
        key: date,
        tooltipLabel: dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).toUpperCase(),
        pas: Math.round(day.sysSum / day.count),
        pad: Math.round(day.diaSum / day.count),
        fc: Math.round(day.hrSum / day.count) || 0
      };
    });

    const totalSys = data.length > 0 ? Math.round(data.reduce((sum, d) => sum + d.pas, 0) / data.length) : 0;
    const totalDia = data.length > 0 ? Math.round(data.reduce((sum, d) => sum + d.pad, 0) / data.length) : 0;
    const sysMax = data.length > 0 ? Math.max(...data.map(d => d.pas)) : 0;
    const sysMin = data.length > 0 ? Math.min(...data.map(d => d.pas)) : 0;
    const diaMax = data.length > 0 ? Math.max(...data.map(d => d.pad)) : 0;
    const diaMin = data.length > 0 ? Math.min(...data.map(d => d.pad)) : 0;
    
    let targetCount = 0;
    filteredReadings.forEach(r => {
       const status = getBloodPressureStatus(r.systolic, r.diastolic);
       if (status === 'normal' || status === 'normal-high') {
         targetCount++;
       }
    });
    const timeInTarget = filteredReadings.length > 0 ? Math.round((targetCount / filteredReadings.length) * 100) : 0;

    // Calculate comparison for badges
    let comparisonText = '--';
    let comparisonTrend: 'up' | 'down' | 'stable' = 'stable';
    
    const getPrevPeriodData = () => {
      const prevStart = new Date(now);
      const prevEnd = new Date(now);
      
      if (finalPeriod === 'period') {
        prevStart.setDate(now.getDate() - 10);
        prevEnd.setDate(now.getDate() - 6);
      } else if (finalPeriod === 'fortnight') {
        prevStart.setDate(now.getDate() - 30);
        prevEnd.setDate(now.getDate() - 16);
      } else if (finalPeriod === 'month') {
        prevStart.setDate(now.getDate() - 60);
        prevEnd.setDate(now.getDate() - 31);
      } else if (finalPeriod === 'quarter') {
        prevStart.setDate(now.getDate() - 180);
        prevEnd.setDate(now.getDate() - 91);
      } else if (finalPeriod === 'semester') {
        prevStart.setDate(now.getDate() - 360);
        prevEnd.setDate(now.getDate() - 181);
      } else if (finalPeriod === 'year') {
        prevStart.setDate(now.getDate() - 730);
        prevEnd.setDate(now.getDate() - 366);
      }
      
      const startStr = prevStart.toISOString().split('T')[0];
      const endStr = prevEnd.toISOString().split('T')[0];
      
      const prevReadings = allReadings.filter(r => r.date >= startStr && r.date <= endStr);
      if (prevReadings.length === 0) return null;
      
      const avgSys = Math.round(prevReadings.reduce((sum, r) => sum + r.systolic, 0) / prevReadings.length);
      return avgSys;
    };

    const prevAvgSys = getPrevPeriodData();
    if (prevAvgSys && totalSys > 0) {
      const diff = totalSys - prevAvgSys;
      const percent = Math.round((Math.abs(diff) / prevAvgSys) * 100);
      comparisonTrend = diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable';
      const trendIcon = diff > 0 ? '↑' : diff < 0 ? '↓' : '↔';
      comparisonText = `${trendIcon} ${percent}% vs período anterior`;
    }

    const periodDaysLabel = data.length > 0 
      ? `${data.length} ${data.length === 1 ? 'día analizado' : 'días analizados'}`
      : 'Sin datos registrados';

    let trendAnalysis = "Registra más datos para obtener un análisis de tendencia detallado.";
    if (data.length >= 2) {
      const firstHalf = data.slice(0, Math.ceil(data.length / 2));
      const secondHalf = data.slice(Math.floor(data.length / 2));
      
      const firstSysAvg = Math.round(firstHalf.reduce((sum, d) => sum + d.pas, 0) / firstHalf.length);
      const secondSysAvg = Math.round(secondHalf.reduce((sum, d) => sum + d.pas, 0) / secondHalf.length);
      const firstDiaAvg = Math.round(firstHalf.reduce((sum, d) => sum + d.pad, 0) / firstHalf.length);
      const secondDiaAvg = Math.round(secondHalf.reduce((sum, d) => sum + d.pad, 0) / secondHalf.length);
      
      const sysDiff = secondSysAvg - firstSysAvg;
      const diaDiff = secondDiaAvg - firstDiaAvg;
      
      const sysText = sysDiff > 0 ? `aumentado ${sysDiff} mmHg` : sysDiff < 0 ? `disminuido ${Math.abs(sysDiff)} mmHg` : `mantenido constante`;
      const diaText = diaDiff > 0 ? `aumentado ${diaDiff} mmHg` : diaDiff < 0 ? `disminuido ${Math.abs(diaDiff)} mmHg` : `mantenido constante`;
      
      const bpStatus = getBloodPressureStatus(secondSysAvg, secondDiaAvg);
      const bpStyle = getBloodPressureStyle(bpStatus);
      const statusText = bpStatus === 'normal' 
        ? "Tus valores recientes están dentro del rango Normal." 
        : `Tus valores recientes indican un estado de ${bpStyle.label}.`;
      
      trendAnalysis = `En este período, tu presión sistólica ha ${sysText} y la diastólica se ha ${diaText}. ${statusText} Promedio reciente: ${secondSysAvg}/${secondDiaAvg} mmHg.`;
    }

    return { data, label: finalPeriod, avgSys: totalSys, avgDia: totalDia, sysMax, sysMin, diaMax, diaMin, timeInTarget, trendAnalysis, comparisonText, comparisonTrend, periodDaysLabel };
  }, [allReadings, finalPeriod]);

  const pulseData = React.useMemo(() => {
    if (!allReadings) return { data: [], label: 'Sin datos', min: 0, max: 0, avg: 0, analysis: '' };

    let filteredReadings = allReadings.filter(r => r.heartRate && r.heartRate > 0);
    let label = '';
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const getDaysAgoStr = (days: number) => {
      const d = new Date(now);
      d.setDate(now.getDate() - days);
      return d.toISOString().split('T')[0];
    };

    if (finalPeriod === 'period') {
      filteredReadings = filteredReadings.filter(r => r.date >= getDaysAgoStr(5) && r.date <= todayStr);
      label = 'Últimos 5 días';
    } else if (finalPeriod === 'fortnight') {
      filteredReadings = filteredReadings.filter(r => r.date >= getDaysAgoStr(15) && r.date <= todayStr);
      label = 'Últimos 15 días';
    } else if (finalPeriod === 'month') {
      filteredReadings = filteredReadings.filter(r => r.date >= getDaysAgoStr(30) && r.date <= todayStr);
      label = 'Últimos 30 días';
    } else if (finalPeriod === 'quarter') {
      filteredReadings = filteredReadings.filter(r => r.date >= getDaysAgoStr(90) && r.date <= todayStr);
      label = 'Últimos 90 días';
    } else if (finalPeriod === 'semester') {
      filteredReadings = filteredReadings.filter(r => r.date >= getDaysAgoStr(180) && r.date <= todayStr);
      label = 'Últimos 6 meses';
    } else if (finalPeriod === 'year') {
      filteredReadings = filteredReadings.filter(r => r.date >= getDaysAgoStr(365) && r.date <= todayStr);
      label = 'Último año';
    } else if (finalPeriod === 'total') {
      filteredReadings = filteredReadings;
      label = 'Desde el inicio';
    }

    const dailyData = filteredReadings.reduce((acc, reading) => {
      if (!acc[reading.date]) {
        acc[reading.date] = { hrSum: 0, count: 0, min: 999, max: 0 };
      }
      acc[reading.date].hrSum += reading.heartRate!;
      acc[reading.date].count += 1;
      acc[reading.date].min = Math.min(acc[reading.date].min, reading.heartRate!);
      acc[reading.date].max = Math.max(acc[reading.date].max, reading.heartRate!);
      return acc;
    }, {} as Record<string, { hrSum: number, count: number, min: number, max: number }>);

    const data = Object.keys(dailyData).sort().map(date => {
      const day = dailyData[date];
      const dateObj = new Date(date);
      return {
        key: date,
        tooltipLabel: dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).toUpperCase(),
        fc: Math.round(day.hrSum / day.count),
        min: day.min,
        max: day.max
      };
    });

    const allFc = data.map(d => d.fc);
    const min = allFc.length > 0 ? Math.min(...allFc) : 0;
    const max = allFc.length > 0 ? Math.max(...allFc) : 0;
    const avg = allFc.length > 0 ? Math.round(allFc.reduce((a, b) => a + b, 0) / allFc.length) : 0;

    let targetCount = 0;
    let anomaliesCount = 0;
    filteredReadings.forEach(r => {
       const hr = r.heartRate!;
       if (hr >= 60 && hr <= 100) targetCount++;
       else anomaliesCount++;
    });
    const timeInTarget = filteredReadings.length > 0 ? Math.round((targetCount / filteredReadings.length) * 100) : 0;

    // Calculate comparison for badges
    let comparisonText = '--';
    let comparisonTrend: 'up' | 'down' | 'stable' = 'stable';
    
    const getPrevPeriodData = () => {
      const prevStart = new Date(now);
      const prevEnd = new Date(now);
      
      if (finalPeriod === 'period') {
        prevStart.setDate(now.getDate() - 10);
        prevEnd.setDate(now.getDate() - 6);
      } else if (finalPeriod === 'fortnight') {
        prevStart.setDate(now.getDate() - 30);
        prevEnd.setDate(now.getDate() - 16);
      } else if (finalPeriod === 'month') {
        prevStart.setDate(now.getDate() - 60);
        prevEnd.setDate(now.getDate() - 31);
      } else if (finalPeriod === 'quarter') {
        prevStart.setDate(now.getDate() - 180);
        prevEnd.setDate(now.getDate() - 91);
      } else if (finalPeriod === 'semester') {
        prevStart.setDate(now.getDate() - 360);
        prevEnd.setDate(now.getDate() - 181);
      } else if (finalPeriod === 'year') {
        prevStart.setDate(now.getDate() - 730);
        prevEnd.setDate(now.getDate() - 366);
      }
      
      const startStr = prevStart.toISOString().split('T')[0];
      const endStr = prevEnd.toISOString().split('T')[0];
      
      const prevReadings = allReadings.filter(r => r.heartRate && r.date >= startStr && r.date <= endStr);
      if (prevReadings.length === 0) return null;
      
      const avgHr = Math.round(prevReadings.reduce((sum, r) => sum + r.heartRate!, 0) / prevReadings.length);
      return avgHr;
    };

    const prevAvgHr = getPrevPeriodData();
    if (prevAvgHr && avg > 0) {
      const diff = avg - prevAvgHr;
      const percent = Math.round((Math.abs(diff) / prevAvgHr) * 100);
      comparisonTrend = diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable';
      const trendIcon = diff > 0 ? '↑' : diff < 0 ? '↓' : '↔';
      comparisonText = `${trendIcon} ${percent}% vs período anterior`;
    }

    const periodDaysLabel = data.length > 0 
      ? `${data.length} ${data.length === 1 ? 'día analizado' : 'días analizados'}`
      : 'Sin datos registrados';

    let analysis = "Registra más datos de pulso para obtener un análisis detallado.";
    if (data.length >= 2) {
      const firstHalf = data.slice(0, Math.ceil(data.length / 2));
      const secondHalf = data.slice(Math.floor(data.length / 2));
      
      const firstAvg = Math.round(firstHalf.reduce((sum, d) => sum + d.fc, 0) / firstHalf.length);
      const secondAvg = Math.round(secondHalf.reduce((sum, d) => sum + d.fc, 0) / secondHalf.length);
      
      const diff = secondAvg - firstAvg;
      
      if (diff > 3) {
        analysis = `Tu frecuencia cardíaca promedio ha aumentado en ${diff} ppm recientemente.`;
      } else if (diff < -3) {
        analysis = `Tu frecuencia cardíaca promedio ha disminuido en ${Math.abs(diff)} ppm.`;
      } else {
        analysis = `Tu ritmo cardíaco se ha mantenido en rangos de normalidad en este período, con un promedio de ${avg} ppm.`;
      }

      if (max > 100) {
        analysis += ` Se han detectado picos de Taquicardia (>100 ppm).`;
      } else if (min < 60 && min > 0) {
        analysis += ` Se han detectado valores de Bradicardia (<60 ppm).`;
      }
    }

    return { data, label: finalPeriod, min, max, avg, timeInTarget, anomaliesCount, analysis, comparisonText, comparisonTrend, periodDaysLabel };
  }, [allReadings, finalPeriod]);

  const finalResultData = React.useMemo(() => {
    if (!allReadings) return { avgSys: 0, avgDia: 0, avgHr: 0, count: 0, daysCount: 0, label: 'Sin datos', prevAvgSys: null };

    let filteredReadings = allReadings;
    let prevReadings: any[] = [];
    let label = '';
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // Helper to get dates
    const getDaysAgoStr = (days: number) => {
      const d = new Date(now);
      d.setDate(now.getDate() - days);
      return d.toISOString().split('T')[0];
    };

    if (finalPeriod === 'period') {
      filteredReadings = allReadings.filter(r => r.date >= getDaysAgoStr(5) && r.date <= todayStr);
      prevReadings = allReadings.filter(r => r.date >= getDaysAgoStr(10) && r.date < getDaysAgoStr(5));
      label = 'Últimos 5 días';
    } else if (finalPeriod === 'fortnight') {
      filteredReadings = allReadings.filter(r => r.date >= getDaysAgoStr(15) && r.date <= todayStr);
      prevReadings = allReadings.filter(r => r.date >= getDaysAgoStr(30) && r.date < getDaysAgoStr(15));
      label = 'Últimos 15 días';
    } else if (finalPeriod === 'month') {
      filteredReadings = allReadings.filter(r => r.date >= getDaysAgoStr(30) && r.date <= todayStr);
      prevReadings = allReadings.filter(r => r.date >= getDaysAgoStr(60) && r.date < getDaysAgoStr(30));
      label = 'Últimos 30 días';
    } else if (finalPeriod === 'quarter') {
      filteredReadings = allReadings.filter(r => r.date >= getDaysAgoStr(90) && r.date <= todayStr);
      prevReadings = allReadings.filter(r => r.date >= getDaysAgoStr(180) && r.date < getDaysAgoStr(90));
      label = 'Últimos 90 días';
    } else if (finalPeriod === 'semester') {
      filteredReadings = allReadings.filter(r => r.date >= getDaysAgoStr(180) && r.date <= todayStr);
      prevReadings = allReadings.filter(r => r.date >= getDaysAgoStr(360) && r.date < getDaysAgoStr(180));
      label = 'Últimos 6 meses';
    } else if (finalPeriod === 'year') {
      filteredReadings = allReadings.filter(r => r.date >= getDaysAgoStr(365) && r.date <= todayStr);
      prevReadings = allReadings.filter(r => r.date >= getDaysAgoStr(730) && r.date < getDaysAgoStr(365));
      label = 'Último año';
    } else if (finalPeriod === 'total') {
      filteredReadings = allReadings;
      label = 'Desde el inicio';
    }

    const count = filteredReadings.length;
    const daysCount = new Set(filteredReadings.map(r => r.date)).size;
    const avgSys = count > 0 ? Math.round(filteredReadings.reduce((sum, r) => sum + r.systolic, 0) / count) : 0;
    const avgDia = count > 0 ? Math.round(filteredReadings.reduce((sum, r) => sum + r.diastolic, 0) / count) : 0;
    const hrReadings = filteredReadings.filter(r => r.heartRate);
    const avgHr = hrReadings.length > 0 ? Math.round(hrReadings.reduce((sum, r) => sum + (r.heartRate || 0), 0) / hrReadings.length) : 0;

    const prevCount = prevReadings.length;
    const prevAvgSys = prevCount > 0 ? Math.round(prevReadings.reduce((sum, r) => sum + r.systolic, 0) / prevCount) : null;

    return { avgSys, avgDia, avgHr, count, daysCount, label, prevAvgSys };
  }, [allReadings, finalPeriod]);

  const period5DaysResult = React.useMemo(() => {
    if (!allReadings) return { currentSys: null, prevSys: null };
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const getDaysAgoStr = (days: number) => {
      const d = new Date(now);
      d.setDate(now.getDate() - days);
      return d.toISOString().split('T')[0];
    };

    const currentReadings = allReadings.filter(r => r.date >= getDaysAgoStr(5) && r.date <= todayStr);
    const prevReadings = allReadings.filter(r => r.date >= getDaysAgoStr(10) && r.date < getDaysAgoStr(5));
    
    const currentSys = currentReadings.length > 0 ? Math.round(currentReadings.reduce((s, r) => s + r.systolic, 0) / currentReadings.length) : null;
    const prevSys = prevReadings.length > 0 ? Math.round(prevReadings.reduce((s, r) => s + r.systolic, 0) / prevReadings.length) : null;
    return { currentSys, prevSys };
  }, [allReadings]);

  // Memoized Diagnostic Status for Performance (Defined before isLoading to follow Rules of Hooks)
  const getDiagnosticStatus = React.useCallback((sys?: number, dia?: number) => {
    if (!sys || !dia) return { label: 'PENDIENTE', variant: 'outline' as const, color: 'text-on-surface-variant', bg: 'bg-surface-low', border: 'border-border' };
    const status = getBloodPressureStatus(sys, dia);
    const style = getBloodPressureStyle(status);
    return { 
      label: style.label, 
      variant: (status === 'hypertension' ? 'danger' : status === 'normal-high' ? 'warning' : status === 'hypotension' ? 'info' : 'success') as any, 
      color: style.color, 
      bg: style.bg, 
      border: style.bg.replace('-layer', '/20') 
    };
  }, []);

  const finalStatus = React.useMemo(() => 
    getDiagnosticStatus(finalResultData.avgSys, finalResultData.avgDia)
  , [finalResultData.avgSys, finalResultData.avgDia, getDiagnosticStatus]);

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-40 sm:h-56 relative rounded-[2rem] overflow-hidden group shadow-2xl shadow-primary/10">
          <img 
            src={timeContext.image} 
            alt="Time of Day" 
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-linear-to-r from-card/90 via-card/40 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center px-8 sm:px-12">
            <h2 className="text-3xl sm:text-5xl font-display font-black tracking-tighter text-foreground mb-1">
              {timeContext.greeting}, <span className="text-primary">{displayName?.split(' ')[0] || 'Paciente'}</span>
            </h2>
            <p className="text-sm sm:text-lg font-bold text-on-surface-variant max-w-md hidden sm:block">
              {timeContext.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const morningSession = dashboard?.today?.sessions.find(s => s.slot === 'morning');
  const eveningSession = dashboard?.today?.sessions.find(s => s.slot === 'evening');
  const latestSession = eveningSession?.avgSystolic ? eveningSession : morningSession;
  
  const isControlled = dashboard?.stats.finalAverage 
    ? (dashboard.stats.finalAverage.systolic < 135 && dashboard.stats.finalAverage.diastolic < 85)
    : true;

  const completedSessions = dashboard?.stats.periodDays.reduce((acc, day) => acc + (day.morningAvg ? 1 : 0) + (day.eveningAvg ? 1 : 0), 0) || 0;
  const periodReadingsCount = completedSessions * 3;

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayDateStr = yesterdayDate.toISOString().split('T')[0];
  const yesterdayAvg = dashboard?.recentDailyAverages?.find(d => d.date === yesterdayDateStr);

  let latestSessionTrendText = "Sin datos previos";
  let latestSessionTrendIcon = "horizontal_rule";
  let latestSessionTrendColor = "text-on-surface-variant";

  if (latestSession) {
    if (latestSession.slot === 'evening' && morningSession?.avgSystolic) {
      const diff = latestSession.avgSystolic - morningSession.avgSystolic;
      const percent = Math.round((diff / morningSession.avgSystolic) * 100);
      if (percent > 0) {
        latestSessionTrendText = `+${percent}% vs mañana`;
        latestSessionTrendIcon = "trending_up";
        latestSessionTrendColor = "text-destructive";
      } else if (percent < 0) {
        latestSessionTrendText = `${percent}% vs mañana`;
        latestSessionTrendIcon = "trending_down";
        latestSessionTrendColor = "text-primary";
      } else {
        latestSessionTrendText = "Igual que mañana";
        latestSessionTrendIcon = "trending_flat";
        latestSessionTrendColor = "text-on-surface-variant";
      }
    } else if (latestSession.slot === 'morning') {
      latestSessionTrendText = "Primera lectura del día";
    }
  }

  let trendText = "Sin datos previos";
  let trendIcon = "horizontal_rule";
  let trendColor = "text-on-surface-variant";

  if (dashboard?.today?.avgSystolic && yesterdayAvg?.systolic) {
    const diff = dashboard.today.avgSystolic - yesterdayAvg.systolic;
    const percent = Math.round((diff / yesterdayAvg.systolic) * 100);
    if (percent > 0) {
      trendText = `+${percent}% vs ayer`;
      trendIcon = "trending_up";
      trendColor = "text-destructive";
    } else if (percent < 0) {
      trendText = `${percent}% vs ayer`;
      trendIcon = "trending_down";
      trendColor = "text-primary";
    } else {
      trendText = "Igual que ayer";
      trendIcon = "trending_flat";
      trendColor = "text-on-surface-variant";
    }
  }

  let sessionTimeText = "Sin datos";
  if (latestSession?.completedAt) {
    const date = new Date(latestSession.completedAt);
    const isToday = date.toDateString() === new Date().toDateString();
    const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    sessionTimeText = `${isToday ? 'Hoy' : date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}, ${timeStr}`;
  }

  const renderCustomDot = (props: any, type: 'pas' | 'pad' | 'hr') => {
    const { cx, cy, value, payload } = props;
    if (cx == null || cy == null) return null;
    
    let stroke = type === 'pas' ? "var(--primary)" : type === 'pad' ? "var(--primary-container)" : "var(--warning)";
    let fill = "var(--card)";
    
    if (type === 'pas') {
      if (value >= 180) { stroke = "var(--destructive)"; fill = "var(--destructive-container)"; }
      else if (value >= 135) { stroke = "var(--warning)"; fill = "var(--warning-container)"; }
    } else if (type === 'pad') {
      if (value >= 120) { stroke = "var(--destructive)"; fill = "var(--destructive-container)"; }
      else if (value >= 85) { stroke = "var(--warning)"; fill = "var(--warning-container)"; }
    } else {
      // Pulse logic
      if (value >= 100 || value <= 50) { stroke = "var(--destructive)"; fill = "var(--destructive-container)"; }
    }

    return (
      <circle 
        key={`dot-${type}-${payload.name}`} 
        cx={cx} 
        cy={cy} 
        r={5} 
        stroke={stroke} 
        strokeWidth={2} 
        fill={fill} 
      />
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={cn(
          "p-4 rounded-2xl shadow-xl border bg-card border-border"
        )}>
          <p className="text-xs font-bold mb-3 text-on-surface-variant uppercase tracking-widest">{label}</p>
          {payload.map((entry: any, index: number) => {
            const type = entry.dataKey;
            const value = entry.value;
            let colorClass = type === 'pas' ? "text-primary" : type === 'pad' ? "" : "text-warning";
            let customStyle = type === 'pad' && !colorClass ? { color: '#BBA2FD' } : {};
            
            if (type === 'pas') {
              if (value >= 180) colorClass = "text-destructive";
              else if (value >= 135) colorClass = "text-warning";
            } else if (type === 'pad') {
              if (value >= 120) colorClass = "text-destructive";
              else if (value >= 85) colorClass = "text-warning";
            } else if (type === 'fc') {
              if (value >= 100 || value <= 50) colorClass = "text-destructive";
            }

            return (
              <div key={index} className="flex items-center justify-between gap-6 py-1">
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{entry.name}</span>
                <span className={cn("text-lg font-black", colorClass)} style={colorClass ? undefined : customStyle}>{value}</span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const morningPas = chartData.morning.systolic;
  const eveningPas = chartData.evening.systolic;
  const morningPad = chartData.morning.diastolic;
  const eveningPad = chartData.evening.diastolic;

  const pasDiff = morningPas - eveningPas;
  const absDiff = Math.abs(pasDiff);

  let comparisonInsight = "";
  let comparisonColor = "text-on-surface-variant";
  let comparisonBg = "bg-surface-low";
  let comparisonBorder = "border-surface-highest";
  let ComparisonIcon = "info";
  let diffLabel = "";

  if (morningPas > 0 && eveningPas > 0) {
    if (pasDiff > 20) {
      comparisonInsight = "Pico matutino elevado. La tensión por la mañana es significativamente mayor, lo cual es un factor de riesgo cardiovascular. Consulta con tu médico.";
      comparisonColor = "text-destructive";
      comparisonBg = "bg-destructive/10";
      comparisonBorder = "border-destructive/20";
      ComparisonIcon = "warning";
      diffLabel = `+${Math.round(pasDiff)} mmHg en la mañana`;
    } else if (pasDiff > 10) {
      comparisonInsight = "Tensión matutina moderadamente más alta. Vigila esta tendencia y coméntalo en tu próxima revisión médica.";
      comparisonColor = "text-warning";
      comparisonBg = "bg-warning/10";
      comparisonBorder = "border-warning/20";
      ComparisonIcon = "warning";
      diffLabel = `+${Math.round(pasDiff)} mmHg en la mañana`;
    } else if (pasDiff < -10) {
      comparisonInsight = "Patrón invertido. La tensión es más alta por la noche. Es importante que tu médico valore este patrón.";
      comparisonColor = "text-primary";
      comparisonBg = "bg-primary/5";
      comparisonBorder = "border-primary/10";
      ComparisonIcon = "info";
      diffLabel = `+${Math.round(absDiff)} mmHg en la noche`;
    } else {
      comparisonInsight = "Patrón estable. La variación entre la mañana y la noche está dentro de los parámetros normales.";
      comparisonColor = "text-success";
      comparisonBg = "bg-success/10";
      comparisonBorder = "border-success/20";
      ComparisonIcon = "check_circle";
      diffLabel = `Variación mínima (${Math.round(absDiff)} mmHg)`;
    }
  } else {
    comparisonInsight = "Faltan datos para comparar. Completa las mediciones de mañana y noche.";
  }

  const todayDateObj = new Date();
  const todayFormatted = todayDateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

  let period5TrendText = "Sin datos previos";
  let period5TrendIcon = "horizontal_rule";
  let period5TrendColor = "text-on-surface-variant";

  if (period5DaysResult.currentSys && period5DaysResult.prevSys) {
    const dDiff = period5DaysResult.currentSys - period5DaysResult.prevSys;
    const dPercent = Math.round((dDiff / period5DaysResult.prevSys) * 100);
    if (dPercent > 0) {
      period5TrendText = `+${dPercent}% vs período anterior`;
      period5TrendIcon = "trending_up";
      period5TrendColor = "text-destructive";
    } else if (dPercent < 0) {
      period5TrendText = `${dPercent}% vs período anterior`;
      period5TrendIcon = "trending_down";
      period5TrendColor = "text-primary";
    } else {
      period5TrendText = "Sin cambios";
      period5TrendIcon = "trending_flat";
      period5TrendColor = "text-on-surface-variant";
    }
  }

  let historyTrendText = "Sin datos previos";
  let historyTrendIcon = "horizontal_rule";
  let historyTrendColor = "text-on-surface-variant";

  if (finalResultData.avgSys && finalResultData.prevAvgSys) {
    const dDiff = finalResultData.avgSys - finalResultData.prevAvgSys;
    const dPercent = Math.round((dDiff / finalResultData.prevAvgSys) * 100);
    if (dPercent > 0) {
      historyTrendText = `+${dPercent}% vs ${finalResultData.label.toLowerCase()}`;
      historyTrendIcon = "trending_up";
      historyTrendColor = "text-destructive";
    } else if (dPercent < 0) {
      historyTrendText = `${dPercent}% vs ${finalResultData.label.toLowerCase()}`;
      historyTrendIcon = "trending_down";
      historyTrendColor = "text-primary";
    } else {
      historyTrendText = "Sin cambios";
      historyTrendIcon = "trending_flat";
      historyTrendColor = "text-on-surface-variant";
    }
  }

  const currentStatusLatest = getDiagnosticStatus(latestSession?.avgSystolic, latestSession?.avgDiastolic);
  const currentStatusToday = getDiagnosticStatus(dashboard?.today?.avgSystolic, dashboard?.today?.avgDiastolic);
  const currentStatusPeriod = getDiagnosticStatus(periodAvgSystolic, periodAvgDiastolic);

  return (
    <div className="space-y-6 sm:space-y-10">
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
                  <p className="text-sm font-medium text-on-surface-variant">Estás auditando el perfil clínico de <span className="text-primary font-bold">{activePatientName}</span></p>
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

      {/* Welcome Banner with Image */}
      <section className="relative rounded-[2.8rem] overflow-hidden group shadow-2xl shadow-primary/5">
        <AnimatePresence mode="wait">
          <motion.img 
            key={timeContext.image}
            src={timeContext.image} 
            alt={timeContext.greeting} 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-linear-to-r from-card/90 via-card/40 to-transparent" />
        
        <div className="relative p-7 sm:p-10 md:p-12 flex flex-col justify-center min-h-[14rem] sm:min-h-[16rem]">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 relative z-10 w-full">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="max-w-xl space-y-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/10 backdrop-blur-md rounded-full flex items-center justify-center text-primary border border-primary/20 shrink-0">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">Panel de Control</span>
              </div>
              <h2 className="text-4xl sm:text-5xl md:text-display-md font-display font-black text-foreground tracking-tighter leading-tight text-balance">
                ¡{timeContext.greeting}, <span className="text-primary">{displayName?.split(' ')[0] || 'Paciente'}</span>!
              </h2>
              <p className="text-on-surface-variant font-bold max-w-md text-sm sm:text-base leading-relaxed">
                {dashboard?.stats.isComplete 
                  ? "Protocolo completado. Su informe médico está listo para ser revisado."
                  : (dashboard?.stats.daysCount && dashboard.stats.daysCount > 0 
                      ? `Día ${dashboard.stats.daysCount} de 5 del protocolo AMPA. ${timeContext.message}`
                      : `Bienvenido. ${timeContext.message}`)}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4-Level Analysis Grid */}
      <section className="space-y-4">
        <div className="flex justify-end px-2">
          <button 
            onClick={() => setInfoModalOpen(true)}
            className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-variant/20"
            aria-label="Más información sobre el análisis"
          >
            <Info className="text-[20px]" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Level 1: Last Session */}
          <Card className="relative overflow-hidden bg-white dark:bg-card rounded-[3rem] p-6 sm:p-8 shadow-aura flex flex-col min-h-[380px] border-none">
            <div className="flex items-start justify-between mb-6">
              <div className="flex flex-col gap-1">
                <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">Última Lectura</h3>
                <CardDescription className="text-[10px] font-black tracking-[0.1em] opacity-60 uppercase">
                  {latestSession ? (latestSession.slot === 'morning' ? 'MAÑANA' : 'NOCHE') : 'SIN LECTURAS HOY'}
                </CardDescription>
              </div>
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="flex flex-col mb-6">
              <span className="text-5xl sm:text-6xl font-black font-display text-foreground tracking-tighter leading-none shrink-0">
                {latestSession ? `${Math.round(latestSession.avgSystolic)}/${Math.round(latestSession.avgDiastolic)}` : '--/--'}
              </span>
              <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mt-3 ml-1 opacity-60 shrink-0">MMHG</span>
            </div>

            <div className="mt-auto space-y-4">
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div className="bg-surface-low rounded-2xl p-3 flex flex-col items-center justify-center text-center border border-border/10 transition-colors">
                  <span className="text-[8px] sm:text-[9px] font-black opacity-60 uppercase tracking-widest mb-1">LECTURAS</span>
                  <span className="text-sm sm:text-md font-black text-primary">{latestSession?.readings.length || 0} / 3</span>
                </div>
                <div className="bg-surface-low rounded-2xl p-3 flex flex-col items-center justify-center text-center border border-border/10 transition-colors">
                  <span className="text-[8px] sm:text-[9px] font-black opacity-60 uppercase tracking-widest mb-1">PULSO MEDIO</span>
                  <span className="text-sm sm:text-md font-black text-primary">{latestSession?.avgHeartRate ? Math.round(latestSession.avgHeartRate) : '--'} <span className="text-[10px] opacity-60 font-black">PPM</span></span>
                </div>
              </div>
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.15em]">Estado</span>
                  <span className={cn("text-[10px] font-black uppercase tracking-widest", currentStatusLatest.color)}>{currentStatusLatest.label}</span>
                </div>
                <div className="h-1.5 w-full bg-surface-high rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full transition-all duration-1000", currentStatusLatest.bg)} 
                    style={{ width: latestSession?.avgSystolic ? `${Math.min(100, Math.max(5, ((latestSession.avgSystolic) - 90) / (160 - 90) * 100))}%` : '0%' }} 
                  />
                </div>
              </div>
              {morningSession && eveningSession ? (
                <div className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] border border-border/50", latestSessionTrendColor, latestSessionTrendColor.replace('text-', 'bg-') + '/10')}>
                  {latestSessionTrendIcon === 'trending_up' ? <TrendingUp className="w-4 h-4" /> : latestSessionTrendIcon === 'trending_down' ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                  <span>{latestSessionTrendText}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] border border-border/50 text-on-surface-variant bg-surface-high">
                  <Clock className="w-4 h-4" />
                  <span>{latestSession ? latestSessionTrendText : 'Sin datos previos'}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Level 2: Daily */}
          <Card className="relative overflow-hidden bg-white dark:bg-card rounded-[3rem] p-6 sm:p-8 shadow-aura flex flex-col min-h-[380px] border-none">
            <div className="flex items-start justify-between mb-6">
              <div className="flex flex-col gap-1">
                <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">Media Hoy</h3>
                <CardDescription className="text-[10px] font-black tracking-[0.1em] opacity-60 uppercase">
                  {todayFormatted}
                </CardDescription>
              </div>
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                <CalendarCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="flex flex-col mb-6">
              <span className="text-5xl sm:text-6xl font-black font-display text-foreground tracking-tighter leading-none shrink-0">
                {dashboard?.today?.avgSystolic ? `${Math.round(dashboard.today.avgSystolic)}/${Math.round(dashboard.today.avgDiastolic)}` : '--/--'}
              </span>
              <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mt-3 ml-1 opacity-60 shrink-0">MMHG</span>
            </div>

            <div className="mt-auto space-y-4">
              <div className="space-y-2 mb-4 shrink-0">
                <div className="flex items-center justify-between text-xs font-bold px-1">
                  <span className="text-on-surface-variant uppercase tracking-widest text-[9px] w-16">MAÑANA</span>
                  <div className="flex gap-4">
                    <span className="text-foreground">{morningSession?.avgSystolic ? `${Math.round(morningSession.avgSystolic)}/${Math.round(morningSession.avgDiastolic)}` : '--/--'}</span>
                    <span className="text-on-surface-variant opacity-60 w-12 text-right">{morningSession?.avgHeartRate ? `${Math.round(morningSession.avgHeartRate)} PPM` : '--'}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs font-bold px-1">
                  <span className="text-on-surface-variant uppercase tracking-widest text-[9px] w-16">NOCHE</span>
                  <div className="flex gap-4">
                    <span className="text-foreground">{eveningSession?.avgSystolic ? `${Math.round(eveningSession.avgSystolic)}/${Math.round(eveningSession.avgDiastolic)}` : '--/--'}</span>
                    <span className="text-on-surface-variant opacity-60 w-12 text-right">{eveningSession?.avgHeartRate ? `${Math.round(eveningSession.avgHeartRate)} PPM` : '--'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-2">
                <div className="bg-surface-low rounded-2xl p-3 flex flex-col items-center justify-center text-center border border-border/10 transition-colors">
                  <span className="text-[8px] sm:text-[9px] font-black opacity-60 uppercase tracking-widest mb-1">LECTURAS</span>
                  <span className="text-sm sm:text-md font-black text-primary">{(morningSession?.readings.length || 0) + (eveningSession?.readings.length || 0)} / 6</span>
                </div>
                <div className="bg-surface-low rounded-2xl p-3 flex flex-col items-center justify-center text-center border border-border/10 transition-colors">
                  <span className="text-[8px] sm:text-[9px] font-black opacity-60 uppercase tracking-widest mb-1">PULSO MEDIO</span>
                  <span className="text-sm sm:text-md font-black text-primary">{dashboard?.today?.avgHeartRate ? Math.round(dashboard.today.avgHeartRate) : '--'} <span className="text-[10px] opacity-60 font-black">PPM</span></span>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.15em]">Estado</span>
                  <span className={cn("text-[10px] font-black uppercase tracking-widest", currentStatusToday.color)}>{currentStatusToday.label}</span>
                </div>
                <div className="h-1.5 w-full bg-surface-high rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full transition-all duration-1000", currentStatusToday.bg)} 
                    style={{ width: dashboard?.today?.avgSystolic ? `${Math.min(100, Math.max(5, ((dashboard.today.avgSystolic) - 90) / (160 - 90) * 100))}%` : '0%' }} 
                  />
                </div>
              </div>
              <div className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] border border-border/50", trendColor, trendColor.replace('text-', 'bg-') + '/10')}>
                {trendIcon === 'trending_up' ? <TrendingUp className="w-4 h-4" /> : trendIcon === 'trending_down' ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                <span>{trendText}</span>
              </div>
            </div>
          </Card>

          {/* Level 3: Period */}
          <Card className="relative overflow-hidden bg-white dark:bg-card rounded-[3rem] p-6 sm:p-8 shadow-aura flex flex-col min-h-[380px] border-none">
            <div className="flex items-start justify-between mb-6">
              <div className="flex flex-col gap-1">
                <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">Media Período</h3>
                <CardDescription className="text-[10px] font-black tracking-[0.1em] opacity-60 uppercase">
                  ÚLTIMOS 5 DÍAS
                </CardDescription>
              </div>
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
            </div>

            <div className="flex flex-col mb-6">
              <span className="text-5xl sm:text-6xl font-black font-display text-foreground tracking-tighter leading-none shrink-0">
                {periodAvgSystolic ? `${periodAvgSystolic}/${periodAvgDiastolic}` : '--/--'}
              </span>
              <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mt-3 ml-1 opacity-60 shrink-0">MMHG</span>
            </div>

            <div className="mt-auto space-y-4">
              <div className="space-y-2 mb-4 shrink-0">
                <div className="flex items-center justify-between text-xs font-bold px-1">
                  <span className="text-on-surface-variant uppercase tracking-widest text-[9px] w-16">MAÑANA</span>
                  <div className="flex gap-4">
                    <span className="text-foreground">{dashboard?.stats.periodAverages.morning?.systolic ? `${dashboard.stats.periodAverages.morning.systolic}/${dashboard.stats.periodAverages.morning.diastolic}` : '--/--'}</span>
                    <span className="text-on-surface-variant opacity-60 w-12 text-right">{dashboard?.stats.periodAverages.morning?.heartRate ? `${dashboard.stats.periodAverages.morning.heartRate} PPM` : '--'}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs font-bold px-1">
                  <span className="text-on-surface-variant uppercase tracking-widest text-[9px] w-16">NOCHE</span>
                  <div className="flex gap-4">
                    <span className="text-foreground">{dashboard?.stats.periodAverages.evening?.systolic ? `${dashboard.stats.periodAverages.evening.systolic}/${dashboard.stats.periodAverages.evening.diastolic}` : '--/--'}</span>
                    <span className="text-on-surface-variant opacity-60 w-12 text-right">{dashboard?.stats.periodAverages.evening?.heartRate ? `${dashboard.stats.periodAverages.evening.heartRate} PPM` : '--'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-2">
                <div className="bg-surface-low rounded-2xl p-3 flex flex-col items-center justify-center text-center border border-border/10 transition-colors">
                  <span className="text-[8px] sm:text-[9px] font-black opacity-60 uppercase tracking-widest mb-1">LECTURAS</span>
                  <span className="text-sm sm:text-md font-black text-primary">{periodReadingsCount || 0} / 30</span>
                </div>
                <div className="bg-surface-low rounded-2xl p-3 flex flex-col items-center justify-center text-center border border-border/10 transition-colors">
                  <span className="text-[8px] sm:text-[9px] font-black opacity-60 uppercase tracking-widest mb-1">PULSO MEDIO</span>
                  <span className="text-sm sm:text-md font-black text-primary">{Math.round((dashboard?.stats.periodAverages.morning?.heartRate || 0) / 2 + (dashboard?.stats.periodAverages.evening?.heartRate || 0) / 2) || '--'} <span className="text-[10px] opacity-60 font-black">PPM</span></span>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.15em]">Estado</span>
                  <span className={cn("text-[10px] font-black uppercase tracking-widest", currentStatusPeriod.color)}>{currentStatusPeriod.label}</span>
                </div>
                <div className="h-1.5 w-full bg-surface-high rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full transition-all duration-1000", currentStatusPeriod.bg)} 
                    style={{ width: periodAvgSystolic ? `${Math.min(100, Math.max(5, ((periodAvgSystolic) - 90) / (160 - 90) * 100))}%` : '0%' }} 
                  />
                </div>
              </div>
              <div className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] border border-border/50", period5TrendColor, period5TrendColor.replace('text-', 'bg-') + '/10')}>
                {period5TrendIcon === 'trending_up' ? <TrendingUp className="w-4 h-4" /> : period5TrendIcon === 'trending_down' ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                <span>{period5TrendText}</span>
              </div>
            </div>
          </Card>

          {/* Level 4: Final */}
          <Card className="relative overflow-hidden bg-white dark:bg-card rounded-[3rem] p-6 sm:p-8 shadow-aura flex flex-col min-h-[380px] border-none">
            <div className="flex items-start justify-between mb-6">
              <div className="flex flex-col gap-1 flex-1 min-w-0 pr-4">
                <h3 className="text-headline-sm font-black text-foreground tracking-tight">Evolución Clínica</h3>
                <div className="relative flex items-center group mt-1 w-full max-w-[180px]">
                  <select 
                    value={finalPeriod}
                    onChange={(e) => setFinalPeriod(e.target.value as any)}
                    className="bg-transparent w-full border-none text-[10px] font-black text-primary uppercase tracking-[0.1em] focus:ring-0 outline-none cursor-pointer appearance-none z-10 pr-8 pl-0 py-2"
                  >
                    <option value="period">ÚLTIMOS 5 DÍAS</option>
                    <option value="fortnight">ÚLTIMOS 15 DÍAS</option>
                    <option value="month">ÚLTIMOS 30 DÍAS</option>
                    <option value="quarter">ÚLTIMOS 90 DÍAS</option>
                    <option value="semester">ÚLTIMOS 6 MESES</option>
                    <option value="year">ÚLTIMO AÑO</option>
                    <option value="total">DESDE EL INICIO</option>
                  </select>
                  <ChevronDown className="absolute right-0 w-3 h-3 text-primary pointer-events-none transition-transform group-hover:translate-y-0.5" />
                </div>
              </div>
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="flex flex-col mb-6">
              <span className="text-5xl sm:text-6xl font-black font-display text-foreground tracking-tighter leading-none shrink-0">
                {finalResultData.avgSys ? `${finalResultData.avgSys}/${finalResultData.avgDia}` : '--/--'}
              </span>
              <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mt-3 ml-1 opacity-60 shrink-0">MMHG</span>
            </div>

            <div className="mt-auto space-y-4">
              <div className="space-y-2 mb-4 shrink-0 text-transparent select-none overflow-hidden h-[46px]">
                {/* Spacer block to uniformly match the other cards that have morning/night breakdowns */}
                _
              </div>

              <div className="grid grid-cols-2 gap-3 mb-2">
                <div className="bg-surface-low rounded-2xl p-3 flex flex-col items-center justify-center text-center border border-border/10 transition-colors">
                  <span className="text-[8px] sm:text-[9px] font-black opacity-60 uppercase tracking-widest mb-1">LECTURAS TOTALES</span>
                  <span className="text-sm sm:text-md font-black text-primary">{finalResultData.count}</span>
                </div>
                <div className="bg-surface-low rounded-2xl p-3 flex flex-col items-center justify-center text-center border border-border/10 transition-colors">
                  <span className="text-[8px] sm:text-[9px] font-black opacity-60 uppercase tracking-widest mb-1">PULSO MEDIO</span>
                  <span className="text-sm sm:text-md font-black text-primary">{finalResultData.avgHr || '--'} <span className="text-[10px] opacity-60 font-black">PPM</span></span>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.15em]">Estado</span>
                  <span className={cn("text-[10px] font-black uppercase tracking-widest", finalStatus.color)}>{finalResultData.avgSys ? finalStatus.label : 'SIN DATOS'}</span>
                </div>
                <div className="h-1.5 w-full bg-surface-high rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full transition-all duration-1000", finalStatus.bg)} 
                    style={{ width: finalResultData.avgSys ? `${Math.min(100, Math.max(5, ((finalResultData.avgSys) - 90) / (160 - 90) * 100))}%` : '0%' }} 
                  />
                </div>
              </div>
              <div className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] border border-border/50", historyTrendColor, historyTrendColor.replace('text-', 'bg-') + '/10')}>
                {historyTrendIcon === 'trending_up' ? <TrendingUp className="w-4 h-4" /> : historyTrendIcon === 'trending_down' ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                <span>{historyTrendText}</span>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Charts & Status Section - Refined for better proportions */}
      <section className="grid grid-cols-1 lg:grid-cols-1 xl:grid-cols-3 gap-8 items-stretch">
        <div className="xl:col-span-2">
          <Card className="h-full bg-card rounded-[2.8rem] border-none shadow-aura-light dark:shadow-aura-dark">
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <CardDescription className="text-primary">COMPARATIVA DIARIA</CardDescription>
                  <CardTitle className="text-2xl font-black text-foreground">Mañana vs Noche</CardTitle>
                </div>
                <div className="flex bg-surface p-1 rounded-full border border-border">
                  <button 
                    onClick={() => setChartPeriod('today')}
                    className={cn("px-4 py-1.5 text-xs font-bold rounded-full transition-colors", chartPeriod === 'today' ? "bg-primary text-white shadow-sm" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-high")}
                  >
                    1D
                  </button>
                  <button 
                    onClick={() => setChartPeriod('period')}
                    className={cn("px-4 py-1.5 text-xs font-bold rounded-full transition-colors", chartPeriod === 'period' ? "bg-primary text-white shadow-sm" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-high")}
                  >
                    5D
                  </button>
                  <button 
                    onClick={() => setChartPeriod('15d')}
                    className={cn("px-4 py-1.5 text-xs font-bold rounded-full transition-colors", chartPeriod === '15d' ? "bg-primary text-white shadow-sm" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-high")}
                  >
                    15D
                  </button>
                  <button 
                    onClick={() => setChartPeriod('month')}
                    className={cn("px-4 py-1.5 text-xs font-bold rounded-full transition-colors", chartPeriod === 'month' ? "bg-primary text-white shadow-sm" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-high")}
                  >
                    1M
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-8">
              <div className="h-72 w-full mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { 
                        name: 'Mañana', 
                        time: '08:00 AM',
                        pas: chartData.morning.systolic, 
                        pad: chartData.morning.diastolic 
                      },
                      { 
                        name: 'Noche', 
                        time: '10:30 PM',
                        pas: chartData.evening.systolic, 
                        pad: chartData.evening.diastolic 
                      }
                    ]}
                    margin={{ top: 20, right: 10, left: -20, bottom: 20 }}
                    barGap={4}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.05)"} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={(props) => {
                        const { x, y, payload } = props;
                        const item = payload.value === 'Mañana' ? { name: 'Mañana', time: '08:00 AM' } : { name: 'Noche', time: '10:30 PM' };
                        return (
                          <g transform={`translate(${x},${y})`}>
                            <text x={0} y={15} dy={0} textAnchor="middle" fill={isDarkMode ? '#F8FAFC' : '#0F172A'} fontSize={14} fontWeight={800}>{item.name}</text>
                            <text x={0} y={35} dy={0} textAnchor="middle" fill={isDarkMode ? '#94A3B8' : '#64748B'} fontSize={12} fontWeight={600}>{item.time}</text>
                          </g>
                        );
                      }}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: isDarkMode ? '#94A3B8' : '#64748B', fontSize: 12, fontWeight: 600 }} />
                    <Tooltip 
                      cursor={{ fill: 'var(--primary)', opacity: 0.05 }}
                      content={<CustomTooltip />}
                    />
                    <Legend 
                      verticalAlign="top" 
                      align="right"
                      iconType="circle" 
                      wrapperStyle={{ paddingBottom: '30px', fontSize: '10px', fontWeight: 800, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.1em' }} 
                    />
                    <Bar dataKey="pas" name="Sistólica" fill="#6322E0" radius={[10, 10, 0, 0]} barSize={56} />
                    <Bar dataKey="pad" name="Diastólica" fill="#BBA2FD" radius={[10, 10, 0, 0]} barSize={56} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Comparison Insight */}
              {morningPas > 0 && eveningPas > 0 && (
                <div className="mt-8 p-8 rounded-[2rem] bg-surface-low flex flex-col sm:flex-row items-start gap-6 border border-border/50">
                  <div className="w-14 h-14 rounded-full bg-surface-low shadow-sm flex items-center justify-center shrink-0">
                    <BarChart3 className="text-primary w-6 h-6" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h5 className="font-display font-black text-foreground text-xl tracking-tighter">Análisis de Variación</h5>
                    <p className="text-on-surface-variant text-sm leading-relaxed font-medium">
                      {comparisonInsight}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Overall Status Card - Redesigned for Aura Weightless */}
        <div className="xl:col-span-1">
          <Card className="h-full bg-card shadow-aura rounded-[2.5rem] overflow-hidden relative flex flex-col">
            {/* Decorative Background Icon - Standardized size and color to match others exactly */}
            <div className="absolute top-6 right-6 pointer-events-none z-0">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>

            <CardHeader className="pb-4 relative z-10 pr-16 sm:pr-20">
              <div className="flex items-center gap-4 flex-wrap">
                {/* Status Indicator */}
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center relative shrink-0",
                  isControlled ? "bg-success/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]" : "bg-destructive/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                )}>
                  <div className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center shadow-lg",
                    isControlled ? "bg-success text-white" : "bg-destructive text-white"
                  )}>
                    <Check className="w-6 h-6 stroke-[3px]" />
                  </div>
                </div>

                <Badge 
                  className="font-black px-4 py-1.5 tracking-widest"
                  variant={isControlled ? "success" : "danger"}
                >
                  {isControlled ? "CONTROLADO" : "REVISIÓN"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col gap-4 relative z-10 px-8 sm:px-10">
              <div className="space-y-4">
                <h4 className={cn(
                  "text-headline-lg font-display font-black leading-tight tracking-tighter text-balance whitespace-normal hyphens-none",
                  isControlled ? "text-foreground" : "text-destructive"
                )}>
                  {isControlled ? "Presión Controlada" : "Atención Requerida"}
                </h4>

                <div className="bg-surface-low rounded-[2rem] p-6 border border-border/10 relative shadow-sm">
                  <p className="text-base text-on-surface-variant font-black leading-relaxed">
                    {dashboard?.stats.finalAverage 
                      ? (isControlled
                          ? <>Tus promedios están dentro de los objetivos médicos recomendados (<span className="text-success font-black">135/85</span>).</>
                          : "Tus promedios superan los límites recomendados. Consulta con tu médico.")
                      : "Completa el protocolo de 5 días para obtener una evaluación precisa."}
                  </p>
                </div>

                <div className="flex justify-center items-center py-2">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/10 blur-[60px] rounded-full scale-125" />
                    <img 
                      src="/healthcare-status.png" 
                      alt="Icono médico" 
                      className="w-[160px] h-[160px] object-contain relative drop-shadow-3xl"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-2">
                <Button 
                  onClick={() => useAppStore.getState().setActiveTab('report')}
                  className="w-full h-14 sm:h-16 text-sm sm:text-base font-black tracking-tight shadow-xl shadow-primary/20"
                >
                  <FileText className="mr-2 w-5 h-5 shrink-0" />
                  Ver Informe
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* AI Analysis Banner - Full width horizontal (Stitch Redesign) */}
      <section className="mt-8 relative w-full overflow-hidden rounded-[2.5rem] signature-gradient p-8 md:p-12 lg:p-16 flex flex-col md:flex-row items-center gap-12 shadow-[0_12px_32px_rgba(103,80,165,0.08)]">
        {/* Decorative Light Blobs */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-primary-container/20 blur-[60px] rounded-full pointer-events-none" />
        
        <div className="flex-1 space-y-6 z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 ethereal-blur">
            <Sparkles className="text-white text-sm fill-current" />
            <span className="text-[10px] font-black text-white tracking-[0.2em] font-display">AURA INTELLIGENCE</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black text-white font-display tracking-tighter leading-none">
            IA Análisis
          </h1>
          
          <p className="text-lg md:text-xl text-white/80 font-medium max-w-xl leading-relaxed">
            Descubre patrones ocultos y obtén predicciones personalizadas sobre tu salud cardiovascular basadas en tu historial.
          </p>
          
          <div className="pt-4">
            <button 
              onClick={() => useAppStore.getState().setActiveTab('ai')}
              className="group whitespace-nowrap flex items-center gap-3 bg-white text-primary px-8 py-4 rounded-full font-black font-display text-sm tracking-widest transition-all hover:scale-105 hover:shadow-xl active:scale-95"
            >
              EXPLORAR AHORA
              <ArrowRight className="transition-transform group-hover:translate-x-1 shrink-0" />
            </button>
          </div>
        </div>

        <div className="flex-1 relative z-10 w-full max-w-xs sm:max-w-md aspect-square flex items-center justify-center">
          <div className="relative w-full h-full scale-[0.8] sm:scale-100">
            <div className="absolute inset-0 bg-white/5 rounded-full ethereal-blur border border-white/10 animate-pulse" />
            <div className="absolute inset-6 sm:inset-8 bg-white/10 rounded-full ethereal-blur border border-white/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.img 
                src="/IA-thinking-process.png" 
                alt="Pensamiento IA" 
                className="w-32 h-32 md:w-48 md:h-48 drop-shadow-2xl object-contain z-20"
                animate={{ 
                  scale: [1, 1.05, 1],
                  filter: [
                    "drop-shadow(0 0 15px rgba(103,80,165,0.1))",
                    "drop-shadow(0 0 45px rgba(103,80,165,0.45))",
                    "drop-shadow(0 0 15px rgba(103,80,165,0.1))"
                  ]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Intersection Reaction: Shockwave Ripple - Slower & Synced with Head (4s cycle) */}
            {[0, 1].map((index) => (
              <motion.div 
                key={index}
                className="absolute inset-0 rounded-full border-2 border-primary/30 pointer-events-none"
                animate={{ 
                  scale: [1, 1.3, 1.5],
                  opacity: [0, 0.3, 0],
                  borderWidth: ["1px", "4px", "1px"]
                }}
                transition={{ 
                  duration: 8, 
                  repeat: Infinity, 
                  ease: "easeOut",
                  delay: index * 4 // Pulsing every 4 seconds, matching the head's float cycle
                }}
              />
            ))}
            
            {/* Subtle central core heartbeat - Synced with Head */}
            <motion.div 
              className="absolute inset-0 rounded-full bg-primary/10 pointer-events-none shadow-[0_0_50px_rgba(103,80,165,0.3)]"
              animate={{ 
                scale: [0.95, 1.05, 0.95],
                opacity: [0.2, 0.5, 0.2]
              }}
              transition={{ 
                duration: 4, // Matching the head's float duration
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            />
            
            {/* Orbiting floating chips */}
            {/* Orbit 1: Stethoscope (Outer Lane - Clockwise) */}
            <motion.div 
              className="absolute inset-0 pointer-events-none rounded-full"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 43, repeat: Infinity, ease: "linear" }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
                <motion.div
                  className="bg-white/20 backdrop-blur-md p-2 md:p-3 rounded-full border border-white/30 shadow-lg"
                  animate={{ 
                    rotate: [0, -360],
                    scale: [1, 1.1, 1],
                    backgroundColor: ["rgba(255,255,255,0.2)", "rgba(103,80,165,0.3)", "rgba(255,255,255,0.2)"]
                  }}
                  transition={{ 
                    rotate: { duration: 43, repeat: Infinity, ease: "linear" },
                    scale: { duration: 7, repeat: Infinity, ease: "easeInOut" },
                    backgroundColor: { duration: 7, repeat: Infinity, ease: "easeInOut" }
                  }}
                >
                  <Stethoscope className="text-white text-lg md:text-2xl" />
                </motion.div>
              </div>
            </motion.div>
            
            {/* Orbit 2: Activity (Outer Lane - Counter-Clockwise) */}
            <motion.div 
              className="absolute inset-0 pointer-events-none rounded-full"
              animate={{ rotate: [360, 0] }}
              transition={{ duration: 59, repeat: Infinity, ease: "linear" }}
            >
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 pointer-events-auto">
                <motion.div
                  className="bg-white/20 backdrop-blur-md p-3 md:p-4 rounded-full border border-white/30 shadow-lg"
                  animate={{ 
                    rotate: [-360, 0],
                    scale: [1, 1.15, 1],
                    backgroundColor: ["rgba(255,255,255,0.2)", "rgba(103,80,165,0.3)", "rgba(255,255,255,0.2)"]
                  }}
                  transition={{ 
                    rotate: { duration: 59, repeat: Infinity, ease: "linear" },
                    scale: { duration: 9, repeat: Infinity, ease: "easeInOut" },
                    backgroundColor: { duration: 9, repeat: Infinity, ease: "easeInOut" }
                  }}
                >
                  <Activity className="text-white text-base md:text-xl" />
                </motion.div>
              </div>
            </motion.div>

            {/* Orbit 3: Heart (Inner ring - Counter-Clockwise) */}
            <motion.div 
              className="absolute inset-6 sm:inset-8 pointer-events-none rounded-full"
              animate={{ rotate: [360, 0] }}
              transition={{ duration: 31, repeat: Infinity, ease: "linear" }}
            >
              <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
                <motion.div
                  className="bg-white/20 backdrop-blur-md p-1.5 md:p-2 rounded-full border border-white/30 shadow-lg"
                  animate={{ 
                    rotate: [-360, 0],
                    scale: [1, 1.25, 1],
                    boxShadow: ["0 0 0px rgba(103,80,165,0)", "0 0 15px rgba(103,80,165,0.4)", "0 0 0px rgba(103,80,165,0)"]
                  }}
                  transition={{ 
                    rotate: { duration: 31, repeat: Infinity, ease: "linear" },
                    scale: { duration: 5, repeat: Infinity, ease: "easeInOut" },
                    boxShadow: { duration: 5, repeat: Infinity, ease: "easeInOut" }
                  }}
                >
                  <HeartPulse className="text-white" size={14} />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Evolución Temporal - BP Trend + Analysis */}
      {showTrends && (
        <section className="mt-12 grid grid-cols-1 lg:grid-cols-1 xl:grid-cols-3 gap-8 items-stretch">
          <div className="xl:col-span-2">
            <Card className="bg-white dark:bg-card border-border/50 shadow-aura-light dark:shadow-aura-dark rounded-[2rem] h-full">
              <CardHeader className="pb-2">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <CardDescription className="text-primary">PROGRESIÓN CLÍNICA</CardDescription>
                    <CardTitle className="text-2xl font-black text-foreground">Evolución de Tensión</CardTitle>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Filter Toggle */}
                    <div className="flex bg-surface-low p-1 rounded-full border border-border/50">
                      <button
                        onClick={() => setChartFilter('both')}
                        className={cn(
                          "px-4 py-1.5 text-[10px] uppercase tracking-widest font-black rounded-full transition-all duration-300",
                          chartFilter === 'both' 
                            ? "bg-primary text-white shadow-xl shadow-primary/20 scale-105" 
                            : "text-on-surface-variant hover:text-primary"
                        )}
                      >
                        Ambas
                      </button>
                      <button
                        onClick={() => setChartFilter('pas')}
                        className={cn(
                          "px-4 py-1.5 text-[10px] uppercase tracking-widest font-black rounded-full transition-all duration-300",
                          chartFilter === 'pas' 
                            ? "bg-primary text-white shadow-xl shadow-primary/20 scale-105" 
                            : "text-on-surface-variant hover:text-primary"
                        )}
                      >
                        Sistólica
                      </button>
                      <button
                        onClick={() => setChartFilter('pad')}
                        className={cn(
                          "px-4 py-1.5 text-[10px] uppercase tracking-widest font-black rounded-full transition-all duration-300",
                          chartFilter === 'pad' 
                            ? "bg-primary text-white shadow-xl shadow-primary/20 scale-105" 
                             : "text-on-surface-variant hover:text-primary"
                        )}
                      >
                        Diastólica
                      </button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-2 sm:px-6 flex flex-col gap-8">
                {/* Floating Averages */}
                <div className="flex flex-wrap gap-4 mt-4">
                  <div className="bg-surface-low rounded-2xl p-4 border border-border/30 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest">Media Sistólica</p>
                      <p className="text-xl font-display font-black text-foreground">
                        {trendData.avgSys} <span className="text-[10px] font-bold text-on-surface-variant uppercase">mmHg</span>
                      </p>
                    </div>
                  </div>
                  <div className="bg-surface-low rounded-2xl p-4 border border-border/30 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary/40" />
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest">Media Diastólica</p>
                      <p className="text-xl font-display font-black text-foreground">
                        {trendData.avgDia} <span className="text-[10px] font-bold text-on-surface-variant uppercase">mmHg</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="h-72 sm:h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={trendData.data}
                      margin={{ top: 20, right: 10, left: -20, bottom: 20 }}
                    >
                      <defs>
                        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={isDarkMode ? '#B89FFF' : '#6750A4'} stopOpacity={0.15}/>
                          <stop offset="95%" stopColor={isDarkMode ? '#B89FFF' : '#6750A4'} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#ffffff05' : '#00000005'} />
                      <XAxis 
                        dataKey="tooltipLabel" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: isDarkMode ? '#ffffff40' : '#34313A40', fontSize: 10, fontWeight: 700 }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: isDarkMode ? '#ffffff40' : '#34313A40', fontSize: 10 }} 
                        domain={['auto', 'auto']}
                      />
                      <Tooltip 
                        cursor={{ stroke: isDarkMode ? '#ffffff10' : '#34313A10', strokeWidth: 2 }}
                        content={<CustomTooltip />}
                      />
                      
                      {(chartFilter === 'both' || chartFilter === 'pas') && (
                        <Area 
                          type="monotone" 
                          dataKey="pas" 
                          stroke="var(--primary)" 
                          strokeWidth={4} 
                          fill="url(#trendGradient)"
                          animationDuration={1500}
                        />
                      )}
                      {(chartFilter === 'both' || chartFilter === 'pad') && (
                        <Area 
                          type="monotone" 
                          dataKey="pad" 
                          stroke="rgba(103, 80, 165, 0.4)" 
                          strokeWidth={2} 
                          fill="transparent"
                          animationDuration={2000}
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Complementary Metrics Footer (Fills empty space) */}
                {trendData.data.length > 0 && (
                  <div className="mt-4 pt-6 flex flex-col md:flex-row flex-wrap gap-4 items-center justify-between border-t border-border/50">
                    <div className="flex gap-4 w-full md:w-auto">
                      <div className="bg-surface-lowest px-6 py-4 rounded-3xl border border-border/40 flex-1 md:flex-none">
                        <div className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant/60 flex items-center gap-1.5 mb-1"><Target className="w-3.5 h-3.5" /> En Objetivo</div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-display font-black text-primary">{trendData.timeInTarget}%</span>
                          <span className="text-[10px] text-on-surface-variant/40 font-bold uppercase">de las tomas</span>
                        </div>
                      </div>
                      <div className="hidden sm:block bg-surface-lowest px-6 py-4 rounded-3xl border border-border/40 flex-1 md:flex-none">
                        <div className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant/60 mb-1">Rango Sistólico</div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-display font-black text-foreground">{trendData.sysMin} ~ {trendData.sysMax}</span>
                        </div>
                      </div>
                      <div className="hidden sm:block bg-surface-lowest px-6 py-4 rounded-3xl border border-border/40 flex-1 md:flex-none">
                        <div className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant/60 mb-1">Rango Diastólico</div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-display font-black text-foreground">{trendData.diaMin} ~ {trendData.diaMax}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-surface-high/50 text-on-surface-variant/60 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest">
                      <TrendingUp className="w-3 h-3" />
                      {trendData.comparisonTrend === 'up' ? 'Tendencia General al Alza' : trendData.comparisonTrend === 'down' ? 'Tendencia General a la Baja' : 'Tendencia General Estable'}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="xl:col-span-1">
            <AnalysisCard 
              title="Análisis de Tensión"
              subtitle="Diagnósticos predictivos basados en tendencias de presión."
              customImageUrl="/tension.png"
              imageSeed="medical-tension"
              statisticalAnalysis={trendData.trendAnalysis}
              aiAnalysis={aiAnalysisBp}
              isGenerating={isGeneratingBp}
              onGenerate={() => handleGenerateBpAnalysis(JSON.stringify(trendData.data.map(d => ({ date: d.date, sys: d.pas, dia: d.pad }))))}
              comparisonText={trendData.comparisonText}
              comparisonTrend={trendData.comparisonTrend}
              periodLabel={trendData.periodDaysLabel}
              icon={<Activity size={20} />}
            />
          </div>
        </section>
      )}

      {/* Dedicated Pulse Chart + Analysis */}
      {showTrends && (
        <section className="mt-8 grid grid-cols-1 lg:grid-cols-1 xl:grid-cols-3 gap-8 items-stretch">
          <div className="xl:col-span-2">
            <Card className="bg-white dark:bg-card border-border/50 shadow-aura-light dark:shadow-aura-dark rounded-[2rem] h-full">
              <CardHeader className="pb-2">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <CardDescription className="text-primary">REGISTRO CARDÍACO</CardDescription>
                    <CardTitle className="text-2xl font-black text-foreground">Evolución del Pulso</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-2 sm:px-6 flex flex-col gap-8">
                {/* Floating Averages & Max/Min */}
                <div className="flex flex-wrap gap-4 mt-4">
                  <div className="bg-surface-low rounded-2xl p-4 border border-border/30 flex items-center gap-3">
                    <div className="w-10 h-10 shrink-0 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                      <Heart className="w-5 h-5 fill-primary/20" />
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest">Media Pulso</p>
                      <p className="text-xl font-display font-black text-foreground leading-none mt-1">
                        {pulseData.avg} <span className="text-[10px] font-bold text-on-surface-variant uppercase">PPM</span>
                      </p>
                    </div>
                  </div>
                  <div className="bg-surface-low rounded-2xl p-4 border border-border/30 flex items-center gap-3">
                    <div className="w-10 h-10 shrink-0 bg-destructive/10 rounded-full flex items-center justify-center text-destructive">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest">Máximo</p>
                      <p className="text-xl font-display font-black text-foreground leading-none mt-1">
                        {pulseData.max} <span className="text-[10px] font-bold text-on-surface-variant uppercase">PPM</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="h-72 sm:h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={pulseData.data}
                      margin={{ top: 20, right: 10, left: -20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#ffffff05' : '#00000005'} />
                      <XAxis 
                        dataKey="tooltipLabel" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: isDarkMode ? '#ffffff40' : '#34313A40', fontSize: 10, fontWeight: 700 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: isDarkMode ? '#ffffff40' : '#34313A40', fontSize: 10 }} 
                        domain={[40, 140]}
                      />
                      <Tooltip 
                        cursor={{ stroke: isDarkMode ? '#ffffff10' : '#34313A10', strokeWidth: 2 }}
                        content={<CustomTooltip />}
                      />
                      
                      <Line 
                        type="monotone" 
                        dataKey="fc" 
                        name="Frecuencia Cardíaca" 
                        stroke="var(--primary)" 
                        strokeWidth={4} 
                        dot={{ r: 4, fill: 'var(--primary)', strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: 'var(--primary)', stroke: 'white', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Complementary Metrics Footer (Fills empty space) */}
                {pulseData.data.length > 0 && (
                  <div className="mt-4 pt-6 flex flex-col md:flex-row flex-wrap gap-4 items-center justify-between border-t border-border/50">
                    <div className="flex gap-4 w-full md:w-auto">
                      <div className="bg-surface-lowest px-6 py-4 rounded-3xl border border-border/40 flex-1 md:flex-none">
                        <div className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant/60 flex items-center gap-1.5 mb-1"><Target className="w-3.5 h-3.5" /> En Objetivo</div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-display font-black text-primary">{pulseData.timeInTarget}%</span>
                          <span className="text-[10px] text-on-surface-variant/40 font-bold uppercase">de las tomas</span>
                        </div>
                      </div>
                      <div className="hidden sm:block bg-surface-lowest px-6 py-4 rounded-3xl border border-border/40 flex-1 md:flex-none">
                        <div className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant/60 flex items-center gap-1.5 mb-1"><HeartPulse className="w-3.5 h-3.5" /> Rango de Pulso</div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-display font-black text-foreground">{pulseData.min} ~ {pulseData.max}</span>
                          <span className="text-[10px] ml-1 text-on-surface-variant/40 font-bold uppercase">ppm</span>
                        </div>
                      </div>
                      <div className="hidden sm:block bg-surface-lowest px-6 py-4 rounded-3xl border border-border/40 flex-1 md:flex-none">
                        <div className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant/60 flex items-center gap-1.5 mb-1"><AlertCircle className="w-3.5 h-3.5" /> Desviaciones</div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-display font-black text-warning">{pulseData.anomaliesCount}</span>
                          <span className="text-[10px] ml-1 text-on-surface-variant/40 font-bold uppercase">{pulseData.anomaliesCount === 1 ? 'registro' : 'registros'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-surface-high/50 text-on-surface-variant/60 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest">
                      <TrendingUp className="w-3 h-3" />
                      {pulseData.comparisonTrend === 'up' ? 'Ritmo Medio al Alza' : pulseData.comparisonTrend === 'down' ? 'Ritmo Medio a la Baja' : 'Ritmo Cardíaco Estable'}
                    </div>
                  </div>
                )}

              </CardContent>
            </Card>
          </div>
          <div className="xl:col-span-1">
            <AnalysisCard 
              title="Análisis de Pulso"
              subtitle="Diagnósticos predictivos basados en tendencias de frecuencia cardíaca."
              customImageUrl="/pulso.png"
              imageSeed="medical-pulse"
              statisticalAnalysis={pulseData.analysis}
              aiAnalysis={aiAnalysisPulse}
              isGenerating={isGeneratingPulse}
              onGenerate={() => handleGeneratePulseAnalysis(JSON.stringify(pulseData.data.map(d => ({ date: d.date, fc: d.fc }))))}
              comparisonText={pulseData.comparisonText}
              comparisonTrend={pulseData.comparisonTrend}
              periodLabel={pulseData.periodDaysLabel}
              icon={<Heart size={20} />}
            />
          </div>
        </section>
      )}
  </div>
);
}
