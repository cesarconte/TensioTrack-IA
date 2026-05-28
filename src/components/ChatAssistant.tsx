import * as React from "react";
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { Reading } from "../types";
import ReactMarkdown from "react-markdown";
import { Button } from "./ui/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/Tooltip";
import { useAppStore } from "../store/useAppStore";
import { firebaseService } from "../lib/api";
import { TrendingUp, Heart, CalendarDays, MessageCircle, Bot, ChevronDown, User, RefreshCw, Send, Sparkles } from "lucide-react";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatAssistantProps {
  readings: Reading[];
  userProfile: any;
}

export function ChatAssistant({ readings, userProfile }: ChatAssistantProps) {
  const { activeTab, isScrollingDown, user } = useAppStore();
  const [isOpen, setIsOpen] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const isDoctor = user?.role === 'doctor';
  
  const [messages, setMessages] = React.useState<Message[]>([
    { 
      role: 'assistant', 
      content: `¡Hola! Soy tu asistente de TensioTrack. Puedo analizar tu historial de presión arterial, explicarte tendencias o darte consejos de salud basados en tus datos. ¿En qué puedo ayudarte hoy?` 
    }
  ]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

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
      // Safely access env vars
      const envProcess = typeof process !== 'undefined' ? process.env : undefined;
      const apiKey = envProcess?.GEMINI_API_KEY || (import.meta as any).env.VITE_GEMINI_API_KEY;
      
      if (!apiKey) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: "⚠️ No se detectó la clave de API de Gemini. Por favor, configúrala en el menú de Secrets." 
        }]);
        setIsLoading(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const recentReadings = readings.slice(0, 30).map(r => 
        `- ${new Date(r.recordedAt).toLocaleString()}: ${r.systolic}/${r.diastolic} mmHg, ${r.heartRate || '--'} ppm`
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

      // We need to use generateContent instead of startChat because the new SDK handles chat history differently via contents array
      const historyContents = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));
      
      historyContents.push({ role: 'user', parts: [{ text: messageContent }] });

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: historyContents,
        config: {
          systemInstruction,
        }
      });
      
      if (response.usageMetadata?.totalTokenCount) {
        firebaseService.updateAITokenUsage(response.usageMetadata.totalTokenCount).catch(console.error);
      }
      
      const responseText = response.text;
      
      setMessages(prev => [...prev, { role: 'assistant', content: responseText || "Mensaje vacío" }]);

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
    { text: "¿Cómo van mis tendencias?", icon: <TrendingUp className="text-[16px]" /> },
    { text: "¿Mi presión es normal?", icon: <Heart className="text-[16px]" /> },
    { text: "Resumen de esta semana", icon: <CalendarDays className="text-[16px]" /> },
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
              "fixed right-4 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 rounded-[1.75rem] sm:rounded-[2rem] bg-primary text-white shadow-2xl shadow-primary/20 flex items-center justify-center z-40 transition-all duration-300",
              // Positioning logic:
              // Mobile/Tablet: nav bar is visible up to lg (lg:hidden). 
              // If Patient: sit ABOVE Nueva Lectura FAB (11.5rem). If Doctor: sit at normal FAB position (6rem/bottom-24).
              // lg up: sit at bottom-6.
              !isDoctor ? "bottom-[11.5rem] lg:bottom-6" : "bottom-24 lg:bottom-6",
              (isOpen || isScrollingDown) && "scale-0 opacity-0 pointer-events-none translate-y-8"
            )}
            aria-label="Abrir asistente de IA"
          >
            <MessageCircle className="text-[24px] sm:text-[28px]" />
            <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-[var(--destructive)] rounded-full border-2 border-white dark:border-[#121116] shadow-sm animate-pulse" />
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
              "fixed inset-0 sm:inset-auto sm:right-6 w-full sm:w-[420px] h-full sm:h-[650px] sm:max-h-[85vh] bg-card sm:rounded-[2.5rem] shadow-2xl flex flex-col z-40 overflow-hidden border-none sm:border border-border",
              // Positioning logic:
              // Chat window on Mobile is full screen. On tablet/desktop it's a popup.
              // On tablet (sm to lg), nav bar is visible at bottom, so it needs bottom-24. On desktop (lg+), no nav bar, so bottom-6.
              "sm:bottom-24 lg:bottom-6"
            )}
          >
            <div className="p-5 bg-primary text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Bot className="text-[28px]" />
                </div>
                <div>
                  <h3 className="font-display font-black text-base">Asistente IA</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80">En línea</span>
                  </div>
                </div>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-full transition-all hover:scale-110 active:scale-90"
                    aria-label="Cerrar asistente"
                  >
                    <ChevronDown className="text-[24px]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Cerrar asistente</TooltipContent>
              </Tooltip>
            </div>

            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-surface-low"
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
                    "w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                    msg.role === 'user' ? "bg-primary/10 text-primary" : "bg-primary text-white"
                  )}>
                    {msg.role === 'user' ? <User className="text-[20px]" /> : <Bot className="text-[20px]" />}
                  </div>
                  <div className={cn(
                    "p-4 rounded-2xl text-sm shadow-sm",
                    msg.role === 'user' 
                      ? "bg-primary text-white rounded-tr-none" 
                      : "bg-card text-foreground rounded-tl-none border border-border"
                  )}>
                    <div className="markdown-body prose prose-sm dark:prose-invert max-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex gap-3 max-w-[90%]">
                  <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                    <Bot className="text-[20px]" />
                  </div>
                  <div className="p-4 rounded-2xl rounded-tl-none bg-card border border-border shadow-sm flex items-center gap-3">
                    <RefreshCw className="text-[16px] animate-spin text-primary" />
                    <span className="text-xs font-bold text-on-surface-variant">Analizando datos...</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-card border-t border-border">
              {messages.length === 1 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {suggestedQuestions.map((q, i) => (
                    <Button
                      key={i}
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSend(q.text)}
                      className="text-[10px] font-black uppercase tracking-widest"
                    >
                      {q.icon}
                      {q.text}
                    </Button>
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
                  className="flex-1 bg-surface-low border-none rounded-full px-5 py-3.5 text-sm font-medium focus:ring-2 focus:ring-primary text-foreground"
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => handleSend()}
                      disabled={!input.trim() || isLoading}
                      size="icon"
                      aria-label="Enviar mensaje"
                    >
                      <Send className="text-[20px]" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Enviar mensaje</TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center justify-center gap-2 mt-4">
                <Sparkles className="text-[12px] text-primary bg-primary/10 p-1 rounded-lg" />
                <p className="text-[9px] text-on-surface-variant uppercase tracking-[0.2em] font-black">
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
