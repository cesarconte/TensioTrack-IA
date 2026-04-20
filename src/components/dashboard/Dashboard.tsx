import * as React from "react";
import { useDashboard, useReadings } from "../../lib/api";
import { useAppStore } from "../../store/useAppStore";
import { calculateBMI, getBMICategory } from "../../lib/conversions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { cn } from "../../lib/utils";
import { motion } from "motion/react";
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
  ReferenceArea
} from 'recharts';

import { getCachedAnalysis, generateAndCacheAnalysis } from '../../services/aiService';
import { toast } from 'sonner';
import { getBloodPressureStatus, getBloodPressureStyle, getPulseStatus, getPulseStyle } from "../../domain/health";
import { Sparkles, Loader2, LayoutDashboard, Plus, Info, Clock, CalendarCheck, Calendar, ChevronDown, UserCheck, BarChart3, ShieldCheck, Check, ArrowRight, BrainCircuit, Activity, Heart, TrendingUp, TrendingDown, Minus } from "lucide-react";

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
  <Card className="bg-surface-low border-none shadow-none rounded-[2.5rem] overflow-hidden h-full">
    <CardHeader className="pb-6">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest block mb-1">Visión General</span>
          <CardTitle className="text-xl font-black text-on-surface">{title}</CardTitle>
        </div>
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-sm">
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

      <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-sm">
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
          className="rounded-full px-8 py-6 bg-primary hover:bg-primary-dark text-white font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
        >
          {isGenerating ? (
            <Loader2 className="animate-spin text-[20px]" />
          ) : (
            'Generar'
          )}
        </Button>
      </div>
    </CardContent>
  </Card>
);

export function Dashboard() {
  const { data: dashboard, isLoading } = useDashboard();
  const { 
    user, 
    isDarkMode, 
    setReadingFormOpen, 
    setInfoModalOpen,
    unitSystem,
    autoBmi,
    showTrends,
    measurementFrequency
  } = useAppStore();
  const [chartFilter, setChartFilter] = React.useState<'both' | 'pas' | 'pad'>('both');
  const [chartPeriod, setChartPeriod] = React.useState<'today' | 'period' | 'week' | 'month'>('month');
  const [trendPeriod, setTrendPeriod] = React.useState<'today' | 'period' | 'week' | 'month'>('month');
  const [pulsePeriod, setPulsePeriod] = React.useState<'today' | 'period' | 'week' | 'month'>('month');
  const [finalPeriod, setFinalPeriod] = React.useState<'period' | 'fortnight' | 'month' | 'quarter' | 'semester' | 'year' | 'total'>('month');
  
  const [aiAnalysisBp, setAiAnalysisBp] = React.useState<string | null>(null);
  const [isGeneratingBp, setIsGeneratingBp] = React.useState(false);
  const [aiAnalysisPulse, setAiAnalysisPulse] = React.useState<string | null>(null);
  const [isGeneratingPulse, setIsGeneratingPulse] = React.useState(false);

  const { data: allReadings } = useReadings();

  const timeContext = React.useMemo(() => {
    const hour = new Date().getHours();
    // Spanish Custom Time slots:
    // Madrugada: 00:00 - 06:00
    // Mañana: 06:00 - 13:00
    // Tarde: 13:00 - 20:30
    // Noche: 20:30 - 23:59
    
    if (hour >= 6 && hour < 13) {
      return {
        greeting: "¡Buenos días!",
        image: "https://picsum.photos/seed/morning-warm-light/1200/400",
        message: "Comience el día con una sonrisa y salud."
      };
    } else if (hour >= 13 && hour < 20.5) {
      return {
        greeting: "¡Buenas tardes!",
        image: "https://picsum.photos/seed/afternoon-serene-landscape/1200/400",
        message: "Continúe con sus hábitos saludables hoy."
      };
    } else if (hour >= 20.5 || hour < 24) {
      return {
        greeting: "¡Buenas noches!",
        image: "https://picsum.photos/seed/night-peaceful-stars/1200/400",
        message: "Es momento de descansar y relajarse."
      };
    } else {
      return {
        greeting: "¡Hola!",
        image: "https://picsum.photos/seed/early-morning-calm/1200/400",
        message: "Bienvenido de nuevo a su seguimiento."
      };
    }
  }, []);

  React.useEffect(() => {
    const loadCachedBp = async () => {
      const cached = await getCachedAnalysis('bp', trendPeriod);
      setAiAnalysisBp(cached);
    };
    loadCachedBp();
  }, [trendPeriod]);

  React.useEffect(() => {
    const loadCachedPulse = async () => {
      const cached = await getCachedAnalysis('pulse', pulsePeriod);
      setAiAnalysisPulse(cached);
    };
    loadCachedPulse();
  }, [pulsePeriod]);

  const handleGenerateBpAnalysis = async (dataStr: string) => {
    try {
      setIsGeneratingBp(true);
      const analysis = await generateAndCacheAnalysis('bp', trendPeriod, dataStr);
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
      const analysis = await generateAndCacheAnalysis('pulse', pulsePeriod, dataStr);
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
    } else if (chartPeriod === 'week') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
      filteredReadings = allReadings.filter(r => r.date >= sevenDaysAgoStr && r.date <= todayStr);
      label = 'Registros de los últimos 7 días';
    } else if (chartPeriod === 'month') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
      filteredReadings = allReadings.filter(r => r.date >= thirtyDaysAgoStr && r.date <= todayStr);
      label = 'Registros de los últimos 30 días';
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

    if (trendPeriod === 'today') {
      filteredReadings = allReadings.filter(r => r.date === todayStr);
      label = 'Hoy';
    } else if (trendPeriod === 'period') {
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(now.getDate() - 5);
      const fiveDaysAgoStr = fiveDaysAgo.toISOString().split('T')[0];
      filteredReadings = allReadings.filter(r => r.date >= fiveDaysAgoStr && r.date <= todayStr);
      label = 'Últimos 5 días';
    } else if (trendPeriod === 'week') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
      filteredReadings = allReadings.filter(r => r.date >= sevenDaysAgoStr && r.date <= todayStr);
      label = 'Últimos 7 días';
    } else if (trendPeriod === 'month') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
      filteredReadings = allReadings.filter(r => r.date >= thirtyDaysAgoStr && r.date <= todayStr);
      label = 'Últimos 30 días';
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

    // Calculate comparison for badges
    let comparisonText = '--';
    let comparisonTrend: 'up' | 'down' | 'stable' = 'stable';
    
    const getPrevPeriodData = () => {
      const prevStart = new Date(now);
      const prevEnd = new Date(now);
      
      if (trendPeriod === 'today') {
        prevStart.setDate(now.getDate() - 1);
        prevEnd.setDate(now.getDate() - 1);
      } else if (trendPeriod === 'period') {
        prevStart.setDate(now.getDate() - 10);
        prevEnd.setDate(now.getDate() - 6);
      } else if (trendPeriod === 'week') {
        prevStart.setDate(now.getDate() - 14);
        prevEnd.setDate(now.getDate() - 8);
      } else if (trendPeriod === 'month') {
        prevStart.setDate(now.getDate() - 60);
        prevEnd.setDate(now.getDate() - 31);
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
      comparisonText = `${trendIcon} ${percent}% vs ${trendPeriod === 'today' ? 'ayer' : 'período anterior'}`;
    }

    const periodDaysLabel = trendPeriod === 'today' ? '1 día analizado' : 
                          trendPeriod === 'period' ? '5 días analizados' : 
                          trendPeriod === 'week' ? '7 días analizados' : '30 días analizados';

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

    return { data, label, avgSys: totalSys, avgDia: totalDia, trendAnalysis, comparisonText, comparisonTrend, periodDaysLabel };
  }, [allReadings, trendPeriod]);

  const pulseData = React.useMemo(() => {
    if (!allReadings) return { data: [], label: 'Sin datos', min: 0, max: 0, avg: 0, analysis: '' };

    let filteredReadings = allReadings.filter(r => r.heartRate && r.heartRate > 0);
    let label = '';
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (pulsePeriod === 'today') {
      filteredReadings = filteredReadings.filter(r => r.date === todayStr);
      label = 'Hoy';
    } else if (pulsePeriod === 'period') {
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(now.getDate() - 5);
      const fiveDaysAgoStr = fiveDaysAgo.toISOString().split('T')[0];
      filteredReadings = filteredReadings.filter(r => r.date >= fiveDaysAgoStr && r.date <= todayStr);
      label = 'Últimos 5 días';
    } else if (pulsePeriod === 'week') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
      filteredReadings = filteredReadings.filter(r => r.date >= sevenDaysAgoStr && r.date <= todayStr);
      label = 'Últimos 7 días';
    } else if (pulsePeriod === 'month') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
      filteredReadings = filteredReadings.filter(r => r.date >= thirtyDaysAgoStr && r.date <= todayStr);
      label = 'Últimos 30 días';
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

    // Calculate comparison for badges
    let comparisonText = '--';
    let comparisonTrend: 'up' | 'down' | 'stable' = 'stable';
    
    const getPrevPeriodData = () => {
      const prevStart = new Date(now);
      const prevEnd = new Date(now);
      
      if (pulsePeriod === 'today') {
        prevStart.setDate(now.getDate() - 1);
        prevEnd.setDate(now.getDate() - 1);
      } else if (pulsePeriod === 'period') {
        prevStart.setDate(now.getDate() - 10);
        prevEnd.setDate(now.getDate() - 6);
      } else if (pulsePeriod === 'week') {
        prevStart.setDate(now.getDate() - 14);
        prevEnd.setDate(now.getDate() - 8);
      } else if (pulsePeriod === 'month') {
        prevStart.setDate(now.getDate() - 60);
        prevEnd.setDate(now.getDate() - 31);
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
      comparisonText = `${trendIcon} ${percent}% vs ${pulsePeriod === 'today' ? 'ayer' : 'período anterior'}`;
    }

    const periodDaysLabel = pulsePeriod === 'today' ? '1 día analizado' : 
                          pulsePeriod === 'period' ? '5 días analizados' : 
                          pulsePeriod === 'week' ? '7 días analizados' : '30 días analizados';

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

    return { data, label, min, max, avg, analysis, comparisonText, comparisonTrend, periodDaysLabel };
  }, [allReadings, pulsePeriod]);

  const finalResultData = React.useMemo(() => {
    if (!allReadings) return { avgSys: 0, avgDia: 0, avgHr: 0, count: 0, daysCount: 0, label: 'Sin datos' };

    let filteredReadings = allReadings;
    let label = '';
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (finalPeriod === 'period') {
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(now.getDate() - 5);
      const fiveDaysAgoStr = fiveDaysAgo.toISOString().split('T')[0];
      filteredReadings = allReadings.filter(r => r.date >= fiveDaysAgoStr && r.date <= todayStr);
      label = 'Últimos 5 días';
    } else if (finalPeriod === 'fortnight') {
      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(now.getDate() - 15);
      const fifteenDaysAgoStr = fifteenDaysAgo.toISOString().split('T')[0];
      filteredReadings = allReadings.filter(r => r.date >= fifteenDaysAgoStr && r.date <= todayStr);
      label = 'Últimos 15 días';
    } else if (finalPeriod === 'month') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
      filteredReadings = allReadings.filter(r => r.date >= thirtyDaysAgoStr && r.date <= todayStr);
      label = 'Últimos 30 días';
    } else if (finalPeriod === 'quarter') {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(now.getDate() - 90);
      const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split('T')[0];
      filteredReadings = allReadings.filter(r => r.date >= ninetyDaysAgoStr && r.date <= todayStr);
      label = 'Últimos 90 días';
    } else if (finalPeriod === 'semester') {
      const semesterAgo = new Date();
      semesterAgo.setDate(now.getDate() - 180);
      const semesterAgoStr = semesterAgo.toISOString().split('T')[0];
      filteredReadings = allReadings.filter(r => r.date >= semesterAgoStr && r.date <= todayStr);
      label = 'Últimos 6 meses';
    } else if (finalPeriod === 'year') {
      const yearAgo = new Date();
      yearAgo.setDate(now.getDate() - 365);
      const yearAgoStr = yearAgo.toISOString().split('T')[0];
      filteredReadings = allReadings.filter(r => r.date >= yearAgoStr && r.date <= todayStr);
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

    return { avgSys, avgDia, avgHr, count, daysCount, label };
  }, [allReadings, finalPeriod]);

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-32 bg-surface-low rounded-[2.5rem]" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-48 bg-surface-low rounded-[2.5rem]" />
          ))}
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

  const getDiagnosticStatus = (sys?: number, dia?: number) => {
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
  };

  const finalStatus = getDiagnosticStatus(finalResultData.avgSys, finalResultData.avgDia);
  const completedSessions = dashboard?.stats.periodDays.reduce((acc, day) => acc + (day.morningAvg ? 1 : 0) + (day.eveningAvg ? 1 : 0), 0) || 0;
  const periodReadingsCount = completedSessions * 3;

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayDateStr = yesterdayDate.toISOString().split('T')[0];
  const yesterdayAvg = dashboard?.recentDailyAverages?.find(d => d.date === yesterdayDateStr);

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
            let colorClass = type === 'pas' ? "text-primary" : type === 'pad' ? "text-primary-container" : "text-warning";
            
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
                <span className={cn("text-lg font-black", colorClass)}>{value}</span>
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

  return (
    <div className="space-y-10 pb-20 sm:pb-0">
      {/* Welcome Banner with Image */}
      <section className="relative h-48 sm:h-64 rounded-[2.5rem] overflow-hidden group">
        <img 
          src={timeContext.image} 
          alt={timeContext.greeting} 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-dim/80 via-dim/40 to-transparent" />
        
        <div className="absolute inset-0 p-8 sm:p-12 flex flex-col justify-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-xl space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white">
                <LayoutDashboard className="" />
              </div>
              <span className="text-xs font-black text-white uppercase tracking-widest">Panel de Control</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-display font-black text-white tracking-tight leading-tight">
              {timeContext.greeting} <span className="text-primary-container">{user?.displayName?.split(' ')[0] || 'Paciente'}</span>
            </h2>
            <p className="text-white/80 font-medium max-w-md text-lg">
              {dashboard?.stats.isComplete 
                ? "Protocolo completado. Su informe médico está listo para ser revisado."
                : (dashboard?.stats.daysCount && dashboard.stats.daysCount > 0 
                    ? `Día ${dashboard.stats.daysCount} de 5 del protocolo AMPA. ${timeContext.message}`
                    : `Bienvenido. ${timeContext.message}`)}
            </p>
          </motion.div>
        </div>

        <div className="hidden sm:block absolute top-6 right-6">
          <Button 
            size="lg" 
            onClick={() => setReadingFormOpen(true)}
          >
            <Plus className="mr-2 text-[18px]" />
            Nueva Lectura
          </Button>
        </div>
      </section>

      {/* Mobile Floating Action Button (FAB) - MD3 Style */}
      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="sm:hidden fixed bottom-[11rem] right-4 z-50"
      >
        <Button 
          onClick={() => setReadingFormOpen(true)}
          className="w-16 h-16 rounded-3xl shadow-2xl shadow-primary/30 dark:shadow-none"
          aria-label="Nueva Lectura"
        >
          <Plus className="text-[32px]" />
        </Button>
      </motion.div>

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Level 1: Last Session */}
          <Card className="relative overflow-hidden bg-surface-low border-none rounded-[2rem] p-6 shadow-none flex flex-col min-h-[220px]">
            <div className="flex items-start justify-between mb-6">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-[16px] font-bold text-on-surface">Última Toma</h3>
                <span className="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest">
                  {latestSession?.slot === 'morning' ? 'Mañana' : latestSession?.slot === 'evening' ? 'Noche' : '--'}
                </span>
              </div>
              <Clock className="text-primary text-[20px]" />
            </div>
            <div className="flex flex-col mb-6">
              <span className="text-5xl font-black font-display text-on-surface tracking-tighter leading-none">
                {latestSession?.avgSystolic || '--'}/{latestSession?.avgDiastolic || '--'}
              </span>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1.5">mmHg</span>
            </div>
            <div className="mt-auto space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/50 rounded-xl p-2 flex flex-col items-center justify-center gap-0.5">
                  <span className="text-[8px] font-bold text-on-surface-variant tracking-widest uppercase">Lecturas</span>
                  <span className="text-sm font-black text-primary">{latestSession?.readings.length || 0} / 3</span>
                </div>
                <div className="bg-white/50 rounded-xl p-2 flex flex-col items-center justify-center gap-0.5">
                  <span className="text-[8px] font-bold text-on-surface-variant tracking-widest uppercase">Pulso Med.</span>
                  <span className="text-sm font-black text-primary">{latestSession?.avgHeartRate || '--'} <span className="text-[9px]">BPM</span></span>
                </div>
              </div>
              <div className="pt-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">Estado</span>
                  <span className={cn("text-[10px] font-black uppercase tracking-widest", latestSession?.avgSystolic ? getDiagnosticStatus(latestSession.avgSystolic, latestSession.avgDiastolic).color : 'text-on-surface-variant')}>
                    {latestSession?.avgSystolic ? getDiagnosticStatus(latestSession.avgSystolic, latestSession.avgDiastolic).label : 'Sin datos'}
                  </span>
                </div>
                <div className={cn("h-1.5 w-full rounded-full overflow-hidden", latestSession?.avgSystolic ? getDiagnosticStatus(latestSession.avgSystolic, latestSession.avgDiastolic).bg : 'bg-surface-variant/20')}>
                  <div 
                    className={cn("h-full rounded-full transition-all duration-1000", latestSession?.avgSystolic ? getDiagnosticStatus(latestSession.avgSystolic, latestSession.avgDiastolic).color.replace('text-', 'bg-') : 'bg-surface-variant/40')} 
                    style={{ width: latestSession?.avgSystolic ? `${Math.min(100, Math.max(5, ((latestSession.avgSystolic) - 90) / (160 - 90) * 100))}%` : '0%' }} 
                  />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[#825E78] font-bold text-xs pt-2 border-t border-border/50">
                <Clock className="text-[16px]" />
                <span>{sessionTimeText}</span>
              </div>
            </div>
          </Card>

          {/* Level 2: Daily */}
          <Card className="relative overflow-hidden bg-surface-low border-none rounded-[2rem] p-6 shadow-none flex flex-col min-h-[220px]">
            <div className="flex items-start justify-between mb-6">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-[16px] font-bold text-on-surface">Promedio Hoy</h3>
                <span className="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest">
                  {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                </span>
              </div>
              <CalendarCheck className="text-primary text-[20px]" />
            </div>
            <div className="flex flex-col mb-6">
              <span className="text-5xl font-black font-display text-on-surface tracking-tighter leading-none">
                {dashboard?.today?.avgSystolic || '--'}/{dashboard?.today?.avgDiastolic || '--'}
              </span>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1.5">mmHg</span>
            </div>
            <div className="space-y-2 mb-4 mt-auto">
              <div className="flex items-center justify-between bg-white/40 px-3 py-2 rounded-xl">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Mañana</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-on-surface">{morningSession?.avgSystolic || '--'}/{morningSession?.avgDiastolic || '--'}</span>
                  <span className="text-[10px] font-bold text-on-surface-variant">{morningSession?.avgHeartRate || '--'} BPM</span>
                </div>
              </div>
              <div className="flex items-center justify-between bg-white/40 px-3 py-2 rounded-xl">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Noche</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-on-surface">{eveningSession?.avgSystolic || '--'}/{eveningSession?.avgDiastolic || '--'}</span>
                  <span className="text-[10px] font-bold text-on-surface-variant">{eveningSession?.avgHeartRate || '--'} BPM</span>
                </div>
              </div>
            </div>
            <div className="mt-auto space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/50 rounded-xl p-2 flex flex-col items-center justify-center gap-0.5">
                  <span className="text-[8px] font-bold text-on-surface-variant tracking-widest uppercase">Lecturas</span>
                  <span className="text-sm font-black text-primary">{(morningSession?.readings.length || 0) + (eveningSession?.readings.length || 0)} / 6</span>
                </div>
                <div className="bg-white/50 rounded-xl p-2 flex flex-col items-center justify-center gap-0.5">
                  <span className="text-[8px] font-bold text-on-surface-variant tracking-widest uppercase">Pulso Med.</span>
                  <span className="text-sm font-black text-primary">{dashboard?.today?.avgHeartRate || '--'} <span className="text-[9px]">BPM</span></span>
                </div>
              </div>
              <div className="pt-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">Estado</span>
                  <span className={cn("text-[10px] font-black uppercase tracking-widest", dashboard?.today?.avgSystolic ? getDiagnosticStatus(dashboard.today.avgSystolic, dashboard.today.avgDiastolic).color : 'text-on-surface-variant')}>
                    {dashboard?.today?.avgSystolic ? getDiagnosticStatus(dashboard.today.avgSystolic, dashboard.today.avgDiastolic).label : 'Sin datos'}
                  </span>
                </div>
                <div className={cn("h-1.5 w-full rounded-full overflow-hidden", dashboard?.today?.avgSystolic ? getDiagnosticStatus(dashboard.today.avgSystolic, dashboard.today.avgDiastolic).bg : 'bg-surface-variant/20')}>
                  <div 
                    className={cn("h-full rounded-full transition-all duration-1000", dashboard?.today?.avgSystolic ? getDiagnosticStatus(dashboard.today.avgSystolic, dashboard.today.avgDiastolic).color.replace('text-', 'bg-') : 'bg-surface-variant/40')} 
                    style={{ width: dashboard?.today?.avgSystolic ? `${Math.min(100, Math.max(5, ((dashboard.today.avgSystolic) - 90) / (160 - 90) * 100))}%` : '0%' }} 
                  />
                </div>
              </div>
              <div className={cn("flex items-center gap-1.5 font-bold text-xs pt-2 border-t border-border/50", trendColor)}>
                {trendIcon === 'trending_up' ? <TrendingUp className="text-[16px]" /> : trendIcon === 'trending_down' ? <TrendingDown className="text-[16px]" /> : <Minus className="text-[16px]" />}
                <span>{trendText}</span>
              </div>
            </div>
          </Card>

          {/* Level 3: Period */}
          <Card className="relative overflow-hidden bg-surface-low border-none rounded-[2rem] p-6 shadow-none flex flex-col min-h-[220px]">
            <div className="flex items-start justify-between mb-6">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-[16px] font-bold text-on-surface">Media Período</h3>
                <span className="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest">Últimos 5 días</span>
              </div>
              <Calendar className="text-primary text-[20px]" />
            </div>
            <div className="flex flex-col mb-6">
              <span className="text-5xl font-black font-display text-on-surface tracking-tighter leading-none">
                {periodAvgSystolic || '--'}/{periodAvgDiastolic || '--'}
              </span>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1.5">mmHg</span>
            </div>
            <div className="space-y-2 mb-4 mt-auto">
              <div className="flex items-center justify-between bg-white/40 px-3 py-2 rounded-xl">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Mañana</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-on-surface">{dashboard?.stats.periodAverages.morning?.systolic || '--'}/{dashboard?.stats.periodAverages.morning?.diastolic || '--'}</span>
                  <span className="text-[10px] font-bold text-on-surface-variant">{dashboard?.stats.periodAverages.morning?.heartRate || '--'} BPM</span>
                </div>
              </div>
              <div className="flex items-center justify-between bg-white/40 px-3 py-2 rounded-xl">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Noche</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-on-surface">{dashboard?.stats.periodAverages.evening?.systolic || '--'}/{dashboard?.stats.periodAverages.evening?.diastolic || '--'}</span>
                  <span className="text-[10px] font-bold text-on-surface-variant">{dashboard?.stats.periodAverages.evening?.heartRate || '--'} BPM</span>
                </div>
              </div>
            </div>
            <div className="mt-auto space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/50 rounded-xl p-2 flex flex-col items-center justify-center gap-0.5">
                  <span className="text-[8px] font-bold text-on-surface-variant tracking-widest uppercase">Lecturas</span>
                  <span className="text-sm font-black text-primary">{periodReadingsCount} / 30</span>
                </div>
                <div className="bg-white/50 rounded-xl p-2 flex flex-col items-center justify-center gap-0.5">
                  <span className="text-[8px] font-bold text-on-surface-variant tracking-widest uppercase">Pulso Med.</span>
                  <span className="text-sm font-black text-primary">{dashboard?.stats.finalAverage?.heartRate || '--'} <span className="text-[9px]">BPM</span></span>
                </div>
              </div>
              <div className="pt-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">Estado</span>
                  <span className={cn("text-[10px] font-black uppercase tracking-widest", periodAvgSystolic ? getDiagnosticStatus(periodAvgSystolic, periodAvgDiastolic).color : 'text-on-surface-variant')}>
                    {periodAvgSystolic ? getDiagnosticStatus(periodAvgSystolic, periodAvgDiastolic).label : 'Sin datos'}
                  </span>
                </div>
                <div className={cn("h-1.5 w-full rounded-full overflow-hidden", periodAvgSystolic ? getDiagnosticStatus(periodAvgSystolic, periodAvgDiastolic).bg : 'bg-surface-variant/20')}>
                  <div 
                    className={cn("h-full rounded-full transition-all duration-1000", periodAvgSystolic ? getDiagnosticStatus(periodAvgSystolic, periodAvgDiastolic).color.replace('text-', 'bg-') : 'bg-surface-variant/40')} 
                    style={{ width: periodAvgSystolic ? `${Math.min(100, Math.max(5, ((periodAvgSystolic) - 90) / (160 - 90) * 100))}%` : '0%' }} 
                  />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-on-surface-variant font-bold text-xs pt-2 border-t border-border/50">
                <Info className="text-[16px]" />
                <span>Últimos 5 días</span>
              </div>
            </div>
          </Card>

          {/* Level 4: Final */}
          <Card className="relative overflow-hidden bg-surface-low border-none rounded-[2rem] p-6 shadow-none flex flex-col min-h-[220px]">
            <div className="flex items-start justify-between mb-6">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-[16px] font-bold text-on-surface">Resultado AMPA</h3>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-widest">
                    {finalPeriod === 'period' ? 'Último Período' : finalResultData.label}
                  </span>
                  <div className="h-1 w-1 rounded-full bg-on-surface-variant/30" />
                  <div className="relative flex items-center group">
                    <select 
                      value={finalPeriod}
                      onChange={(e) => setFinalPeriod(e.target.value as any)}
                      className="bg-transparent border-none text-[10px] font-black text-on-surface uppercase tracking-widest focus:ring-0 outline-none cursor-pointer appearance-none pr-4 z-10"
                    >
                      <option value="period">5 Días</option>
                      <option value="fortnight">15 Días</option>
                      <option value="month">Mes</option>
                      <option value="quarter">Trimestre</option>
                      <option value="semester">Semestre</option>
                      <option value="year">Año</option>
                      <option value="total">Total</option>
                    </select>
                    <ChevronDown className="absolute right-0 text-[14px] text-primary pointer-events-none transition-transform group-hover:translate-y-0.5" />
                  </div>
                </div>
              </div>
              <UserCheck className="text-primary text-[20px]" />
            </div>
            <div className="flex flex-col mb-6">
              <span className="text-5xl font-black font-display text-on-surface tracking-tighter leading-none">
                {finalResultData.avgSys || '--'}/{finalResultData.avgDia || '--'}
              </span>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1.5">mmHg</span>
            </div>
            <div className="mt-auto space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/50 rounded-xl p-2 flex flex-col items-center justify-center gap-0.5">
                  <span className="text-[8px] font-bold text-on-surface-variant tracking-widest uppercase">Lecturas</span>
                  <span className="text-sm font-black text-primary">
                    {finalResultData.count}
                  </span>
                </div>
                <div className="bg-white/50 rounded-xl p-2 flex flex-col items-center justify-center gap-0.5">
                  <span className="text-[8px] font-bold text-on-surface-variant tracking-widest uppercase">Pulso Med.</span>
                  <span className="text-sm font-black text-primary">
                    {finalResultData.avgHr || '--'} <span className="text-[9px]">BPM</span>
                  </span>
                </div>
              </div>
              <div className="pt-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">Estado</span>
                  <span className={cn("text-[10px] font-black uppercase tracking-widest", finalResultData.avgSys ? finalStatus.color : 'text-on-surface-variant')}>
                    {finalResultData.avgSys ? finalStatus.label : 'Sin datos'}
                  </span>
                </div>
                <div className={cn("h-1.5 w-full rounded-full overflow-hidden", finalResultData.avgSys ? finalStatus.bg : 'bg-surface-variant/20')}>
                  <div 
                    className={cn("h-full rounded-full transition-all duration-1000", finalResultData.avgSys ? finalStatus.color.replace('text-', 'bg-') : 'bg-surface-variant/40')} 
                    style={{ width: finalResultData.avgSys ? `${Math.min(100, Math.max(5, ((finalResultData.avgSys) - 90) / (160 - 90) * 100))}%` : '0%' }} 
                  />
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-on-surface-variant font-bold text-xs pt-2 border-t border-border/50">
                <Calendar className="text-[16px]" />
                <span>{finalResultData.daysCount} {finalResultData.daysCount === 1 ? 'día analizado' : 'días analizados'}</span>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Charts & Status Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="h-full bg-surface-low border-none shadow-none rounded-[2rem]">
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl font-bold text-on-surface">Comparativa Mañana vs Noche</CardTitle>
                  <CardDescription className="text-on-surface-variant text-sm mt-1">{chartData.label}</CardDescription>
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
                    onClick={() => setChartPeriod('week')}
                    className={cn("px-4 py-1.5 text-xs font-bold rounded-full transition-colors", chartPeriod === 'week' ? "bg-primary text-white shadow-sm" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-high")}
                  >
                    1S
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
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EADDFF" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={(props) => {
                        const { x, y, payload } = props;
                        const item = payload.value === 'Mañana' ? { name: 'Mañana', time: '08:00 AM' } : { name: 'Noche', time: '10:30 PM' };
                        return (
                          <g transform={`translate(${x},${y})`}>
                            <text x={0} y={15} dy={0} textAnchor="middle" fill="#2D2A32" fontSize={14} fontWeight={700}>{item.name}</text>
                            <text x={0} y={35} dy={0} textAnchor="middle" fill="#79747E" fontSize={12}>{item.time}</text>
                          </g>
                        );
                      }}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#79747E', fontSize: 12 }} />
                    <Tooltip 
                      cursor={{ fill: '#EADDFF', opacity: 0.4 }}
                      contentStyle={{ 
                        borderRadius: '1.5rem', 
                        border: 'none', 
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                        backgroundColor: '#fff',
                      }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      align="right"
                      iconType="circle" 
                      wrapperStyle={{ paddingBottom: '20px', fontSize: '12px', fontWeight: 600, color: '#49454F', textTransform: 'uppercase' }} 
                    />
                    <Bar dataKey="pas" name="Sistólica" fill="#5E4B9C" radius={[8, 8, 0, 0]} barSize={48} />
                    <Bar dataKey="pad" name="Diastólica" fill="#B39DFF" radius={[8, 8, 0, 0]} barSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Comparison Insight */}
              {morningPas > 0 && eveningPas > 0 && (
                <div className="mt-8 p-6 rounded-[2rem] bg-white flex flex-col sm:flex-row items-start gap-5 shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-[#F0B8D8] flex items-center justify-center shrink-0">
                    <BarChart3 className="text-[#4F378B] text-[20px]" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h5 className="font-bold text-[#2D2A32] text-lg">Análisis de Variación</h5>
                    <p className="text-[#49454F] text-sm leading-relaxed">
                      {comparisonInsight}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Overall Status Card - Redesigned as a remix of Stitch designs */}
        <div className="lg:col-span-1">
          <Card className="h-full bg-surface-low border-none shadow-none rounded-[2.5rem] overflow-hidden relative flex flex-col">
            {/* Shield Icon (Image 2 style) - Gray Tone with Check */}
            <div className="absolute top-8 right-8 pointer-events-none text-[#4F378B]/20">
              <ShieldCheck className="text-[52px] font-variation-fill" />
            </div>

            <CardHeader className="pb-4 relative z-10">
              <div className="flex items-center gap-3">
                {/* Status Indicator (Image 3 style remix) */}
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center relative shrink-0",
                  isControlled ? "bg-success/10" : "bg-destructive/10"
                )}>
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shadow-sm",
                    isControlled ? "bg-success text-white" : "bg-destructive text-white"
                  )}>
                    <Check className="text-[20px]" />
                  </div>
                  {/* Outer Ring */}
                  <div className={cn(
                    "absolute inset-0 rounded-full border-4 opacity-20",
                    isControlled ? "border-success" : "border-destructive"
                  )} />
                </div>

                {/* Status Pill (Image 3 style) */}
                <div className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm",
                  isControlled ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                )}>
                  {isControlled ? "Controlado" : "Revisión"}
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col gap-6 relative z-10">
              <div className="space-y-4">
                <h4 className={cn(
                  "text-3xl font-display font-black leading-tight",
                  isControlled ? "text-on-surface" : "text-destructive"
                )}>
                  {isControlled ? "Presión Controlada" : "Atención Requerida"}
                </h4>

                {/* Description Box (Image 2 style) */}
                <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-5 border border-white/40 shadow-sm relative">
                  <p className="text-sm text-on-surface-variant font-medium leading-relaxed">
                    {dashboard?.stats.finalAverage 
                      ? (isControlled
                          ? <>Tus promedios están dentro de los objetivos médicos recomendados (<span className="text-success font-bold">135/85</span>).</>
                          : "Tus promedios superan los límites recomendados. Consulta con tu médico.")
                      : "Completa el protocolo de 5 días para obtener una evaluación precisa."}
                  </p>
                </div>

                {/* Medical Cross Icon (Image 1 style) - Positioned BELOW the description box */}
                <div className="flex justify-center items-center py-4">
                  <img 
                    src="/healthcare-status-icon.png" 
                    alt="Icono médico" 
                    className="w-[120px] h-[120px] object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              <div className="mt-auto pt-4 flex flex-col gap-3">
                <Button 
                  onClick={() => useAppStore.getState().setActiveTab('report')}
                  className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl py-6 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Ver Informe Detallado
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
              className="group flex items-center gap-3 bg-white text-primary px-8 py-4 rounded-full font-black font-display text-sm tracking-widest transition-all hover:scale-105 hover:shadow-xl active:scale-95"
            >
              EXPLORAR AHORA
              <ArrowRight className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        <div className="flex-1 relative z-10 w-full max-w-md aspect-square flex items-center justify-center">
          <div className="relative w-full h-full">
            <div className="absolute inset-0 bg-white/5 rounded-full ethereal-blur border border-white/10 animate-pulse" />
            <div className="absolute inset-8 bg-white/10 rounded-full ethereal-blur border border-white/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <img 
                src="/mental-process-icon.png" 
                alt="Proceso mental" 
                className="w-48 h-48 drop-shadow-2xl"
                referrerPolicy="no-referrer"
              />
            </div>
            
            {/* Small orbiting floating chips */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-10 right-0 bg-white/20 backdrop-blur-md p-3 rounded-2xl border border-white/30 shadow-lg"
            >
              <BrainCircuit className="text-white text-2xl" />
            </motion.div>
            
            <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-10 left-0 bg-white/20 backdrop-blur-md p-3 rounded-2xl border border-white/30 shadow-lg"
            >
              <Activity className="text-white" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Evolución Temporal - BP Trend + Analysis */}
      {showTrends && (
        <section className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="bg-surface-low border-none shadow-none rounded-[2rem] h-full">
              <CardHeader className="pb-2">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl font-bold text-on-surface">Evolución Temporal</CardTitle>
                    <CardDescription className="text-on-surface-variant text-sm mt-1">Seguimiento de tendencias de presión arterial ({trendData.label})</CardDescription>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Filter Toggle */}
                    <div className="flex bg-surface p-1 rounded-full border border-border">
                      <button
                        onClick={() => setChartFilter('both')}
                        className={cn(
                          "px-4 py-1.5 text-xs font-bold rounded-full transition-colors",
                          chartFilter === 'both' 
                            ? "bg-primary text-white shadow-sm" 
                            : "text-on-surface-variant hover:text-on-surface hover:bg-surface-high"
                        )}
                      >
                        Ambas
                      </button>
                      <button
                        onClick={() => setChartFilter('pas')}
                        className={cn(
                          "px-4 py-1.5 text-xs font-bold rounded-full transition-colors",
                          chartFilter === 'pas' 
                            ? "bg-primary text-white shadow-sm" 
                            : "text-on-surface-variant hover:text-on-surface hover:bg-surface-high"
                        )}
                      >
                        Sistólica
                      </button>
                      <button
                        onClick={() => setChartFilter('pad')}
                        className={cn(
                          "px-4 py-1.5 text-xs font-bold rounded-full transition-colors",
                          chartFilter === 'pad' 
                            ? "bg-primary text-white shadow-sm" 
                             : "text-on-surface-variant hover:text-on-surface hover:bg-surface-high"
                        )}
                      >
                        Diastólica
                      </button>
                    </div>

                    {/* Period Toggle */}
                    <div className="flex bg-surface p-1 rounded-full border border-border">
                      <button 
                        onClick={() => setTrendPeriod('today')}
                        className={cn("px-4 py-1.5 text-xs font-bold rounded-full transition-colors", trendPeriod === 'today' ? "bg-primary text-white shadow-sm" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-high")}
                      >
                        1D
                      </button>
                      <button 
                        onClick={() => setTrendPeriod('period')}
                        className={cn("px-4 py-1.5 text-xs font-bold rounded-full transition-colors", trendPeriod === 'period' ? "bg-primary text-white shadow-sm" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-high")}
                      >
                        5D
                      </button>
                      <button 
                        onClick={() => setTrendPeriod('week')}
                        className={cn("px-4 py-1.5 text-xs font-bold rounded-full transition-colors", trendPeriod === 'week' ? "bg-primary text-white shadow-sm" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-high")}
                      >
                        1S
                      </button>
                      <button 
                        onClick={() => setTrendPeriod('month')}
                        className={cn("px-4 py-1.5 text-xs font-bold rounded-full transition-colors", trendPeriod === 'month' ? "bg-primary text-white shadow-sm" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-high")}
                      >
                        1M
                      </button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-2 sm:px-6 flex flex-col gap-6">
                {/* Floating Averages */}
                <div className="flex flex-wrap gap-4 mt-2">
                  <div className="bg-white/80 backdrop-blur-md rounded-2xl p-3 shadow-sm border border-white/20 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <div>
                      <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest">Promedio Sistólica</p>
                      <p className="text-xl font-bold text-on-surface leading-none mt-1">
                        {trendData.avgSys} <span className="text-xs font-medium text-on-surface-variant">mmHg</span>
                      </p>
                    </div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-md rounded-2xl p-3 shadow-sm border border-white/20 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary-container" />
                    <div>
                      <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest">Promedio Diastólica</p>
                      <p className="text-xl font-bold text-on-surface leading-none mt-1">
                        {trendData.avgDia} <span className="text-xs font-medium text-on-surface-variant">mmHg</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="h-72 sm:h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={trendData.data}
                      margin={{ top: 20, right: 10, left: -20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis 
                        dataKey="tooltipLabel" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'var(--on-surface-variant)', fontSize: 12, fontWeight: 700 }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'var(--on-surface-variant)', fontSize: 10 }} 
                        domain={['auto', 'auto']}
                      />
                      <Tooltip 
                        cursor={{ stroke: 'var(--border)', strokeWidth: 2, strokeDasharray: '5 5' }}
                        content={<CustomTooltip />}
                      />
                      <Legend content={() => null} />
                      
                      {/* Normal Ranges */}
                      {(chartFilter === 'both' || chartFilter === 'pas') && (
                        <ReferenceArea 
                          y1={100} 
                          y2={129} 
                          fill="var(--surface-high)" 
                          fillOpacity={0.4} 
                          ifOverflow="extendDomain"
                        />
                      )}
                      {(chartFilter === 'both' || chartFilter === 'pad') && (
                        <ReferenceArea 
                          y1={60} 
                          y2={79} 
                          fill="var(--surface-high)" 
                          fillOpacity={0.6} 
                          ifOverflow="extendDomain"
                        />
                      )}

                      {(chartFilter === 'both' || chartFilter === 'pas') && (
                        <Line 
                          type="monotone" 
                          dataKey="pas" 
                          name="Sistólica (PAS)" 
                          stroke="var(--primary)" 
                          strokeWidth={3} 
                          dot={false}
                          activeDot={(props) => renderCustomDot(props, 'pas')}
                        />
                      )}
                      {(chartFilter === 'both' || chartFilter === 'pad') && (
                        <Line 
                          type="monotone" 
                          dataKey="pad" 
                          name="Diastólica (PAD)" 
                          stroke="var(--primary-container)" 
                          strokeWidth={3} 
                          dot={false}
                          activeDot={(props) => renderCustomDot(props, 'pad')}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1">
            <AnalysisCard 
              title="Análisis de Tensión"
              subtitle="Obtén diagnósticos predictivos basados en tus tendencias de presión."
              imageSeed="medical-bp"
              customImageUrl="/tension.png"
              statisticalAnalysis={trendData.trendAnalysis}
              aiAnalysis={aiAnalysisBp}
              isGenerating={isGeneratingBp}
              onGenerate={() => handleGenerateBpAnalysis(JSON.stringify(trendData.data.map(d => ({ date: d.date, sys: d.pas, dia: d.pad }))))}
              comparisonText={trendData.comparisonText}
              comparisonTrend={trendData.comparisonTrend}
              periodLabel={trendData.periodDaysLabel}
              icon="analytics"
            />
          </div>
        </section>
      )}

      {/* Dedicated Pulse Chart + Analysis */}
      {showTrends && (
        <section className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="bg-white border-none shadow-none rounded-[2rem] h-full">
              <CardHeader className="pb-2">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl font-bold text-on-surface">Evolución del Pulso</CardTitle>
                    <CardDescription className="text-on-surface-variant text-sm mt-1">Frecuencia cardíaca diaria ({pulseData.label})</CardDescription>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Period Toggle */}
                    <div className="flex bg-surface p-1 rounded-full border border-border">
                      <button 
                        onClick={() => setPulsePeriod('today')}
                        className={cn("px-4 py-1.5 text-xs font-bold rounded-full transition-colors", pulsePeriod === 'today' ? "bg-primary text-white shadow-sm" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-high")}
                      >
                        1D
                      </button>
                      <button 
                        onClick={() => setPulsePeriod('period')}
                        className={cn("px-4 py-1.5 text-xs font-bold rounded-full transition-colors", pulsePeriod === 'period' ? "bg-primary text-white shadow-sm" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-high")}
                      >
                        5D
                      </button>
                      <button 
                        onClick={() => setPulsePeriod('week')}
                        className={cn("px-4 py-1.5 text-xs font-bold rounded-full transition-colors", pulsePeriod === 'week' ? "bg-primary text-white shadow-sm" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-high")}
                      >
                        1S
                      </button>
                      <button 
                        onClick={() => setPulsePeriod('month')}
                        className={cn("px-4 py-1.5 text-xs font-bold rounded-full transition-colors", pulsePeriod === 'month' ? "bg-primary text-white shadow-sm" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-high")}
                      >
                        1M
                      </button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-2 sm:px-6 flex flex-col gap-6">
                {/* Floating Averages & Max/Min */}
                <div className="flex flex-wrap gap-4 mt-2">
                  <div className="bg-surface-low rounded-2xl p-3 shadow-sm border border-border flex items-center gap-3">
                    <div className="w-8 h-8 shrink-0 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                      <Heart className="text-[18px]" />
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest">Pulso Promedio</p>
                      <p className="text-xl font-bold text-on-surface leading-none mt-1">
                        {pulseData.avg} <span className="text-xs font-medium text-on-surface-variant">PPM</span>
                      </p>
                    </div>
                  </div>
                  <div className="bg-surface-low rounded-2xl p-3 shadow-sm border border-border flex items-center gap-3">
                    <div className="w-8 h-8 shrink-0 bg-destructive/10 rounded-xl flex items-center justify-center text-destructive">
                      <TrendingUp className="text-[18px]" />
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest">Máximo</p>
                      <p className="text-xl font-bold text-on-surface leading-none mt-1">
                        {pulseData.max} <span className="text-xs font-medium text-on-surface-variant">PPM</span>
                      </p>
                    </div>
                  </div>
                  <div className="bg-surface-low rounded-2xl p-3 shadow-sm border border-border flex items-center gap-3">
                    <div className="w-8 h-8 shrink-0 bg-primary-container/10 rounded-xl flex items-center justify-center text-primary-container">
                      <TrendingDown className="text-[18px]" />
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest">Mínimo</p>
                      <p className="text-xl font-bold text-on-surface leading-none mt-1">
                        {pulseData.min} <span className="text-xs font-medium text-on-surface-variant">PPM</span>
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
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis 
                        dataKey="tooltipLabel" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'var(--on-surface-variant)', fontSize: 12, fontWeight: 700 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'var(--on-surface-variant)', fontSize: 10 }} 
                        domain={[40, 140]}
                      />
                      <Tooltip 
                        cursor={{ stroke: 'var(--border)', strokeWidth: 2, strokeDasharray: '5 5' }}
                        content={<CustomTooltip />}
                      />
                      
                      {/* Normal Ranges */}
                      <ReferenceArea 
                        y1={60} 
                        y2={100} 
                        fill="var(--surface-low)" 
                        fillOpacity={0.6} 
                        ifOverflow="extendDomain"
                      />

                      <ReferenceLine y={100} stroke="#EF4444" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'TAQUICARDIA >100', fill: '#EF4444', fontSize: 10, fontWeight: 800, opacity: 0.8 }} />
                      <ReferenceLine y={60} stroke="#06B6D4" strokeDasharray="3 3" label={{ position: 'insideBottomLeft', value: 'BRADICARDIA <60', fill: '#06B6D4', fontSize: 10, fontWeight: 800, opacity: 0.8 }} />
                      
                      <Line 
                        type="monotone" 
                        dataKey="fc" 
                        name="Frecuencia Cardíaca" 
                        stroke="var(--primary)" 
                        strokeWidth={4} 
                        dot={{ r: 4, fill: 'var(--primary)', strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: 'var(--primary)', stroke: 'white', strokeWidth: 2 }}
                        label={{ position: 'top', fill: 'var(--on-surface-variant)', fontSize: 10, fontWeight: 700, dy: -10 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1">
            <AnalysisCard 
              title="Análisis de Pulso"
              subtitle="Obtén diagnósticos predictivos basados en tus tendencias de frecuencia cardíaca."
              imageSeed="medical-pulse"
              customImageUrl="/pulso.png"
              statisticalAnalysis={pulseData.analysis}
              aiAnalysis={aiAnalysisPulse}
              isGenerating={isGeneratingPulse}
              onGenerate={() => handleGeneratePulseAnalysis(JSON.stringify(pulseData.data.map(d => ({ date: d.date, fc: d.fc }))))}
              comparisonText={pulseData.comparisonText}
              comparisonTrend={pulseData.comparisonTrend}
              periodLabel={pulseData.periodDaysLabel}
              icon="bar_chart"
            />
          </div>
        </section>
      )}
  </div>
);
}
