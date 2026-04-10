import * as React from "react";
import { useDashboard } from "../../lib/api";
import { useAppStore } from "../../store/useAppStore";
import { 
  Activity, 
  AlertCircle, 
  CheckCircle2,
  Plus,
  Info,
  TrendingUp,
  Clock,
  Calendar,
  AlertTriangle
} from "lucide-react";
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

export function Dashboard() {
  const { data: dashboard, isLoading } = useDashboard();
  const { user, isDarkMode, setReadingFormOpen, setInfoModalOpen } = useAppStore();
  const [chartFilter, setChartFilter] = React.useState<'both' | 'pas' | 'pad'>('both');

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem]" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem]" />
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

  const renderCustomDot = (props: any, type: 'pas' | 'pad') => {
    const { cx, cy, value, payload } = props;
    if (cx == null || cy == null) return null;
    
    let stroke = type === 'pas' ? "#4f46e5" : "#818cf8";
    let fill = isDarkMode ? "#1e293b" : "#ffffff";
    
    if (type === 'pas') {
      if (value >= 135) { stroke = "#f43f5e"; fill = isDarkMode ? "#881337" : "#fff1f2"; }
      else if (value >= 130) { stroke = "#f59e0b"; fill = isDarkMode ? "#78350f" : "#fffbeb"; }
      else if (value < 100) { stroke = "#0ea5e9"; fill = isDarkMode ? "#0c4a6e" : "#f0f9ff"; }
    } else {
      if (value >= 85) { stroke = "#f43f5e"; fill = isDarkMode ? "#881337" : "#fff1f2"; }
      else if (value >= 80) { stroke = "#f59e0b"; fill = isDarkMode ? "#78350f" : "#fffbeb"; }
      else if (value < 60) { stroke = "#0ea5e9"; fill = isDarkMode ? "#0c4a6e" : "#f0f9ff"; }
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
          "p-4 rounded-2xl shadow-xl border",
          isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"
        )}>
          <p className="text-xs font-bold mb-3 text-slate-400 uppercase tracking-widest">{label}</p>
          {payload.map((entry: any, index: number) => {
            const type = entry.dataKey;
            const value = entry.value;
            let colorClass = type === 'pas' ? "text-indigo-600 dark:text-indigo-400" : "text-indigo-400 dark:text-indigo-300";
            
            if (type === 'pas') {
              if (value >= 135) colorClass = "text-rose-600 dark:text-rose-400";
              else if (value >= 130) colorClass = "text-amber-500 dark:text-amber-400";
              else if (value < 100) colorClass = "text-sky-500 dark:text-sky-400";
            } else if (type === 'pad') {
              if (value >= 85) colorClass = "text-rose-600 dark:text-rose-400";
              else if (value >= 80) colorClass = "text-amber-500 dark:text-amber-400";
              else if (value < 60) colorClass = "text-sky-500 dark:text-sky-400";
            }

            return (
              <div key={index} className="flex items-center justify-between gap-6 py-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{entry.name}</span>
                <span className={cn("text-lg font-black", colorClass)}>{value}</span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const morningPas = dashboard?.stats.periodAverages.morning?.systolic || 0;
  const eveningPas = dashboard?.stats.periodAverages.evening?.systolic || 0;
  const morningPad = dashboard?.stats.periodAverages.morning?.diastolic || 0;
  const eveningPad = dashboard?.stats.periodAverages.evening?.diastolic || 0;

  const pasDiff = morningPas - eveningPas;
  const absDiff = Math.abs(pasDiff);

  let comparisonInsight = "";
  let comparisonColor = "text-slate-600 dark:text-slate-400";
  let comparisonBg = "bg-slate-50 dark:bg-slate-900/50";
  let comparisonBorder = "border-slate-100 dark:border-slate-800/50";
  let ComparisonIcon = Info;
  let diffLabel = "";

  if (morningPas > 0 && eveningPas > 0) {
    if (pasDiff > 20) {
      comparisonInsight = "Pico matutino elevado. La tensión por la mañana es significativamente mayor, lo cual es un factor de riesgo cardiovascular. Consulta con tu médico.";
      comparisonColor = "text-rose-700 dark:text-rose-400";
      comparisonBg = "bg-rose-50 dark:bg-rose-900/10";
      comparisonBorder = "border-rose-200 dark:border-rose-800/30";
      ComparisonIcon = AlertTriangle;
      diffLabel = `+${Math.round(pasDiff)} mmHg en la mañana`;
    } else if (pasDiff > 10) {
      comparisonInsight = "Tensión matutina moderadamente más alta. Vigila esta tendencia y coméntalo en tu próxima revisión médica.";
      comparisonColor = "text-amber-700 dark:text-amber-400";
      comparisonBg = "bg-amber-50 dark:bg-amber-900/10";
      comparisonBorder = "border-amber-200 dark:border-amber-800/30";
      ComparisonIcon = AlertTriangle;
      diffLabel = `+${Math.round(pasDiff)} mmHg en la mañana`;
    } else if (pasDiff < -10) {
      comparisonInsight = "Patrón invertido. La tensión es más alta por la noche. Es importante que tu médico valore este patrón.";
      comparisonColor = "text-indigo-700 dark:text-indigo-400";
      comparisonBg = "bg-indigo-50 dark:bg-indigo-900/10";
      comparisonBorder = "border-indigo-200 dark:border-indigo-800/30";
      ComparisonIcon = Info;
      diffLabel = `+${Math.round(absDiff)} mmHg en la noche`;
    } else {
      comparisonInsight = "Patrón estable. La variación entre la mañana y la noche está dentro de los parámetros normales.";
      comparisonColor = "text-emerald-700 dark:text-emerald-400";
      comparisonBg = "bg-emerald-50 dark:bg-emerald-900/10";
      comparisonBorder = "border-emerald-200 dark:border-emerald-800/30";
      ComparisonIcon = CheckCircle2;
      diffLabel = `Variación mínima (${Math.round(absDiff)} mmHg)`;
    }
  } else {
    comparisonInsight = "Faltan datos para comparar. Completa las mediciones de mañana y noche.";
  }

  return (
    <div className="space-y-10 pb-20 sm:pb-0">
      {/* Welcome & Action */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-display font-black text-slate-900 dark:text-white">
            Bienvenido, <span className="text-indigo-600">{user?.displayName?.split(' ')[0] || 'Paciente'}</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {dashboard?.stats.isComplete 
              ? "Has completado el protocolo de 5 días. Revisa tu informe médico."
              : `Día ${dashboard?.stats.daysCount || 0} de 5 del protocolo AMPA.`}
          </p>
        </div>
        <Button 
          size="lg" 
          onClick={() => setReadingFormOpen(true)}
          className="shadow-xl shadow-indigo-200 dark:shadow-none h-14 px-8 rounded-2xl"
        >
          <Plus className="w-5 h-5" />
          Nueva Lectura
        </Button>
      </section>

      {/* 4-Level Analysis Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-display font-black text-xl text-slate-900 dark:text-white uppercase tracking-tight">Análisis de 4 Niveles</h3>
          </div>
          <button 
            onClick={() => setInfoModalOpen(true)}
            className="text-slate-400 hover:text-indigo-600 transition-colors"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Level 1: Last Session */}
          <Card className="relative overflow-hidden group hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-500">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] font-black uppercase tracking-widest">Nivel 1 • Sesión</CardDescription>
              <CardTitle className="text-sm font-bold">Última Toma</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-display font-black text-slate-900 dark:text-white">
                  {latestSession?.avgSystolic || '--'}
                </span>
                <span className="text-lg font-bold text-slate-300">/</span>
                <span className="text-2xl font-display font-black text-slate-500 dark:text-slate-400">
                  {latestSession?.avgDiastolic || '--'}
                </span>
                <span className="ml-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">mmHg</span>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
                  {latestSession?.slot === 'morning' ? 'Mañana' : 'Noche'}
                </Badge>
                <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <Clock className="w-3 h-3" />
                  {latestSession?.completedAt ? new Date(latestSession.completedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Level 2: Daily */}
          <Card className="relative overflow-hidden group hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-500">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] font-black uppercase tracking-widest">Nivel 2 • Diario</CardDescription>
              <CardTitle className="text-sm font-bold">Promedio Hoy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-display font-black text-slate-900 dark:text-white">
                  {dashboard?.today?.avgSystolic || '--'}
                </span>
                <span className="text-lg font-bold text-slate-300">/</span>
                <span className="text-2xl font-display font-black text-slate-500 dark:text-slate-400">
                  {dashboard?.today?.avgDiastolic || '--'}
                </span>
              </div>
              
              <div className="mt-4 space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mañana</span>
                  <span className="text-xs font-display font-black text-slate-700 dark:text-slate-300">
                    {morningSession?.avgSystolic || '--'}/{morningSession?.avgDiastolic || '--'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Noche</span>
                  <span className="text-xs font-display font-black text-slate-700 dark:text-slate-300">
                    {eveningSession?.avgSystolic || '--'}/{eveningSession?.avgDiastolic || '--'}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5, 6].map((i) => {
                    const totalReadings = (morningSession?.readings.length || 0) + (eveningSession?.readings.length || 0);
                    return (
                      <div 
                        key={i} 
                        className={cn(
                          "w-2 h-2 rounded-full transition-colors",
                          i <= totalReadings ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"
                        )} 
                      />
                    );
                  })}
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {(morningSession?.readings.length || 0) + (eveningSession?.readings.length || 0)}/6 Tomas
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Level 3: Period */}
          <Card className="relative overflow-hidden group hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-500">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] font-black uppercase tracking-widest">Nivel 3 • Período</CardDescription>
              <CardTitle className="text-sm font-bold">Promedio 5 Días</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mañana</span>
                  <span className="text-sm font-display font-black text-slate-900 dark:text-white">
                    {dashboard?.stats.periodAverages.morning?.systolic || '--'}/{dashboard?.stats.periodAverages.morning?.diastolic || '--'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Noche</span>
                  <span className="text-sm font-display font-black text-slate-900 dark:text-white">
                    {dashboard?.stats.periodAverages.evening?.systolic || '--'}/{dashboard?.stats.periodAverages.evening?.diastolic || '--'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Level 4: Final */}
          <Card className={cn(
            "relative overflow-hidden border-2 transition-all duration-500",
            !isControlled
              ? "border-rose-100 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-900/5"
              : "border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-900/5"
          )}>
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] font-black uppercase tracking-widest">Nivel 4 • Final</CardDescription>
              <CardTitle className="text-sm font-bold">Resultado AMPA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1">
                <span className={cn(
                  "text-4xl font-display font-black",
                  !isControlled ? "text-rose-600" : "text-emerald-600"
                )}>
                  {dashboard?.stats.finalAverage?.systolic || '--'}
                </span>
                <span className="text-lg font-bold text-slate-300">/</span>
                <span className={cn(
                  "text-2xl font-display font-black",
                  !isControlled ? "text-rose-400" : "text-emerald-400"
                )}>
                  {dashboard?.stats.finalAverage?.diastolic || '--'}
                </span>
              </div>
              <div className="mt-4">
                <Badge variant={!isControlled ? 'danger' : 'success'}>
                  {dashboard?.stats.finalAverage 
                    ? (!isControlled ? 'Hipertensión' : 'Controlado')
                    : 'Pendiente'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Charts & Status Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                <div>
                  <CardTitle className="text-lg">Comparativa Mañana vs Noche</CardTitle>
                  <CardDescription>Distribución de promedios sistólica/diastólica</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              <div className="h-72 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { 
                        name: 'Mañana', 
                        pas: dashboard?.stats.periodAverages.morning?.systolic || 0, 
                        pad: dashboard?.stats.periodAverages.morning?.diastolic || 0 
                      },
                      { 
                        name: 'Noche', 
                        pas: dashboard?.stats.periodAverages.evening?.systolic || 0, 
                        pad: dashboard?.stats.periodAverages.evening?.diastolic || 0 
                      }
                    ]}
                    margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: isDarkMode ? '#64748b' : '#94a3b8', fontSize: 12, fontWeight: 700 }}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: isDarkMode ? '#64748b' : '#94a3b8', fontSize: 10 }} />
                    <Tooltip 
                      cursor={{ fill: isDarkMode ? '#1e293b' : '#f8fafc' }}
                      contentStyle={{ 
                        borderRadius: '1.5rem', 
                        border: 'none', 
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                        backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                      }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }} />
                    <Bar dataKey="pas" name="Sistólica (PAS)" fill="#4f46e5" radius={[8, 8, 0, 0]} barSize={40} />
                    <Bar dataKey="pad" name="Diastólica (PAD)" fill="#818cf8" radius={[8, 8, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Comparison Insight */}
              {morningPas > 0 && eveningPas > 0 && (
                <div className={cn("mt-6 p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center gap-4", comparisonBg, comparisonBorder)}>
                  <div className={cn("p-3 rounded-xl shrink-0", comparisonBg.replace('/10', '/20').replace('50', '100'))}>
                    <ComparisonIcon className={cn("w-6 h-6", comparisonColor)} />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h5 className={cn("font-bold", comparisonColor)}>Análisis de Variación</h5>
                      <Badge variant="outline" className={cn("border-current bg-white/50 dark:bg-black/20", comparisonColor)}>
                        {diffLabel}
                      </Badge>
                    </div>
                    <p className={cn("text-sm font-medium leading-relaxed opacity-90", comparisonColor)}>
                      {comparisonInsight}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Overall Status Card - Redesigned as a compact side card */}
        <div className="lg:col-span-1">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-indigo-600" />
                <div>
                  <CardTitle className="text-lg">Diagnóstico AMPA</CardTitle>
                  <CardDescription>Estado general de tu presión</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center pt-4">
              <div className={cn(
                "p-6 rounded-3xl border flex flex-col items-center text-center gap-5 h-full justify-center transition-colors duration-300",
                isControlled
                  ? "bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-800/30"
                  : "bg-rose-50/50 border-rose-100 dark:bg-rose-900/10 dark:border-rose-800/30"
              )}>
                <div className={cn(
                  "w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg transform transition-transform hover:scale-105 duration-300",
                  isControlled 
                    ? "bg-emerald-500 text-white shadow-emerald-200 dark:shadow-none" 
                    : "bg-rose-500 text-white shadow-rose-200 dark:shadow-none"
                )}>
                  {isControlled ? <CheckCircle2 className="w-10 h-10" /> : <AlertCircle className="w-10 h-10" />}
                </div>
                
                <div className="space-y-2">
                  <h4 className={cn(
                    "text-xl font-display font-black", 
                    isControlled ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"
                  )}>
                    {isControlled ? "Presión Controlada" : "Atención Requerida"}
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                    {dashboard?.stats.finalAverage 
                      ? (isControlled
                          ? "Tus promedios están dentro de los objetivos médicos recomendados (<135/85)." 
                          : "Tus promedios superan los límites recomendados. Consulta con tu médico.")
                      : "Completa el protocolo de 5 días para obtener una evaluación precisa."}
                  </p>
                </div>

                <div className="pt-2">
                  <Badge variant={isControlled ? 'success' : 'danger'} className="px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl">
                    {isControlled ? "Controlado" : "Revisión Necesaria"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Evolución Temporal - Moved to bottom, full width */}
      <section className="mt-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-indigo-600 shrink-0" />
                <div>
                  <CardTitle className="text-lg">Evolución Temporal</CardTitle>
                  <CardDescription>Promedios diarios de tus mediciones</CardDescription>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Filter Toggle */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
                  <button
                    onClick={() => setChartFilter('both')}
                    className={cn(
                      "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                      chartFilter === 'both' 
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                  >
                    Ambos
                  </button>
                  <button
                    onClick={() => setChartFilter('pas')}
                    className={cn(
                      "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                      chartFilter === 'pas' 
                        ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" 
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                  >
                    PAS
                  </button>
                  <button
                    onClick={() => setChartFilter('pad')}
                    className={cn(
                      "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                      chartFilter === 'pad' 
                        ? "bg-white dark:bg-slate-700 text-indigo-400 dark:text-indigo-300 shadow-sm" 
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                  >
                    PAD
                  </button>
                </div>

                <div className="bg-indigo-50 dark:bg-indigo-900/20 px-3 py-2 rounded-xl border border-indigo-100 dark:border-indigo-800/30 md:text-right w-full sm:w-auto">
                  <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">
                    Rangos AMPA
                  </p>
                  <div className="text-[10px] font-bold text-slate-600 dark:text-slate-400 flex flex-col md:items-end gap-0.5">
                    <p><span className="text-rose-500">Hipertensión:</span> PAS ≥135 | PAD ≥85</p>
                    <p><span className="text-amber-500">Normal-Alta:</span> PAS 130-134 | PAD 80-84</p>
                    <p><span className="text-sky-500">Hipotensión:</span> PAS &lt;100 | PAD &lt;60</p>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <div className="h-72 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[...(dashboard?.recentDailyAverages || [])].reverse().map((r, i) => {
                    const date = new Date(r.date);
                    return {
                      key: `${r.date}-${i}`,
                      tooltipLabel: date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
                      pas: r.systolic,
                      pad: r.diastolic,
                      fc: r.heartRate || 0
                    };
                  })}
                  margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} />
                  <XAxis 
                    dataKey="tooltipLabel" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: isDarkMode ? '#64748b' : '#94a3b8', fontSize: 12, fontWeight: 700 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: isDarkMode ? '#64748b' : '#94a3b8', fontSize: 10 }} 
                    domain={['auto', 'auto']}
                  />
                  <Tooltip 
                    cursor={{ stroke: isDarkMode ? '#334155' : '#e2e8f0', strokeWidth: 2, strokeDasharray: '5 5' }}
                    content={<CustomTooltip />}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }} />
                  
                  {/* Normal Ranges */}
                  {(chartFilter === 'both' || chartFilter === 'pas') && (
                    <ReferenceArea 
                      y1={100} 
                      y2={129} 
                      fill={isDarkMode ? "#4f46e5" : "#4f46e5"} 
                      fillOpacity={0.05} 
                      ifOverflow="extendDomain"
                    />
                  )}
                  {(chartFilter === 'both' || chartFilter === 'pad') && (
                    <ReferenceArea 
                      y1={60} 
                      y2={79} 
                      fill={isDarkMode ? "#818cf8" : "#818cf8"} 
                      fillOpacity={0.05} 
                      ifOverflow="extendDomain"
                    />
                  )}

                  {(chartFilter === 'both' || chartFilter === 'pas') && (
                    <Line 
                      type="monotone" 
                      dataKey="pas" 
                      name="Sistólica (PAS)" 
                      stroke="#4f46e5" 
                      strokeWidth={4} 
                      dot={(props) => renderCustomDot(props, 'pas')}
                      activeDot={{ r: 6 }} 
                    />
                  )}
                  {(chartFilter === 'both' || chartFilter === 'pad') && (
                    <Line 
                      type="monotone" 
                      dataKey="pad" 
                      name="Diastólica (PAD)" 
                      stroke="#818cf8" 
                      strokeWidth={4} 
                      dot={(props) => renderCustomDot(props, 'pad')}
                      activeDot={{ r: 6 }} 
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
