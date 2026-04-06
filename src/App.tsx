import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { 
  Plus, 
  History, 
  TrendingUp, 
  Activity, 
  Trash2, 
  Heart, 
  AlertCircle,
  Brain,
  ChevronRight,
  Calendar,
  Clock,
  Edit2,
  Check,
  X,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface Reading {
  id: string;
  systolic: number;
  diastolic: number;
  pulse: number;
  timestamp: number;
  note?: string;
}

// --- Constants ---
const STORAGE_KEY = 'tensiotrack_readings';

// --- Components ---

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden", className)}>
    {children}
  </div>
);

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className,
  disabled,
  type = 'button'
}: { 
  children: React.ReactNode, 
  onClick?: () => void, 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost',
  className?: string,
  disabled?: boolean,
  type?: 'button' | 'submit'
}) => {
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
    danger: 'bg-rose-50 text-rose-600 hover:bg-rose-100',
    ghost: 'bg-transparent text-slate-500 hover:bg-slate-50'
  };

  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled}
      className={cn(
        "px-4 py-2 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2",
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
};

const Input = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  type = 'number',
  suffix
}: { 
  label: string, 
  value: string | number, 
  onChange: (val: string) => void,
  placeholder?: string,
  type?: string,
  suffix?: string
}) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-slate-700 ml-1">{label}</label>
    <div className="relative">
      <input 
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
      />
      {suffix && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
          {suffix}
        </span>
      )}
    </div>
  </div>
);

export default function App() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [note, setNote] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEditingAiAdvice, setIsEditingAiAdvice] = useState(false);
  const [tempAiAdvice, setTempAiAdvice] = useState('');

  // Load data
  useEffect(() => {
    const savedReadings = localStorage.getItem(STORAGE_KEY);
    if (savedReadings) {
      try {
        setReadings(JSON.parse(savedReadings));
      } catch (e) {
        console.error("Error loading readings", e);
      }
    }

    const savedAdvice = localStorage.getItem('tensiotrack_ai_advice');
    if (savedAdvice) {
      setAiAdvice(savedAdvice);
    }
  }, []);

  // Save data
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(readings));
  }, [readings]);

  useEffect(() => {
    if (aiAdvice !== null) {
      localStorage.setItem('tensiotrack_ai_advice', aiAdvice);
    } else {
      localStorage.removeItem('tensiotrack_ai_advice');
    }
  }, [aiAdvice]);

  const addReading = (e: React.FormEvent) => {
    e.preventDefault();
    if (!systolic || !diastolic || !pulse) return;

    const newReading: Reading = {
      id: crypto.randomUUID(),
      systolic: parseInt(systolic),
      diastolic: parseInt(diastolic),
      pulse: parseInt(pulse),
      timestamp: Date.now(),
      note: note.trim() || undefined
    };

    setReadings([newReading, ...readings]);
    setSystolic('');
    setDiastolic('');
    setPulse('');
    setNote('');
    setIsAdding(false);
  };

  const deleteReading = (id: string) => {
    setReadings(readings.filter(r => r.id !== id));
  };

  const getStatus = (sys: number, dia: number) => {
    if (sys < 120 && dia < 80) return { label: 'Normal', color: 'text-emerald-600', bg: 'bg-emerald-50' };
    if (sys < 130 && dia < 80) return { label: 'Elevada', color: 'text-amber-600', bg: 'bg-amber-50' };
    if (sys < 140 || dia < 90) return { label: 'Hipertensión Nivel 1', color: 'text-orange-600', bg: 'bg-orange-50' };
    return { label: 'Hipertensión Nivel 2', color: 'text-rose-600', bg: 'bg-rose-50' };
  };

  const chartData = useMemo(() => {
    return [...readings].reverse().map(r => ({
      date: new Date(r.timestamp).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
      sys: r.systolic,
      dia: r.diastolic,
      pulse: r.pulse
    }));
  }, [readings]);

  const getAiAdvice = async () => {
    if (readings.length === 0) return;
    setIsAnalyzing(true);
    setIsEditingAiAdvice(false);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        setAiAdvice("⚠️ No se detectó la clave de API. Por favor, configúrala en el menú de Secrets.");
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const model = "gemini-3-flash-preview";
      
      const recentReadings = readings.slice(0, 7).map(r => 
        `- ${new Date(r.timestamp).toLocaleDateString('es-ES')}: ${r.systolic}/${r.diastolic} mmHg, ${r.pulse} lpm${r.note ? ` (${r.note})` : ''}`
      ).join('\n');

      const response = await ai.models.generateContent({
        model,
        contents: `Actúa como un asistente de salud cardiovascular inteligente y empático para la aplicación TensioTrack. 
        Analiza las siguientes mediciones de presión arterial y pulso de un usuario:
        
        ${recentReadings}
        
        Proporciona:
        1. Una evaluación breve de la tendencia general (¿está estable, mejorando o empeorando?).
        2. Consejos prácticos y sencillos sobre estilo de vida (dieta, ejercicio, hidratación).
        3. Una advertencia clara de que no eres un médico y que debe consultar a un profesional ante cualquier duda o síntoma.
        
        Responde en español, con un tono profesional pero cercano. Usa un formato limpio con puntos clave.`,
      });

      setAiAdvice(response.text || "No se pudo generar el análisis en este momento.");
    } catch (error) {
      console.error("Error calling Gemini", error);
      setAiAdvice("Hubo un problema al procesar el análisis. Verifica tu conexión y tu clave de API.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isApiKeyConfigured = !!process.env.GEMINI_API_KEY;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Heart className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">TensioTrack</h1>
              <div className="flex items-center gap-2">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Salud Cardiovascular</p>
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  isApiKeyConfigured ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                )} title={isApiKeyConfigured ? "IA Conectada" : "IA Desconectada"} />
              </div>
            </div>
          </div>
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Nueva Toma</span>
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        
        {/* Stats Overview */}
        {readings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 flex items-center gap-4">
              <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Promedio Sistólica</p>
                <p className="text-2xl font-bold">
                  {Math.round(readings.reduce((acc, r) => acc + r.systolic, 0) / readings.length)}
                  <span className="text-sm font-normal text-slate-400 ml-1">mmHg</span>
                </p>
              </div>
            </Card>
            <Card className="p-6 flex items-center gap-4">
              <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Promedio Diastólica</p>
                <p className="text-2xl font-bold">
                  {Math.round(readings.reduce((acc, r) => acc + r.diastolic, 0) / readings.length)}
                  <span className="text-sm font-normal text-slate-400 ml-1">mmHg</span>
                </p>
              </div>
            </Card>
            <Card className="p-6 flex items-center gap-4">
              <div className="p-3 bg-rose-50 rounded-2xl text-rose-600">
                <Heart className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Promedio Pulso</p>
                <p className="text-2xl font-bold">
                  {Math.round(readings.reduce((acc, r) => acc + r.pulse, 0) / readings.length)}
                  <span className="text-sm font-normal text-slate-400 ml-1">lpm</span>
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Chart Section */}
        {readings.length > 1 ? (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                <h2 className="font-bold text-lg">Tendencias</h2>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSys" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="top" height={36}/>
                  <Area name="Sistólica" type="monotone" dataKey="sys" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorSys)" />
                  <Area name="Diastólica" type="monotone" dataKey="dia" stroke="#818cf8" strokeWidth={3} fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        ) : readings.length === 1 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Añade al menos una toma más para ver el gráfico de tendencias.</p>
          </div>
        ) : null}

        {/* AI Advice Section */}
        {readings.length > 0 && (
          <Card className="p-6 bg-indigo-900 text-white border-none shadow-xl shadow-indigo-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-indigo-200">
                  <Brain className="w-5 h-5" />
                  <span className="text-sm font-bold uppercase tracking-wider">Análisis con IA</span>
                </div>
                <h3 className="text-xl font-bold">¿Cómo va tu salud hoy?</h3>
                <p className="text-indigo-100/80 text-sm max-w-xl">
                  Obtén un resumen inteligente de tus últimas mediciones y consejos personalizados basados en tus datos.
                </p>
              </div>
              <Button 
                variant="secondary" 
                className="bg-white text-indigo-900 hover:bg-indigo-50 shrink-0"
                onClick={getAiAdvice}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? "Analizando..." : "Generar Análisis"}
              </Button>
            </div>
            
            <AnimatePresence>
              {aiAdvice && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="mt-6 pt-6 border-t border-white/10 overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-indigo-200 text-xs font-bold uppercase tracking-widest">
                      <Activity className="w-3 h-3" />
                      Resultado del Análisis
                    </div>
                    <div className="flex items-center gap-2">
                      {!isEditingAiAdvice ? (
                        <>
                          <button 
                            onClick={() => {
                              setTempAiAdvice(aiAdvice);
                              setIsEditingAiAdvice(true);
                            }}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-indigo-200 hover:text-white"
                            title="Editar análisis"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setAiAdvice(null)}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-indigo-200 hover:text-rose-400"
                            title="Eliminar análisis"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => {
                              setAiAdvice(tempAiAdvice);
                              setIsEditingAiAdvice(false);
                            }}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-emerald-400"
                            title="Guardar cambios"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setIsEditingAiAdvice(false)}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-rose-400"
                            title="Cancelar edición"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {isEditingAiAdvice ? (
                    <textarea
                      value={tempAiAdvice}
                      onChange={(e) => setTempAiAdvice(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-sm leading-relaxed text-indigo-50 focus:outline-none focus:ring-2 focus:ring-white/30 min-h-[150px] resize-none"
                    />
                  ) : (
                    <div className="bg-white/10 rounded-xl p-4 text-sm leading-relaxed text-indigo-50 whitespace-pre-wrap">
                      {aiAdvice}
                    </div>
                  )}
                  
                  {!isEditingAiAdvice && (
                    <div className="mt-4 flex justify-end">
                      <button 
                        onClick={getAiAdvice}
                        disabled={isAnalyzing}
                        className="flex items-center gap-1.5 text-xs font-bold text-indigo-300 hover:text-white transition-colors disabled:opacity-50"
                      >
                        <RotateCcw className={cn("w-3 h-3", isAnalyzing && "animate-spin")} />
                        Volver a generar
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        )}

        {/* History List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-slate-400" />
              <h2 className="font-bold text-lg">Historial</h2>
            </div>
            <p className="text-sm text-slate-500 font-medium">{readings.length} registros</p>
          </div>

          <div className="space-y-3">
            {readings.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity className="w-10 h-10 text-slate-200" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Sin registros aún</h3>
                <p className="text-slate-500 max-w-xs mx-auto mt-1">Empieza a registrar tu presión arterial para cuidar tu corazón.</p>
                <Button onClick={() => setIsAdding(true)} className="mt-6 mx-auto">
                  Registrar mi primera toma
                </Button>
              </div>
            ) : (
              readings.map((reading) => {
                const status = getStatus(reading.systolic, reading.diastolic);
                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={reading.id}
                  >
                    <Card className="p-4 sm:p-6 hover:border-indigo-100 transition-colors group">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className={cn("w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0", status.bg)}>
                            <span className={cn("text-xl font-bold", status.color)}>{reading.systolic}</span>
                            <span className={cn("text-[10px] font-bold uppercase", status.color)}>{reading.diastolic}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", status.bg, status.color)}>
                                {status.label}
                              </span>
                              <div className="flex items-center gap-1 text-slate-400 text-xs">
                                <Clock className="w-3 h-3" />
                                {new Date(reading.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                            <div className="flex items-center gap-4 mt-1">
                              <div className="flex items-center gap-1.5">
                                <Heart className="w-4 h-4 text-rose-500" />
                                <span className="font-bold">{reading.pulse} <span className="text-xs font-normal text-slate-400">lpm</span></span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <span className="text-sm text-slate-600">{new Date(reading.timestamp).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between sm:justify-end gap-3">
                          {reading.note && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 max-w-[200px] truncate">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              {reading.note}
                            </div>
                          )}
                          <Button 
                            variant="ghost" 
                            className="text-slate-300 hover:text-rose-500 hover:bg-rose-50"
                            onClick={() => deleteReading(reading.id)}
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Add Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-bold">Nueva Medición</h2>
                <Button variant="ghost" onClick={() => setIsAdding(false)} className="p-1">
                  <Plus className="w-6 h-6 rotate-45" />
                </Button>
              </div>
              
              <form onSubmit={addReading} className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label="Sistólica" 
                    value={systolic} 
                    onChange={setSystolic} 
                    placeholder="120" 
                    suffix="mmHg"
                  />
                  <Input 
                    label="Diastólica" 
                    value={diastolic} 
                    onChange={setDiastolic} 
                    placeholder="80" 
                    suffix="mmHg"
                  />
                </div>
                <Input 
                  label="Pulso" 
                  value={pulse} 
                  onChange={setPulse} 
                  placeholder="72" 
                  suffix="lpm"
                />
                <Input 
                  label="Nota (opcional)" 
                  value={note} 
                  onChange={setNote} 
                  placeholder="Ej: Después de caminar" 
                  type="text"
                />

                <div className="pt-2">
                  <Button type="submit" className="w-full py-4 text-lg">
                    Guardar Registro
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-6 py-12 text-center space-y-4">
        <div className="flex items-center justify-center gap-2 text-slate-400">
          <Heart className="w-4 h-4" />
          <span className="text-sm font-medium">TensioTrack — Tu salud es lo primero</span>
        </div>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Esta aplicación es una herramienta de seguimiento. No sustituye el consejo médico profesional. 
          Consulta siempre con un especialista.
        </p>
      </footer>
    </div>
  );
}
