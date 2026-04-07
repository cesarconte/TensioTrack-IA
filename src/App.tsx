import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useReadings, useAddReading, useDashboard, useClearData } from './lib/api';
import { ReadingForm } from './components/ReadingForm';
import { EditReadingModal } from './components/EditReadingModal';
import { InfoModal } from './components/InfoModal';
import { SettingsModal } from './components/SettingsModal';
import { Reading } from './lib/api';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  History, 
  TrendingUp, 
  TrendingDown,
  Activity, 
  Heart, 
  Brain,
  Calendar,
  Clock,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Settings,
  FileText,
  Download,
  X,
  Trash2,
  CheckCircle2,
  Info,
  AlertCircle,
  Lightbulb,
  LogOut,
  LogIn,
  MessageSquare,
  User as UserIcon
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  Legend,
  ReferenceLine
} from 'recharts';

const queryClient = new QueryClient();

import { GoogleGenAI } from "@google/genai";
import { auth, googleProvider, signInWithPopup, onAuthStateChanged, db, doc, setDoc, getDoc, serverTimestamp } from './firebase';

function AppContent() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          if (!userSnap.exists()) {
            const newUser = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              createdAt: serverTimestamp()
            };
            await setDoc(userRef, newUser);
            setUser({ ...user, ...newUser });
          } else {
            const userData = userSnap.data();
            await setDoc(userRef, {
              displayName: user.displayName,
              photoURL: user.photoURL,
            }, { merge: true });
            setUser({ ...user, ...userData, displayName: user.displayName, photoURL: user.photoURL });
          }
        } catch (error) {
          console.error("Error syncing user:", error);
        }
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login error", error);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  const [showProfile, setShowProfile] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [editingReading, setEditingReading] = useState<Reading | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [chartMode, setChartMode] = useState<'systolic' | 'diastolic' | 'both'>('both');
  const [pageSize, setPageSize] = useState(6);

  const { data: dashboard, isLoading: dashboardLoading } = useDashboard();
  const [historyFilter, setHistoryFilter] = useState<'all' | 'morning' | 'evening'>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const { data: readings } = useReadings({ slot: historyFilter, date: dateFilter });
  
  React.useEffect(() => {
    setCurrentPage(1);
  }, [historyFilter, dateFilter]);

  const totalPages = Math.ceil((readings?.length || 0) / pageSize);
  const paginatedReadings = readings?.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const { data: allReadings } = useReadings();
  const isLoading = dashboardLoading || authLoading;
  const clearData = useClearData();
  const addReading = useAddReading();
  const [activeSlot, setActiveSlot] = useState<'morning' | 'evening' | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showConfirmExport, setShowConfirmExport] = useState(false);
  const [expandedReadingId, setExpandedReadingId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [morningTime, setMorningTime] = useState('08:00');
  const [eveningTime, setEveningTime] = useState('20:00');
  const lastNotifiedRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (user) {
      setRemindersEnabled(user.remindersEnabled || false);
      setMorningTime(user.morningTime || '08:00');
      setEveningTime(user.eveningTime || '20:00');
    }
  }, [user?.uid]);

  React.useEffect(() => {
    if (!remindersEnabled || typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    const checkReminders = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      if ((currentTime === morningTime || currentTime === eveningTime) && lastNotifiedRef.current !== currentTime) {
        lastNotifiedRef.current = currentTime;
        new Notification('Recordatorio de TensioTrack', {
          body: 'Es hora de realizar tu toma de presión arterial según el protocolo AMPA.',
          icon: 'https://cdn-icons-png.flaticon.com/512/833/833472.png',
          tag: 'tensiotrack-reminder'
        });
      }
      
      // Reset lastNotified if it's no longer a reminder time
      if (currentTime !== morningTime && currentTime !== eveningTime) {
        lastNotifiedRef.current = null;
      }
    };

    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [remindersEnabled, morningTime, eveningTime]);

  const updateReminderSettings = async (settings: Partial<{ remindersEnabled: boolean, morningTime: string, eveningTime: string }>) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, settings, { merge: true });
      setUser({ ...user, ...settings });
    } catch (error) {
      console.error("Error updating reminder settings:", error);
    }
  };

  const handleTestNotification = () => {
    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'granted') {
        new Notification('TensioTrack: Prueba de Notificación', {
          body: '¡Funciona! Recibirás recordatorios a las horas configuradas.',
          icon: 'https://cdn-icons-png.flaticon.com/512/833/833472.png',
        });
      } else {
        alert('Por favor, permite las notificaciones en tu navegador para probar esta función.');
      }
    }
  };

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const getReadingStatus = (sys: number, dia: number) => {
    if (sys >= 135 || dia >= 85) return { label: 'Hipertensión', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' };
    if (sys >= 130 || dia >= 80) return { label: 'Normal-Alta', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' };
    if (sys < 100 || dia < 60) return { label: 'Baja', color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100' };
    return { label: 'Normal', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' };
  };

  const CustomizedDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!cx || !cy) return null;
    const status = getReadingStatus(payload.systolic, payload.diastolic);
    
    if (status.label === 'Hipertensión') {
      return (
        <circle cx={cx} cy={cy} r={5} fill="#e11d48" stroke={isDarkMode ? "#0f172a" : "white"} strokeWidth={2} />
      );
    }
    if (status.label === 'Normal-Alta') {
      return (
        <circle cx={cx} cy={cy} r={5} fill="#d97706" stroke={isDarkMode ? "#0f172a" : "white"} strokeWidth={2} />
      );
    }
    return null;
  };

  const morningSession = dashboard?.today?.sessions.find(s => s.slot === 'morning');
  const eveningSession = dashboard?.today?.sessions.find(s => s.slot === 'evening');
  const latestSession = eveningSession?.avgSystolic ? eveningSession : morningSession;

  const handleClearData = () => {
    setDeleteConfirmText('');
    setShowConfirmDelete(true);
    setShowSettings(false);
  };

  const generateTestData = async () => {
    const slots: ('morning' | 'evening')[] = ['morning', 'evening'];
    const today = new Date().toISOString().split('T')[0];
    
    try {
      for (const slot of slots) {
        for (let i = 1; i <= 3; i++) {
          await addReading.mutateAsync({
            systolic: Math.floor(Math.random() * (140 - 110 + 1)) + 110,
            diastolic: Math.floor(Math.random() * (90 - 70 + 1)) + 70,
            heartRate: Math.floor(Math.random() * (80 - 60 + 1)) + 60,
            slot,
            date: today
          });
        }
      }
      setShowSettings(false);
    } catch (error) {
      console.error("Error generating test data", error);
    }
  };

  const confirmDelete = async () => {
    await clearData.mutateAsync();
    setShowConfirmDelete(false);
  };

  const confirmExport = () => {
    if (!readings) return;
    const headers = "Fecha,Hora,Sistolica(PAS),Diastolica(PAD),Pulso(FC),Toma\n";
    const rows = readings.map(r => {
      const date = new Date(r.recordedAt);
      return `${date.toLocaleDateString()},${date.toLocaleTimeString()},${r.systolic},${r.diastolic},${r.heartRate || ''},${r.order}`;
    }).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `TensioTrack_Informe_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowConfirmExport(false);
  };

  const exportToCSV = () => {
    setShowConfirmExport(true);
  };

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
        `- ${new Date(r.recordedAt).toLocaleDateString('es-ES')}: ${r.systolic}/${r.diastolic} mmHg, ${r.heartRate || '--'} lpm${r.notes ? ` (Nota: ${r.notes})` : ''}`
      ).join('\n');

      const userProfile = `
      - Género: ${user?.gender || 'No especificado'}
      - Edad: ${user?.age || 'No especificada'}
      `;

      const response = await ai.models.generateContent({
        model,
        contents: `Actúa como un asistente de salud cardiovascular experto para la aplicación TensioTrack. 
        Analiza las siguientes mediciones de presión arterial de un usuario siguiendo el Protocolo AMPA (Automedida de la Presión Arterial).
        
        Considera los siguientes umbrales médicos para AMPA:
        - Normal/Óptima: < 130/80 mmHg
        - Normal-Alta: 130-134 / 80-84 mmHg
        - Hipertensión: >= 135/85 mmHg
        
        Perfil del Usuario:
        ${userProfile}

        Mediciones Recientes:
        ${recentReadings}
        
        Proporciona un análisis detallado estructurado en las siguientes categorías:
        1. **Análisis de Tendencia**: Evaluación de si los niveles están estables, mejorando o empeorando.
        2. **Estilo de Vida (Lifestyle)**: Recomendaciones sobre actividad física, sueño y manejo del estrés.
        3. **Alimentación (Dietary)**: Consejos nutricionales específicos para mejorar la presión arterial.
        4. **Consulta Médica (Medical Consultation)**: Advertencias claras y cuándo es necesario contactar con un profesional de la salud.
        
        Responde en español, con tono profesional y formato Markdown limpio. Utiliza negritas para resaltar puntos clave.`,
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-bold animate-pulse">Cargando TensioTrack...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-2xl border border-slate-100 text-center"
        >
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-8 shadow-lg shadow-indigo-200">
            <Activity className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-display font-black text-slate-900 mb-4">TensioTrack</h1>
          <p className="text-slate-500 mb-10 leading-relaxed">
            Tu compañero inteligente para el seguimiento de la presión arterial bajo el protocolo AMPA.
          </p>
          
          <button 
            onClick={handleLogin}
            className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl active:scale-95"
          >
            <LogIn className="w-5 h-5" />
            Continuar con Google
          </button>
          
          <p className="mt-8 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
            Seguro • Privado • Multi-dispositivo
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-display font-black tracking-tight text-slate-900 dark:text-white">TensioTrack</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Protocolo AMPA</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pr-4 border-r border-slate-100 dark:border-slate-800 hidden sm:flex">
              <div className="text-right">
                <p className="text-xs font-black text-slate-900 dark:text-white leading-none mb-1">{user.displayName}</p>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">{user.email}</p>
              </div>
              <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white dark:border-slate-700 shadow-sm">
                <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            </div>
            
            <div className="flex items-center gap-2 relative">
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="w-10 h-10 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 transition-colors"
                title="Ajustes"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        {/* Welcome Section */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{formattedDate}</p>
            <h2 className="text-3xl font-display font-black text-slate-900 dark:text-white">¡Hola, {user.displayName?.split(' ')[0]}! 👋</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Es momento de cuidar tu corazón hoy.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={exportToCSV}
              className="flex items-center gap-2 px-5 h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button 
              onClick={() => setShowReport(true)}
              className="flex items-center gap-2 px-5 h-12 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none transition-all"
            >
              <FileText className="w-4 h-4" />
              Informe Médico
            </button>
          </div>
        </section>

        {/* Period Summary & Stats */}
        {dashboard?.stats && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-8 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-xl text-slate-900 dark:text-white">Resumen del Período</h3>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Análisis de 4 Niveles (AMPA)</p>
                  </div>
                </div>
                {dashboard.stats.isComplete && (
                  <div className="px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3" />
                    Período Completo
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Nivel 1: Sesión</p>
                  <div className="text-2xl font-display font-black text-slate-900 dark:text-white">
                    {latestSession?.avgSystolic || '--'}/{latestSession?.avgDiastolic || '--'}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                    {latestSession?.slot === 'evening' ? 'Sesión Noche' : 'Última sesión'}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Nivel 2: Diario</p>
                  <div className="text-2xl font-display font-black text-slate-900 dark:text-white">
                    {dashboard?.today?.avgSystolic || '--'}/{dashboard?.today?.avgDiastolic || '--'}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Promedio hoy</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Nivel 3: Período</p>
                  <div className="text-2xl font-display font-black text-slate-900 dark:text-white">
                    {dashboard?.stats.periodAverages.morning?.systolic || '--'}/{dashboard?.stats.periodAverages.morning?.diastolic || '--'}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Media 5 días</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Nivel 4: Final</p>
                  <div className="flex items-baseline gap-2">
                    <div className="text-2xl font-display font-black text-indigo-600 dark:text-indigo-400">
                      {dashboard?.stats.finalAverage?.systolic || '--'}/{dashboard?.stats.finalAverage?.diastolic || '--'}
                    </div>
                    {dashboard?.stats.finalAverage && dashboard?.stats.historicalCycles?.[0]?.finalAverage && (
                      <div className={cn(
                        "flex items-center text-[10px] font-black px-1.5 py-0.5 rounded-md",
                        dashboard.stats.finalAverage.systolic > dashboard.stats.historicalCycles[0].finalAverage.systolic
                          ? "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
                          : dashboard.stats.finalAverage.systolic < dashboard.stats.historicalCycles[0].finalAverage.systolic
                            ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                      )}>
                        {dashboard.stats.finalAverage.systolic > dashboard.stats.historicalCycles[0].finalAverage.systolic ? (
                          <TrendingUp className="w-3 h-3 mr-0.5" />
                        ) : dashboard.stats.finalAverage.systolic < dashboard.stats.historicalCycles[0].finalAverage.systolic ? (
                          <TrendingDown className="w-3 h-3 mr-0.5" />
                        ) : null}
                        {Math.abs(dashboard.stats.finalAverage.systolic - dashboard.stats.historicalCycles[0].finalAverage.systolic).toFixed(0)}
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-indigo-400">Resultado Global</p>
                </div>
              </div>

              {/* Trend Chart */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Tendencia (Últimas 10)</p>
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    <button 
                      onClick={() => setChartMode('both')}
                      className={cn(
                        "px-2 py-1 text-[8px] font-black uppercase rounded-md transition-all",
                        chartMode === 'both' ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-400 dark:text-slate-500"
                      )}
                    >Ambas</button>
                    <button 
                      onClick={() => setChartMode('systolic')}
                      className={cn(
                        "px-2 py-1 text-[8px] font-black uppercase rounded-md transition-all",
                        chartMode === 'systolic' ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-400 dark:text-slate-500"
                      )}
                    >PAS</button>
                    <button 
                      onClick={() => setChartMode('diastolic')}
                      className={cn(
                        "px-2 py-1 text-[8px] font-black uppercase rounded-md transition-all",
                        chartMode === 'diastolic' ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-400 dark:text-slate-500"
                      )}
                    >PAD</button>
                  </div>
                </div>
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={readings ? [...readings].slice(0, 10).reverse() : []}>
                      <defs>
                        <linearGradient id="colorSys" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorDia" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#818cf8" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} />
                      <XAxis dataKey="recordedAt" hide />
                      <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '1rem', 
                          border: 'none', 
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                          backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                          color: isDarkMode ? '#f1f5f9' : '#0f172a'
                        }}
                        labelFormatter={(label) => new Date(label).toLocaleDateString()}
                      />
                      {(chartMode === 'both' || chartMode === 'systolic') && (
                        <Area 
                          type="monotone" 
                          dataKey="systolic" 
                          stroke="#4f46e5" 
                          fillOpacity={1} 
                          fill="url(#colorSys)" 
                          strokeWidth={3}
                          dot={<CustomizedDot />}
                        />
                      )}
                      {(chartMode === 'both' || chartMode === 'diastolic') && (
                        <Area 
                          type="monotone" 
                          dataKey="diastolic" 
                          stroke="#818cf8" 
                          fillOpacity={chartMode === 'diastolic' ? 1 : 0} 
                          fill={chartMode === 'diastolic' ? "url(#colorDia)" : "none"}
                          strokeWidth={3}
                          dot={<CustomizedDot />}
                        />
                      )}
                      <ReferenceLine y={135} stroke={isDarkMode ? "#ef4444" : "#f43f5e"} strokeDasharray="3 3" label={{ position: 'right', value: 'PAS 135', fill: isDarkMode ? "#ef4444" : "#f43f5e", fontSize: 10, fontWeight: 'bold' }} />
                      <ReferenceLine y={85} stroke={isDarkMode ? "#f59e0b" : "#fbbf24"} strokeDasharray="3 3" label={{ position: 'right', value: 'PAD 85', fill: isDarkMode ? "#f59e0b" : "#fbbf24", fontSize: 10, fontWeight: 'bold' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-indigo-600 dark:bg-indigo-700 rounded-[2.5rem] p-8 text-white flex flex-col justify-between relative overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
              <div className="relative z-10 space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Info className="w-6 h-6" />
                </div>
                <div className="space-y-4">
                  <h4 className="font-display font-black text-2xl">Estado General</h4>
                  <p className="text-indigo-100 text-sm font-medium leading-relaxed">
                    {dashboard?.stats.finalAverage 
                      ? (dashboard.stats.finalAverage.systolic < 135 && dashboard.stats.finalAverage.diastolic < 85
                          ? "Tus niveles están dentro del rango objetivo para AMPA (<135/85). Mantén tus hábitos saludables." 
                          : "Tus niveles están por encima del objetivo recomendado. Es importante que consultes estos resultados con tu médico.")
                      : "Completa el protocolo de 5 días para obtener una evaluación precisa de tu estado cardiovascular."}
                  </p>
                </div>
                {dashboard?.stats.finalAverage && (
                  <div className="pt-4 flex items-center gap-3">
                    <div className={cn(
                      "w-3 h-3 rounded-full animate-pulse",
                      dashboard.stats.finalAverage.systolic < 135 ? "bg-emerald-400" : "bg-amber-400"
                    )} />
                    <span className="text-xs font-bold uppercase tracking-widest">
                      {dashboard.stats.finalAverage.systolic < 135 ? "Controlado" : "Revisión Necesaria"}
                    </span>
                  </div>
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mb-32 blur-3xl" />
            </div>
          </section>
        )}

        {/* Daily Status */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div 
            onClick={() => setActiveSlot('morning')}
            className={cn(
              "group relative p-8 rounded-[2rem] border-2 transition-all cursor-pointer overflow-hidden hover:-translate-y-1 hover:shadow-xl",
              morningSession?.completedAt 
                ? "bg-emerald-50/30 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/50 hover:border-emerald-200 dark:hover:border-emerald-700" 
                : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800"
            )}
          >
            <div className="relative z-10 flex flex-col h-full justify-between gap-12">
              <div className="flex items-start justify-between">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center",
                  morningSession?.completedAt ? "bg-emerald-500 text-white" : "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                )}>
                  {morningSession?.completedAt ? <CheckCircle2 className="w-7 h-7" /> : <Clock className="w-7 h-7" />}
                </div>
                <div className="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Mañana
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-display font-black mb-2 text-slate-900 dark:text-white">Sesión Matinal</h3>
                {morningSession?.completedAt ? (
                  <div className="flex items-center gap-4">
                    <div className="text-emerald-600 dark:text-emerald-400 font-mono font-black text-xl">
                      {morningSession.avgSystolic}/{morningSession.avgDiastolic}
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase">Completada</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                      {morningSession?.readings.length || 0} de 3 tomas realizadas.
                    </p>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${((morningSession?.readings.length || 0) / 3) * 100}%` }}
                        className="h-full bg-amber-500 transition-all duration-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div 
            onClick={() => setActiveSlot('evening')}
            className={cn(
              "group relative p-8 rounded-[2rem] border-2 transition-all cursor-pointer overflow-hidden hover:-translate-y-1 hover:shadow-xl",
              eveningSession?.completedAt 
                ? "bg-emerald-50/30 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/50 hover:border-emerald-200 dark:hover:border-emerald-700" 
                : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800"
            )}
          >
            <div className="relative z-10 flex flex-col h-full justify-between gap-12">
              <div className="flex items-start justify-between">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center",
                  eveningSession?.completedAt ? "bg-emerald-500 text-white" : "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                )}>
                  {eveningSession?.completedAt ? <CheckCircle2 className="w-7 h-7" /> : <Clock className="w-7 h-7" />}
                </div>
                <div className="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Noche
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-display font-black mb-2 text-slate-900 dark:text-white">Sesión Nocturna</h3>
                {eveningSession?.completedAt ? (
                  <div className="flex items-center gap-4">
                    <div className="text-emerald-600 dark:text-emerald-400 font-mono font-black text-xl">
                      {eveningSession.avgSystolic}/{eveningSession.avgDiastolic}
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase">Completada</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                      {eveningSession?.readings.length || 0} de 3 tomas realizadas.
                    </p>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${((eveningSession?.readings.length || 0) / 3) * 100}%` }}
                        className="h-full bg-indigo-500 transition-all duration-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* AI Analysis & Recommendations */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 dark:bg-slate-950 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-200 dark:shadow-none hover:-translate-y-1 hover:shadow-indigo-300/20 transition-all duration-300">
            <div className="relative z-10 flex flex-col gap-10">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-indigo-400">
                  <Brain className="w-6 h-6" />
                  <span className="text-xs font-black uppercase tracking-[0.2em]">Análisis Inteligente</span>
                </div>
                <h3 className="text-3xl font-display font-black leading-tight">Tendencias de Salud</h3>
                <p className="text-slate-400 font-medium leading-relaxed">
                  Nuestra IA analiza tus últimas mediciones para darte una visión clara de tu tendencia cardiovascular.
                </p>
                
                <AnimatePresence>
                  {aiAdvice && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="mt-6 p-6 bg-white/10 dark:bg-slate-800/50 rounded-3xl border border-white/10 dark:border-slate-800 text-sm leading-relaxed text-indigo-50 dark:text-indigo-200 whitespace-pre-wrap"
                    >
                      {aiAdvice}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button 
                onClick={getAiAdvice}
                disabled={isAnalyzing || !readings?.length}
                className="h-16 px-8 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all active:scale-95 shrink-0 disabled:opacity-50"
              >
                {isAnalyzing ? "Analizando..." : "Generar Informe IA"}
              </button>
            </div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] -mr-48 -mt-48" />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-100 dark:border-slate-800 flex flex-col gap-8 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <Lightbulb className="w-6 h-6" />
              <span className="text-xs font-black uppercase tracking-[0.2em]">Recomendaciones</span>
            </div>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white">Mantén la constancia</h5>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Para un diagnóstico preciso, intenta realizar las tomas siempre a la misma hora.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white">Reposo previo</h5>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Recuerda estar sentado y en silencio al menos 5 minutos antes de la primera toma.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white">Hidratación</h5>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Beber suficiente agua ayuda a mantener la elasticidad de tus arterias.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Comparative Analysis Section */}
        <section className="space-y-8">
          <div className="flex items-center gap-3 px-2">
            <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-2xl font-display font-black text-slate-900 dark:text-white">Análisis Comparativo</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Morning vs Evening Comparison */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="font-display font-black text-lg text-slate-900 dark:text-white">Mañana vs. Cena</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Diferencial de Presión</p>
                </div>
                {dashboard?.stats.periodAverages.morning && dashboard?.stats.periodAverages.evening && (
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                    Math.abs(dashboard.stats.periodAverages.morning.systolic - dashboard.stats.periodAverages.evening.systolic) > 10
                      ? "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
                      : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                  )}>
                    {Math.abs(dashboard.stats.periodAverages.morning.systolic - dashboard.stats.periodAverages.evening.systolic).toFixed(1)} mmHg Δ
                  </div>
                )}
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        name: 'Mañana',
                        pas: dashboard?.stats.periodAverages.morning?.systolic || 0,
                        pad: dashboard?.stats.periodAverages.morning?.diastolic || 0,
                      },
                      {
                        name: 'Cena',
                        pas: dashboard?.stats.periodAverages.evening?.systolic || 0,
                        pad: dashboard?.stats.periodAverages.evening?.diastolic || 0,
                      }
                    ]}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
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
                      contentStyle={{ 
                        borderRadius: '1rem', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                        color: isDarkMode ? '#f1f5f9' : '#0f172a'
                      }}
                      cursor={{ fill: isDarkMode ? '#1e293b' : '#f8fafc' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }} />
                    <Bar dataKey="pas" name="Sistólica (PAS)" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={40} />
                    <Bar dataKey="pad" name="Diastólica (PAD)" fill="#818cf8" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-6 text-xs text-slate-400 dark:text-slate-500 leading-relaxed italic">
                * Un diferencial superior a 15 mmHg entre mañana y noche puede requerir revisión del tratamiento por su médico.
              </p>
            </div>

            {/* Cycle Evolution */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="font-display font-black text-lg text-slate-900 dark:text-white">Evolución por Ciclos</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Promedio Final (AMPA)</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>

              <div className="h-64">
                {dashboard?.stats.historicalCycles && dashboard.stats.historicalCycles.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        ...dashboard.stats.historicalCycles.map((c, i) => ({
                          name: `Ciclo ${dashboard.stats.historicalCycles.length - i}`,
                          pas: c.finalAverage?.systolic || 0,
                          pad: c.finalAverage?.diastolic || 0,
                        })).reverse(),
                        {
                          name: 'Actual',
                          pas: dashboard.stats.finalAverage?.systolic || 0,
                          pad: dashboard.stats.finalAverage?.diastolic || 0,
                        }
                      ]}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: isDarkMode ? '#64748b' : '#94a3b8', fontSize: 10, fontWeight: 700 }}
                      />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: isDarkMode ? '#64748b' : '#94a3b8', fontSize: 10 }} />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '1rem', 
                          border: 'none', 
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                          backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                          color: isDarkMode ? '#f1f5f9' : '#0f172a'
                        }}
                      />
                      <Line type="monotone" dataKey="pas" name="PAS" stroke="#4f46e5" strokeWidth={4} dot={{ r: 6, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="pad" name="PAD" stroke="#818cf8" strokeWidth={4} dot={{ r: 6, fill: '#818cf8', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 p-6">
                    <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-400 dark:text-slate-500">Datos insuficientes</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">Completa más ciclos de 5 días para ver tendencias</p>
                    </div>
                  </div>
                )}
              </div>
              <p className="mt-6 text-xs text-slate-400 dark:text-slate-500 leading-relaxed italic">
                * Esta gráfica muestra la tendencia de tu salud cardiovascular a largo plazo.
              </p>
            </div>
          </div>
        </section>

        {/* History List */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
            <div className="flex items-center gap-3">
              <History className="w-6 h-6 text-slate-400 dark:text-slate-500" />
              <h2 className="text-2xl font-display font-black text-slate-900 dark:text-white">Historial Reciente</h2>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                <button 
                  onClick={() => setHistoryFilter('all')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                    historyFilter === 'all' ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  )}
                >
                  Todos
                </button>
                <button 
                  onClick={() => setHistoryFilter('morning')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                    historyFilter === 'morning' ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  )}
                >
                  Mañana
                </button>
                <button 
                  onClick={() => setHistoryFilter('evening')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                    historyFilter === 'evening' ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  )}
                >
                  Noche
                </button>
              </div>

              <div className="relative">
                <input 
                  type="date" 
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="h-11 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl px-4 text-xs font-bold text-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                {dateFilter && (
                  <button 
                    onClick={() => setDateFilter('')}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-slate-900 dark:bg-slate-700 text-white rounded-full flex items-center justify-center hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 max-h-[600px] overflow-y-auto pr-2 scroll-smooth custom-scrollbar">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-white dark:bg-slate-900 rounded-3xl animate-pulse border border-slate-100 dark:border-slate-800" />
                ))}
              </div>
            ) : readings?.length === 0 ? (
              <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-700">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity className="w-10 h-10 text-slate-200 dark:text-slate-700" />
                </div>
                {historyFilter !== 'all' || dateFilter !== '' ? (
                  <>
                    <h3 className="font-bold text-slate-900 dark:text-white">No hay resultados</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">No se encontraron mediciones para los filtros seleccionados.</p>
                    <button 
                      onClick={() => { setHistoryFilter('all'); setDateFilter(''); }}
                      className="text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:underline"
                    >
                      Limpiar filtros
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="font-bold text-slate-900 dark:text-white">Sin registros aún</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Comienza tu primera sesión para ver datos aquí.</p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedReadings?.map((reading, index) => {
                  const isExpanded = expandedReadingId === reading.id;
                  const status = getReadingStatus(reading.systolic, reading.diastolic);
                  
                  return (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={`${reading.id}-${index}`} 
                      className={cn(
                        "bg-white dark:bg-slate-900 rounded-3xl border transition-all duration-300 overflow-hidden",
                        isExpanded ? "border-indigo-200 dark:border-indigo-800 shadow-lg ring-1 ring-indigo-50 dark:ring-indigo-900/20" : "border-slate-100 dark:border-slate-800 hover:border-indigo-100 dark:hover:border-indigo-900 hover:shadow-md"
                      )}
                    >
                      <div 
                        onClick={() => setExpandedReadingId(isExpanded ? null : reading.id)}
                        className="p-6 flex items-center justify-between cursor-pointer group"
                      >
                        <div className="flex items-center gap-6">
                          <div className={cn(
                            "w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-mono transition-colors",
                            isExpanded ? "bg-indigo-600 text-white" : "bg-slate-50 dark:bg-slate-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30"
                          )}>
                            <span className={cn(
                              "text-xl font-black leading-none",
                              isExpanded ? "text-white" : "text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                            )}>{reading.systolic}</span>
                            <span className={cn(
                              "text-[10px] font-bold uppercase",
                              isExpanded ? "text-indigo-200" : "text-slate-400 dark:text-slate-500"
                            )}>{reading.diastolic}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn(
                                "text-xs font-black uppercase tracking-widest",
                                isExpanded ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400"
                              )}>
                                {reading.order === 1 ? '1ª Toma' : reading.order === 2 ? '2ª Toma' : '3ª Toma'}
                              </span>
                              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                                {new Date(reading.recordedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1.5">
                                <Heart className="w-4 h-4 text-rose-500" />
                                <span className="text-sm font-black text-slate-900 dark:text-white">{reading.heartRate || '--'} <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">lpm</span></span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                  {new Date(reading.recordedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                            status.bg, status.color, status.border
                          )}>
                            {status.label}
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-indigo-400 dark:text-indigo-500" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-200 dark:text-slate-700 group-hover:text-indigo-300 dark:group-hover:text-indigo-600 transition-colors" />
                          )}
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
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Momento</p>
                                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                    {reading.slot === 'morning' ? 'Mañana' : 'Noche'} • {new Date(reading.recordedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                  </p>
                                </div>
                                <div className={cn("p-4 rounded-2xl border", status.bg, status.border)}>
                                  <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", status.color)}>Estado Clínico</p>
                                  <p className={cn("text-sm font-bold", status.color)}>{status.label}</p>
                                </div>
                              </div>
                              
                              {reading.notes && (
                                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                                  <div className="flex items-center gap-2 mb-2 text-indigo-600 dark:text-indigo-400">
                                    <MessageSquare className="w-4 h-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Notas del paciente</p>
                                  </div>
                                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic">
                                    "{reading.notes}"
                                  </p>
                                </div>
                              )}

                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingReading(reading);
                                }}
                                className="w-full py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                              >
                                <Settings className="w-3.5 h-3.5" />
                                Editar esta toma
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}

                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-6">
                    <button 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-100 dark:hover:border-indigo-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-1 p-1 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                      {[3, 6].map(size => (
                        <button
                          key={size}
                          onClick={() => {
                            setPageSize(size);
                            setCurrentPage(1);
                          }}
                          className={cn(
                            "px-3 py-1 rounded-lg text-[10px] font-black transition-all",
                            pageSize === size 
                              ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" 
                              : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                          )}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <button 
                          key={i}
                          onClick={() => setCurrentPage(i + 1)}
                          className={cn(
                            "w-8 h-8 rounded-lg text-[10px] font-black transition-all",
                            currentPage === i + 1 
                              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none" 
                              : "bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                          )}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                    <button 
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-100 dark:hover:border-indigo-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReport(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-black text-slate-900 dark:text-white">Informe para el Médico</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Resumen Protocolo AMPA</p>
                  </div>
                </div>
                <button onClick={() => setShowReport(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">
                  <X className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                </button>
              </div>

              <div className="p-8 max-h-[70vh] overflow-y-auto space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total Lecturas</p>
                    <p className="text-3xl font-display font-black text-slate-900 dark:text-white">{allReadings?.length || 0}</p>
                  </div>
                  <div className="p-6 bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl border border-indigo-100 dark:border-indigo-800">
                    <p className="text-[10px] font-black text-indigo-400 dark:text-indigo-500 uppercase tracking-widest mb-1">Resultado Global (AMPA)</p>
                    <p className="text-3xl font-display font-black text-indigo-600 dark:text-indigo-400">
                      {dashboard?.stats.finalAverage 
                        ? `${dashboard.stats.finalAverage.systolic}/${dashboard.stats.finalAverage.diastolic}`
                        : '--/--'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-display font-black text-lg flex items-center gap-2 text-slate-900 dark:text-white">
                    <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Resumen de Niveles
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Media Mañanas</p>
                      <p className="text-xl font-display font-black text-slate-900 dark:text-white">
                        {dashboard?.stats.periodAverages.morning?.systolic || '--'}/{dashboard?.stats.periodAverages.morning?.diastolic || '--'}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Media Noches</p>
                      <p className="text-xl font-display font-black text-slate-900 dark:text-white">
                        {dashboard?.stats.periodAverages.evening?.systolic || '--'}/{dashboard?.stats.periodAverages.evening?.diastolic || '--'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-display font-black text-lg flex items-center gap-2 text-slate-900 dark:text-white">
                    <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Promedios Diarios (Últimos 5 Días Completos)
                  </h3>
                  <div className="border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                        <tr>
                          <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400">Día</th>
                          <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400">Mañana (PAS/PAD)</th>
                          <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400">Cena (PAS/PAD)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {dashboard?.stats.periodDays.map((day, idx) => (
                          <tr key={idx} className="bg-white dark:bg-slate-900">
                            <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-300">Día {idx + 1}</td>
                            <td className="px-6 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                              {day.morningAvg ? `${day.morningAvg.systolic}/${day.morningAvg.diastolic}` : '--/--'}
                            </td>
                            <td className="px-6 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                              {day.eveningAvg ? `${day.eveningAvg.systolic}/${day.eveningAvg.diastolic}` : '--/--'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-display font-black text-lg flex items-center gap-2 text-slate-900 dark:text-white">
                    <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Últimas Mediciones Individuales
                  </h3>
                  <div className="border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                        <tr>
                          <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400">Fecha/Hora</th>
                          <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400">PAS/PAD</th>
                          <th className="px-6 py-4 font-bold text-slate-500 dark:text-slate-400">Pulso</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {allReadings?.slice(0, 10).map((r) => (
                          <tr key={r.id} className="bg-white dark:bg-slate-900">
                            <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-300">
                              {new Date(r.recordedAt).toLocaleDateString()} {new Date(r.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-6 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                              {r.systolic}/{r.diastolic}
                            </td>
                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                              {r.heartRate || '--'} lpm
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="p-6 bg-amber-50 dark:bg-amber-900/20 rounded-3xl border border-amber-100 dark:border-amber-900/30">
                  <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed italic">
                    * Este informe sigue las guías de la ESH/ESC para la automedición domiciliaria. 
                    Los promedios mostrados son calculados automáticamente por el sistema TensioTrack.
                  </p>
                </div>
              </div>

              <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex gap-4">
                <button 
                  onClick={() => window.print()}
                  className="flex-1 h-14 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-slate-600 transition-all"
                >
                  <Download className="w-5 h-5" />
                  Imprimir / PDF
                </button>
              </div>
            </motion.div>
          </div>
        )}

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

        {showConfirmExport && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmExport(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-800 text-center"
            >
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto mb-6">
                <Download className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-display font-black text-slate-900 dark:text-white mb-2">Exportar datos</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                ¿Deseas descargar tu historial de mediciones en formato CSV?
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={confirmExport}
                  className="w-full h-14 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none"
                >
                  Descargar CSV
                </button>
                <button 
                  onClick={() => setShowConfirmExport(false)}
                  className="w-full h-14 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showConfirmDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowConfirmDelete(false);
                setDeleteConfirmText('');
              }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-800 text-center"
            >
              <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto mb-6">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-display font-black text-slate-900 dark:text-white mb-2">¿Borrar todos los datos?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                Esta acción eliminará permanentemente todo tu historial de mediciones. No se puede deshacer.
              </p>
              
              <div className="mb-6 space-y-2 text-left">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                  Escribe "ELIMINAR" para confirmar
                </label>
                <input 
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                  placeholder="ELIMINAR"
                  className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                />
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={confirmDelete}
                  disabled={clearData.isPending || deleteConfirmText !== 'ELIMINAR'}
                  className="w-full h-14 bg-rose-600 text-white rounded-2xl font-black hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 dark:shadow-none disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                >
                  {clearData.isPending ? 'Borrando...' : 'Sí, borrar todo'}
                </button>
                <button 
                  onClick={() => {
                    setShowConfirmDelete(false);
                    setDeleteConfirmText('');
                  }}
                  className="w-full h-14 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showProfile && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProfile(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white">
                    <UserIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-display font-black text-slate-900 dark:text-white">Mi Perfil</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Personaliza tu experiencia</p>
                  </div>
                </div>
                <button onClick={() => setShowProfile(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <X className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Género</label>
                  <select 
                    value={user?.gender || ''}
                    onChange={async (e) => {
                      const gender = e.target.value;
                      const userRef = doc(db, 'users', user.uid);
                      await setDoc(userRef, { gender }, { merge: true });
                      setUser({ ...user, gender });
                    }}
                    className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-2xl px-5 text-sm font-bold focus:ring-0 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-slate-900 dark:text-white"
                  >
                    <option value="">No especificado</option>
                    <option value="male">Masculino</option>
                    <option value="female">Femenino</option>
                    <option value="other">Otro</option>
                    <option value="prefer-not-to-say">Prefiero no decirlo</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Edad</label>
                  <input 
                    type="number"
                    value={user?.age || ''}
                    onChange={async (e) => {
                      const age = parseInt(e.target.value) || 0;
                      const userRef = doc(db, 'users', user.uid);
                      await setDoc(userRef, { age }, { merge: true });
                      setUser({ ...user, age });
                    }}
                    placeholder="Ej: 45"
                    className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-2xl px-5 text-sm font-bold focus:ring-0 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all text-slate-900 dark:text-white"
                  />
                </div>

                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 flex gap-3">
                  <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <p className="text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed">
                    Esta información ayuda a la IA a proporcionar consejos más precisos y personalizados según tu perfil demográfico.
                  </p>
                </div>

                <button 
                  onClick={() => setShowProfile(false)}
                  className="w-full h-14 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none transition-all"
                >
                  Guardar Cambios
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {editingReading && (
          <EditReadingModal 
            reading={editingReading} 
            onClose={() => setEditingReading(null)} 
          />
        )}

        {showInfo && (
          <InfoModal onClose={() => setShowInfo(false)} />
        )}

        {showSettings && (
          <SettingsModal 
            user={user}
            onClose={() => setShowSettings(false)}
            onLogout={handleLogout}
            onClearData={handleClearData}
            onExport={exportToCSV}
            onGenerateTestData={generateTestData}
            isDarkMode={isDarkMode}
            onToggleDarkMode={toggleDarkMode}
            remindersEnabled={remindersEnabled}
            morningTime={morningTime}
            eveningTime={eveningTime}
            onToggleReminders={() => {
              const newValue = !remindersEnabled;
              setRemindersEnabled(newValue);
              updateReminderSettings({ remindersEnabled: newValue });
            }}
            onUpdateMorningTime={(time) => {
              setMorningTime(time);
              updateReminderSettings({ morningTime: time });
            }}
            onUpdateEveningTime={(time) => {
              setEveningTime(time);
              updateReminderSettings({ eveningTime: time });
            }}
            onTestNotification={handleTestNotification}
            onOpenProfile={() => {
              setShowProfile(true);
              setShowSettings(false);
            }}
            onOpenInfo={() => {
              setShowInfo(true);
              setShowSettings(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-6 py-20 border-t border-slate-100 dark:border-slate-800 text-center space-y-6">
        <div className="flex items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
            <Activity className="w-4 h-4" />
          </div>
          <span className="font-display font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-xs">TensioTrack</span>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 max-w-md mx-auto leading-relaxed font-medium">
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
