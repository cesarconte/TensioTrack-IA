import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useReadings } from './lib/api';
import { ReadingForm } from './components/ReadingForm';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  History, 
  TrendingUp, 
  Activity, 
  Heart, 
  Brain,
  Calendar,
  Clock,
  ChevronRight,
  User,
  Settings,
  LogOut
} from 'lucide-react';

const queryClient = new QueryClient();

import { GoogleGenAI } from "@google/genai";

function AppContent() {
  const { data: readings, isLoading } = useReadings();
  const [activeSlot, setActiveSlot] = useState<'morning' | 'evening' | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const getAiAdvice = async () => {
    if (!readings || readings.length === 0) return;
    setIsAnalyzing(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        setAiAdvice("⚠️ No se detectó la clave de API. Por favor, configúrala en el menú de Secrets.");
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const model = "gemini-3-flash-preview";
      
      const recentReadings = readings.slice(0, 15).map(r => 
        `- ${new Date(r.recordedAt).toLocaleDateString('es-ES')}: ${r.systolic}/${r.diastolic} mmHg, ${r.heartRate || '--'} lpm`
      ).join('\n');

      const response = await ai.models.generateContent({
        model,
        contents: `Actúa como un asistente de salud cardiovascular experto para la aplicación TensioTrack. 
        Analiza las siguientes mediciones de presión arterial de un usuario (Protocolo AMPA):
        
        ${recentReadings}
        
        Proporciona:
        1. Una evaluación de la tendencia (estable, mejorando, empeorando).
        2. Consejos de estilo de vida basados en los datos.
        3. Una advertencia médica clara.
        
        Responde en español, con tono profesional y formato Markdown limpio.`,
      });

      setAiAdvice(response.text || "No se pudo generar el análisis.");
    } catch (error) {
      console.error("Error calling Gemini", error);
      setAiAdvice("Ocurrió un error al conectar con la IA.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const today = new Date();
  const formattedDate = today.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-display font-black tracking-tight text-slate-900">TensioTrack</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Protocolo AMPA</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
              <User className="w-5 h-5" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        {/* Welcome Section */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <p className="text-sm font-bold text-indigo-600 uppercase tracking-wider">{formattedDate}</p>
            <h2 className="text-3xl font-display font-black text-slate-900">¡Hola de nuevo! 👋</h2>
            <p className="text-slate-500 font-medium">Es momento de cuidar tu corazón hoy.</p>
          </div>
        </section>

        {/* Daily Status */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div 
            onClick={() => setActiveSlot('morning')}
            className={cn(
              "group relative p-8 rounded-[2rem] border-2 transition-all cursor-pointer overflow-hidden",
              "bg-white border-slate-100 hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-100"
            )}
          >
            <div className="relative z-10 flex flex-col h-full justify-between gap-12">
              <div className="flex items-start justify-between">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <Clock className="w-7 h-7" />
                </div>
                <div className="px-4 py-1.5 rounded-full bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Mañana
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-display font-black mb-2">Sesión Matinal</h3>
                <p className="text-slate-500 text-sm font-medium">Antes del desayuno y café.</p>
              </div>
            </div>
            <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-amber-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          <div 
            onClick={() => setActiveSlot('evening')}
            className={cn(
              "group relative p-8 rounded-[2rem] border-2 transition-all cursor-pointer overflow-hidden",
              "bg-white border-slate-100 hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-100"
            )}
          >
            <div className="relative z-10 flex flex-col h-full justify-between gap-12">
              <div className="flex items-start justify-between">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Clock className="w-7 h-7" />
                </div>
                <div className="px-4 py-1.5 rounded-full bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Noche
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-display font-black mb-2">Sesión Nocturna</h3>
                <p className="text-slate-500 text-sm font-medium">Antes de cenar o dormir.</p>
              </div>
            </div>
            <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </section>

        {/* AI Analysis Preview */}
        <section className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
          <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-10">
            <div className="space-y-4 max-w-xl">
              <div className="flex items-center gap-3 text-indigo-400">
                <Brain className="w-6 h-6" />
                <span className="text-xs font-black uppercase tracking-[0.2em]">Análisis Inteligente</span>
              </div>
              <h3 className="text-3xl font-display font-black leading-tight">¿Cómo ha evolucionado tu salud esta semana?</h3>
              <p className="text-slate-400 font-medium leading-relaxed">
                Nuestra IA analiza tus promedios para darte una visión clara de tu tendencia cardiovascular.
              </p>
              
              <AnimatePresence>
                {aiAdvice && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-6 p-6 bg-white/10 rounded-3xl border border-white/10 text-sm leading-relaxed text-indigo-50 whitespace-pre-wrap"
                  >
                    {aiAdvice}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button 
              onClick={getAiAdvice}
              disabled={isAnalyzing || !readings?.length}
              className="h-16 px-8 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-50 transition-all active:scale-95 shrink-0 disabled:opacity-50"
            >
              {isAnalyzing ? "Analizando..." : "Generar Informe"}
            </button>
          </div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] -mr-48 -mt-48" />
        </section>

        {/* History List */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <History className="w-6 h-6 text-slate-400" />
              <h2 className="text-2xl font-display font-black">Historial Reciente</h2>
            </div>
            <button className="text-sm font-bold text-indigo-600 hover:underline">Ver todo</button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {isLoading ? (
              <div className="h-32 bg-white rounded-3xl animate-pulse" />
            ) : readings?.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-[2rem] border border-dashed border-slate-200">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity className="w-10 h-10 text-slate-200" />
                </div>
                <h3 className="font-bold text-slate-900">Sin registros aún</h3>
                <p className="text-slate-500 text-sm">Comienza tu primera sesión para ver datos aquí.</p>
              </div>
            ) : (
              readings?.slice(0, 5).map((reading) => (
                <div key={reading.id} className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center justify-between group hover:border-indigo-100 transition-all">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 flex flex-col items-center justify-center font-mono">
                      <span className="text-xl font-black text-slate-900 leading-none">{reading.systolic}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{reading.diastolic}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black uppercase tracking-widest text-indigo-600">
                          {reading.order === 1 ? '1ª Toma' : reading.order === 2 ? '2ª Toma' : '3ª Toma'}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className="text-xs font-medium text-slate-400">
                          {new Date(reading.recordedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <Heart className="w-4 h-4 text-rose-500" />
                          <span className="text-sm font-black">{reading.heartRate || '--'} <span className="text-[10px] font-bold text-slate-400">lpm</span></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-medium text-slate-500">
                            {new Date(reading.recordedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-indigo-300 transition-colors" />
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {activeSlot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveSlot(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative w-full max-w-lg"
            >
              <ReadingForm 
                slot={activeSlot} 
                onComplete={() => setActiveSlot(null)}
                onCancel={() => setActiveSlot(null)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-6 py-20 border-t border-slate-100 text-center space-y-6">
        <div className="flex items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
            <Activity className="w-4 h-4" />
          </div>
          <span className="font-display font-black text-slate-400 uppercase tracking-widest text-xs">TensioTrack</span>
        </div>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed font-medium">
          Esta aplicación es una herramienta de seguimiento personal basada en el protocolo AMPA. 
          No sustituye el diagnóstico médico profesional. Consulta siempre con tu cardiólogo.
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
