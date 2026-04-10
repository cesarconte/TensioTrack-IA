import * as React from "react";
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Brain, 
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles
} from "lucide-react";
import { cn } from "../lib/utils";
import { DashboardData } from "../types";
import { Button } from "./ui/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/Tooltip";

interface AIPredictionsProps {
  dashboard: DashboardData;
  userProfile: any;
}

export function AIPredictions({ dashboard, userProfile }: AIPredictionsProps) {
  const [prediction, setPrediction] = React.useState<{
    alert: string;
    trend: 'rising' | 'falling' | 'stable';
    percentage: number;
    recommendation: string;
    isCritical: boolean;
    longTermInsight?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasInsufficientData, setHasInsufficientData] = React.useState(false);

  React.useEffect(() => {
    if (dashboard.recentReadings.length < 3) {
      setHasInsufficientData(true);
    } else {
      setHasInsufficientData(false);
    }
  }, [dashboard.recentReadings.length]);

  const analyzeTrends = async () => {
    if (hasInsufficientData) return;
    
    setIsLoading(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        console.error("Gemini API Key not found");
        return;
      }

      const ai = new GoogleGenAI(apiKey) as any;
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

      const currentAvg = dashboard.stats.finalAverage;
      const recentReadings = dashboard.recentReadings.slice(0, 15).map(r => 
        `${new Date(r.recordedAt).toLocaleDateString()} (${r.slot}): ${r.systolic}/${r.diastolic}`
      ).join('\n');

      const prompt = `
      Analiza estos datos de presión arterial (Protocolo AMPA) y detecta tendencias predictivas.
      
      PERFIL DEL USUARIO:
      - Edad: ${userProfile?.age || 'No especificada'} años
      - Sexo: ${userProfile?.sex === 'male' ? 'Hombre' : userProfile?.sex === 'female' ? 'Mujer' : 'No especificado'}
      - Peso: ${userProfile?.weight || 'No especificado'} kg
      - Altura: ${userProfile?.height || 'No especificada'} cm
      - Fumador: ${userProfile?.isSmoker ? 'Sí' : 'No'}
      - Diabetes: ${userProfile?.hasDiabetes ? 'Sí' : 'No'}
      - Medicado para HTA: ${userProfile?.isHypertensiveMedicated ? 'Sí' : 'No'}
      - Nivel de actividad: ${userProfile?.activityLevel || 'No especificado'}
      
      DATOS DE PRESIÓN:
      ${currentAvg ? `Promedio Actual: ${currentAvg.systolic}/${currentAvg.diastolic} mmHg.` : 'Sin promedio de ciclo completo.'}
      
      Últimas mediciones:
      ${recentReadings}
      
      Tu objetivo es:
      1. Detectar tendencias de riesgo.
      2. Evaluar riesgos de salud a largo plazo.
      3. Proporcionar una visión predictiva.
      
      Devuelve un JSON con:
      - "alert": Mensaje corto de tendencia.
      - "trend": "rising", "falling" o "stable".
      - "percentage": Porcentaje de cambio estimado (número).
      - "recommendation": Recomendación preventiva corta.
      - "longTermInsight": Análisis detallado (2 frases).
      - "isCritical": true si detectas riesgo inmediato (Sistólica >= 135 o Diastólica >= 85).
      
      Responde SOLO el JSON.
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonStr = text.replace(/```json|```/g, '').trim();
      const data = JSON.parse(jsonStr);
      setPrediction(data);
    } catch (error) {
      console.error("Error generating prediction:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-[2.5rem] p-6 sm:p-8 border transition-all duration-700",
        prediction?.isCritical 
          ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/50" 
          : hasInsufficientData
            ? "bg-slate-50/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 border-dashed"
            : "bg-indigo-50/30 dark:bg-indigo-950/10 border-indigo-100 dark:border-indigo-900/30"
      )}
    >
      <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start">
        {/* Icon Section */}
        <div className={cn(
          "w-20 h-20 rounded-3xl flex items-center justify-center shrink-0 shadow-lg transition-all duration-500",
          prediction?.isCritical 
            ? "bg-rose-500 text-white shadow-rose-200 dark:shadow-none scale-110" 
            : hasInsufficientData
              ? "bg-slate-200 dark:bg-slate-800 text-slate-400 shadow-none"
              : "bg-indigo-600 text-white shadow-indigo-200 dark:shadow-none"
        )}>
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, rotate: -180 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 180 }}
              >
                <Activity className="w-10 h-10 animate-pulse" />
              </motion.div>
            ) : hasInsufficientData ? (
              <motion.div
                key="info"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Info className="w-10 h-10" />
              </motion.div>
            ) : (
              <motion.div
                key="trend"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                {prediction?.trend === 'rising' ? (
                  <TrendingUp className="w-10 h-10" />
                ) : prediction?.trend === 'falling' ? (
                  <TrendingDown className="w-10 h-10" />
                ) : (
                  <Brain className="w-10 h-10" />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content Section */}
        <div className="flex-1 text-center md:text-left space-y-4">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
              prediction?.isCritical ? "bg-rose-100 text-rose-600" : "bg-indigo-100 text-indigo-600"
            )}>
              <Sparkles className="w-3 h-3" />
              Análisis Predictivo IA
            </div>
            
            {!hasInsufficientData && !isLoading && prediction && (
              <div className={cn(
                "flex items-center gap-1 text-xs font-bold",
                prediction.trend === 'rising' ? "text-rose-500" : prediction.trend === 'falling' ? "text-emerald-500" : "text-slate-500"
              )}>
                {prediction.trend === 'rising' ? <ArrowUpRight className="w-4 h-4" /> : prediction.trend === 'falling' ? <ArrowDownRight className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                {prediction.percentage !== 0 && `${Math.abs(prediction.percentage)}% `}
                {prediction.trend === 'rising' ? 'Incremento' : prediction.trend === 'falling' ? 'Descenso' : 'Estable'}
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div 
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="h-8 bg-slate-200/60 dark:bg-slate-800/60 rounded-xl w-3/4 animate-pulse mx-auto md:mx-0" />
                <div className="space-y-2">
                  <div className="h-4 bg-slate-100/60 dark:bg-slate-800/40 rounded-lg w-full animate-pulse mx-auto md:mx-0" />
                  <div className="h-4 bg-slate-100/60 dark:bg-slate-800/40 rounded-lg w-5/6 animate-pulse mx-auto md:mx-0" />
                </div>
              </motion.div>
            ) : hasInsufficientData ? (
              <motion.div
                key="insufficient"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-2"
              >
                <h3 className="text-2xl font-display font-black leading-tight text-slate-400 dark:text-slate-500">
                  Esperando más datos...
                </h3>
                <p className="text-slate-400 dark:text-slate-600 text-sm font-medium leading-relaxed max-w-2xl">
                  Necesitamos al menos 3 mediciones para empezar a analizar tus tendencias. Sigue registrando tus tomas diarias para activar las predicciones.
                </p>
              </motion.div>
            ) : !prediction ? (
              <motion.div
                key="ready"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <h3 className="text-2xl font-display font-black leading-tight text-slate-900 dark:text-white">
                    Análisis listo para generar
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed max-w-2xl">
                    Ya tienes suficientes datos para un análisis preliminar. Haz clic en el botón para generar tu predicción inteligente.
                  </p>
                </div>
                <Button
                  onClick={analyzeTrends}
                  disabled={isLoading}
                  className="h-12 px-8 rounded-2xl"
                >
                  <Brain className="w-5 h-5" />
                  Generar Análisis
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className={cn(
                    "text-2xl font-display font-black leading-tight",
                    prediction?.isCritical ? "text-rose-900 dark:text-rose-100" : "text-slate-900 dark:text-white"
                  )}>
                    {prediction?.alert}
                  </h3>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={analyzeTrends}
                        disabled={isLoading}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-colors"
                        aria-label="Actualizar análisis predictivo"
                      >
                        <Activity className={cn("w-5 h-5", isLoading && "animate-spin")} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Actualizar análisis predictivo</TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed max-w-2xl">
                  {prediction?.recommendation}
                </p>
                {prediction?.longTermInsight && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800/50 mt-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Visión a Largo Plazo</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
                      "{prediction.longTermInsight}"
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/5 rounded-full -ml-32 -mb-32 blur-3xl" />
    </motion.div>
  );
}
