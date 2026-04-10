import * as React from "react";
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { 
  MessageSquare, 
  X, 
  Send, 
  Loader2, 
  Bot, 
  User as UserIcon,
  TrendingUp,
  Heart,
  Calendar,
  ChevronDown,
  Sparkles
} from "lucide-react";
import { cn } from "../lib/utils";
import { Reading } from "../types";
import ReactMarkdown from "react-markdown";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/Tooltip";
import { useAppStore } from "../store/useAppStore";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatAssistantProps {
  readings: Reading[];
  userProfile: any;
}

export function ChatAssistant({ readings, userProfile }: ChatAssistantProps) {
  const { activeTab } = useAppStore();
  const [isOpen, setIsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([
    { 
      role: 'assistant', 
      content: `¡Hola! Soy tu asistente de TensioTrack. Puedo analizar tu historial de presión arterial, explicarte tendencias o darte consejos de salud basados en tus datos. ¿En qué puedo ayudarte hoy?` 
    }
  ]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const messageContent = textToSend || input.trim();
    if (!messageContent || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: messageContent }]);
    setIsLoading(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: "⚠️ No se detectó la clave de API de Gemini. Por favor, configúrala en el menú de Secrets." 
        }]);
        setIsLoading(false);
        return;
      }

      const ai = new GoogleGenAI(apiKey) as any;
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const recentReadings = readings.slice(0, 30).map(r => 
        `- ${new Date(r.recordedAt).toLocaleString()}: ${r.systolic}/${r.diastolic} mmHg, ${r.heartRate || '--'} lpm`
      ).join('\n');

      const systemInstruction = `Eres un asistente de salud cardiovascular experto para TensioTrack. 
      Ayuda al usuario a entender sus mediciones siguiendo el Protocolo AMPA.
      
      REGLAS:
      1. Usa los datos del usuario para respuestas personalizadas.
      2. Tono profesional y empático.
      3. ADVERTENCIA: No eres médico. Si hay dudas graves, deben consultar a un profesional.
      4. CRISIS: Si Sistólica > 180 o Diastólica > 120, insta a buscar atención médica inmediata.
      5. Responde en español usando Markdown.
      
      PERFIL DEL USUARIO:
      - Edad: ${userProfile?.age || 'N/A'} años
      - Sexo: ${userProfile?.sex === 'male' ? 'Hombre' : userProfile?.sex === 'female' ? 'Mujer' : 'N/A'}
      - Peso: ${userProfile?.weight || 'N/A'} kg
      - Altura: ${userProfile?.height || 'N/A'} cm
      - Fumador: ${userProfile?.isSmoker ? 'Sí' : 'No'}
      - Diabetes: ${userProfile?.hasDiabetes ? 'Sí' : 'No'}
      - Medicado para HTA: ${userProfile?.isHypertensiveMedicated ? 'Sí' : 'No'}
      - Nivel de actividad: ${userProfile?.activityLevel || 'N/A'}
      
      Historial reciente:
      ${recentReadings}
      `;

      const chat = model.startChat({
        history: messages.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        })),
        generationConfig: {
          maxOutputTokens: 1000,
        },
      });

      // Insert system instruction as a prefix to the first message if it's the start, 
      // or just as context for the model. 
      // For simplicity with startChat, we'll just send the message.
      
      const result = await chat.sendMessage(messageContent);
      const responseText = result.response.text();
      
      setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Lo siento, hubo un error al procesar tu mensaje. Por favor, inténtalo de nuevo." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    { text: "¿Cómo van mis tendencias?", icon: <TrendingUp className="w-3 h-3" /> },
    { text: "¿Mi presión es normal?", icon: <Heart className="w-3 h-3" /> },
    { text: "Resumen de esta semana", icon: <Calendar className="w-3 h-3" /> },
  ];

  const hasBottomBar = activeTab === 'settings' ? true : false; // Settings has bar up to lg
  const isMobileNavVisible = !hasBottomBar && activeTab !== 'settings'; // Layout has bar only on xs

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className={cn(
              "fixed right-4 sm:right-6 w-16 h-16 rounded-3xl bg-indigo-600 text-white shadow-2xl flex items-center justify-center z-50 transition-all duration-300",
              // Positioning logic:
              // 1. If in settings: bar is visible up to lg. So bottom-24 until lg.
              // 2. If not in settings: bar is visible only on xs (sm:hidden). So bottom-24 on xs, bottom-6 from sm up.
              activeTab === 'settings' 
                ? "bottom-24 lg:bottom-6" 
                : "bottom-24 sm:bottom-6",
              isOpen && "scale-0 opacity-0 pointer-events-none"
            )}
            aria-label="Abrir asistente de IA"
          >
            <MessageSquare className="w-7 h-7" />
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full border-4 border-white dark:border-slate-900 animate-pulse" />
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="left">Abrir asistente de IA</TooltipContent>
      </Tooltip>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              "fixed inset-0 sm:inset-auto sm:right-6 w-full sm:w-[420px] h-full sm:h-[650px] sm:max-h-[85vh] bg-white dark:bg-slate-900 sm:rounded-[2.5rem] shadow-2xl flex flex-col z-50 overflow-hidden border-none sm:border border-slate-200 dark:border-slate-800",
              activeTab === 'settings'
                ? "sm:bottom-24 lg:bottom-6"
                : "sm:bottom-6"
            )}
          >
            <div className="p-5 bg-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Bot className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-display font-black text-base">Asistente IA</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80">En línea</span>
                  </div>
                </div>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                    aria-label="Cerrar asistente"
                  >
                    <ChevronDown className="w-6 h-6" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Cerrar asistente</TooltipContent>
              </Tooltip>
            </div>

            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50 dark:bg-slate-950/50"
            >
              {messages.map((msg, i) => (
                <motion.div
                  initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i}
                  className={cn(
                    "flex gap-3 max-w-[90%]",
                    msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                  )}
                >
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                    msg.role === 'user' ? "bg-indigo-100 text-indigo-600" : "bg-indigo-600 text-white"
                  )}>
                    {msg.role === 'user' ? <UserIcon className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>
                  <div className={cn(
                    "p-4 rounded-[1.5rem] text-sm shadow-sm",
                    msg.role === 'user' 
                      ? "bg-indigo-600 text-white rounded-tr-none" 
                      : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-700"
                  )}>
                    <div className="markdown-body prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex gap-3 max-w-[90%]">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="p-4 rounded-[1.5rem] rounded-tl-none bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    <span className="text-xs font-bold text-slate-500">Analizando datos...</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
              {messages.length === 1 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(q.text)}
                      className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400 transition-all border border-transparent hover:border-indigo-100 dark:hover:border-indigo-800"
                    >
                      {q.icon}
                      {q.text}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Haz una pregunta..."
                  aria-label="Escribe tu pregunta para el asistente"
                  className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl px-5 py-3.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleSend()}
                      disabled={!input.trim() || isLoading}
                      className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
                      aria-label="Enviar mensaje"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Enviar mensaje</TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center justify-center gap-2 mt-4">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <p className="text-[9px] text-slate-400 uppercase tracking-[0.2em] font-black">
                  TensioTrack AI Assistant
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
