import * as React from "react";
import { useAppStore } from "../store/useAppStore";
import { useAddReading, useUpdateReading, useDeleteReading, useDashboard } from "../lib/api";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { 
  Heart, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  X,
  Mic,
  MicOff,
  Loader2,
  Camera,
  Plus,
  Minus,
  MessageSquare,
  Save,
  Trash2
} from "lucide-react";
import { Button } from "./ui/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/Tooltip";
import { Badge } from "./ui/Badge";
import { toast } from "sonner";
import { GoogleGenAI, Type } from "@google/genai";

interface ReadingFormProps {
  onClose: () => void;
}

export function ReadingForm({ onClose }: ReadingFormProps) {
  const { data: dashboard } = useDashboard();
  const { editingReading, setEditingReading } = useAppStore();
  const [systolic, setSystolic] = React.useState(editingReading?.systolic.toString() || '');
  const [diastolic, setDiastolic] = React.useState(editingReading?.diastolic.toString() || '');
  const [pulse, setPulse] = React.useState(editingReading?.heartRate?.toString() || '');
  const [notes, setNotes] = React.useState(editingReading?.notes || '');
  const [error, setError] = React.useState<string | null>(null);
  const [showConfirmClose, setShowConfirmClose] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  
  const [isListening, setIsListening] = React.useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = React.useState(false);
  const [isProcessingImage, setIsProcessingImage] = React.useState(false);
  const recognitionRef = React.useRef<any>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const addReading = useAddReading();
  const updateReading = useUpdateReading();
  const deleteReading = useDeleteReading();

  const isEditing = !!editingReading;

  // Check if form is "dirty" (has changes)
  const isDirty = React.useMemo(() => {
    if (!isEditing) {
      return systolic !== '' || diastolic !== '' || pulse !== '' || notes !== '';
    }
    return (
      systolic !== editingReading.systolic.toString() ||
      diastolic !== editingReading.diastolic.toString() ||
      pulse !== (editingReading.heartRate?.toString() || '') ||
      notes !== (editingReading.notes || '')
    );
  }, [isEditing, editingReading, systolic, diastolic, pulse, notes]);

  const handleClose = () => {
    if (isDirty) {
      setShowConfirmClose(true);
    } else {
      forceClose();
    }
  };

  const forceClose = () => {
    setEditingReading(null);
    onClose();
  };

  const handleReset = () => {
    if (editingReading) {
      setSystolic(editingReading.systolic.toString());
      setDiastolic(editingReading.diastolic.toString());
      setPulse(editingReading.heartRate?.toString() || '');
      setNotes(editingReading.notes || '');
      toast.info("Valores restablecidos");
    }
  };

  const handleClear = () => {
    setSystolic('');
    setDiastolic('');
    setPulse('');
    setNotes('');
    toast.info("Formulario limpiado");
  };

  const handleDelete = async () => {
    if (!editingReading) return;
    setShowDeleteConfirm(false);
    try {
      await deleteReading.mutateAsync(editingReading.id);
      toast.success("Lectura eliminada");
      forceClose();
    } catch (err) {
      toast.error("Error al eliminar");
    }
  };

  // Determine current slot
  const morningSession = dashboard?.today?.sessions.find(s => s.slot === 'morning');
  const eveningSession = dashboard?.today?.sessions.find(s => s.slot === 'evening');
  
  const currentSlot: 'morning' | 'evening' = isEditing 
    ? editingReading.slot 
    : ((morningSession?.readings.length || 0) < 3 ? 'morning' : 'evening');
    
  const currentToma = isEditing 
    ? editingReading.order - 1
    : ((currentSlot === 'morning' ? morningSession?.readings.length : eveningSession?.readings.length) || 0);
    
  const displayStep = currentToma + 1;

  const sys = parseInt(systolic) || 0;
  const dia = parseInt(diastolic) || 0;
  const fc = parseInt(pulse) || 0;

  const getStatus = () => {
    if (sys === 0 || dia === 0) return 'none';
    if (sys >= 135 || dia >= 85) return 'danger';
    if (sys >= 130 || dia >= 80) return 'warning';
    if (sys < 100 || dia < 60) return 'low';
    return 'normal';
  };

  const status = getStatus();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (sys < 60 || sys > 300 || dia < 40 || dia > 200) {
      setError("Valores de presión arterial fuera de rango médico.");
      return;
    }

    try {
      if (isEditing) {
        await updateReading.mutateAsync({
          id: editingReading.id,
          systolic: sys,
          diastolic: dia,
          heartRate: fc || undefined,
          notes: notes.trim() || undefined,
        });
        toast.success("Lectura actualizada correctamente");
        handleClose();
      } else {
        await addReading.mutateAsync({
          systolic: sys,
          diastolic: dia,
          heartRate: fc || undefined,
          slot: currentSlot,
          notes: notes.trim() || undefined,
          date: new Date().toISOString().split('T')[0]
        });
        
        toast.success(`Toma ${displayStep} guardada correctamente`);
        
        if (displayStep < 3) {
          setSystolic('');
          setDiastolic('');
          setPulse('');
          setNotes('');
        } else {
          handleClose();
        }
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    }
  };

  const adjustValue = (setter: React.Dispatch<React.SetStateAction<string>>, current: string, delta: number) => {
    const val = parseInt(current) || 120;
    setter((val + delta).toString());
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const win = window as any;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Tu navegador no soporta reconocimiento de voz");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'es-ES';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsProcessingVoice(true);
      try {
        const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env.VITE_GEMINI_API_KEY;
        if (!apiKey) throw new Error("API Key missing");
        
        const ai = new GoogleGenAI(apiKey) as any;
        const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = `Extrae PAS (sistólica), PAD (diastólica), FC (pulso) y cualquier comentario o nota relevante de: "${transcript}". 
        Responde solo JSON: {"systolic": number, "diastolic": number, "pulse": number|null, "notes": string|null}`;
        const result = await model.generateContent(prompt);
        const data = JSON.parse(result.response.text().replace(/```json|```/g, ''));
        
        if (data.systolic) setSystolic(data.systolic.toString());
        if (data.diastolic) setDiastolic(data.diastolic.toString());
        if (data.pulse) setPulse(data.pulse.toString());
        if (data.notes) setNotes(data.notes);
        toast.success("Lectura procesada por voz");
      } catch (err) {
        toast.error("No se pudo entender la voz");
      } finally {
        setIsProcessingVoice(false);
      }
    };
    recognition.start();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key missing");
      
      const ai = new GoogleGenAI(apiKey) as any;
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
      });
      const base64 = await base64Promise;

      const prompt = "Analiza esta imagen de un tensiómetro y extrae los valores de presión sistólica (SYS), diastólica (DIA) y pulso (PULSE). Responde solo JSON: {\"systolic\": number, \"diastolic\": number, \"pulse\": number|null}";
      
      const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64, mimeType: file.type } }
      ]);
      
      const text = result.response.text();
      const data = JSON.parse(text.replace(/```json|```/g, ''));
      
      if (data.systolic) setSystolic(data.systolic.toString());
      if (data.diastolic) setDiastolic(data.diastolic.toString());
      if (data.pulse) setPulse(data.pulse.toString());
      toast.success("Lectura extraída de la imagen");
    } catch (err) {
      console.error(err);
      toast.error("No se pudo procesar la imagen");
    } finally {
      setIsProcessingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 my-auto"
      >
        <div className={cn(
          "p-6 flex items-center justify-between border-b transition-colors",
          status === 'danger' ? "bg-rose-50/50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/30" : 
          status === 'warning' ? "bg-amber-50/50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30" :
          status === 'normal' ? "bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30" :
          "bg-slate-50/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800"
        )}>
          <div className="flex items-center gap-4 min-w-0">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0",
              status === 'danger' ? "bg-rose-600 shadow-rose-200 dark:shadow-none" : 
              status === 'warning' ? "bg-amber-500 shadow-amber-200 dark:shadow-none" :
              status === 'normal' ? "bg-emerald-500 shadow-emerald-200 dark:shadow-none" :
              "bg-indigo-600 shadow-indigo-200 dark:shadow-none"
            )}>
              <Activity className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xl font-display font-black text-slate-900 dark:text-white truncate">
                {isEditing ? 'Editar Lectura' : 'Nueva Lectura'}
              </h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">
                {isEditing 
                  ? `Modificando registro del ${new Date(editingReading.recordedAt).toLocaleDateString('es-ES')}`
                  : `Sesión ${currentSlot === 'morning' ? 'Mañana' : 'Noche'} • Toma ${displayStep} de 3`
                }
              </p>
            </div>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={handleClose} 
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors shrink-0"
                aria-label="Cerrar formulario"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Cerrar formulario</TooltipContent>
          </Tooltip>
        </div>

        <AnimatePresence>
          {showConfirmClose && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-900/30 p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-200">
                    Tienes cambios sin guardar. ¿Deseas salir de todos modos?
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setShowConfirmClose(false)}>
                    Continuar editando
                  </Button>
                  <Button size="sm" variant="danger" onClick={forceClose}>
                    Salir sin guardar
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {showDeleteConfirm && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-rose-50 dark:bg-rose-900/20 border-b border-rose-100 dark:border-rose-900/30 p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  <p className="text-xs font-bold text-rose-800 dark:text-rose-200">
                    ¿Eliminar esta lectura permanentemente?
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                    Cancelar
                  </Button>
                  <Button size="sm" variant="danger" onClick={handleDelete}>
                    Eliminar
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-8 space-y-8">
          {/* AI Tools */}
          <div className="flex items-center gap-3">
            <Button 
              variant="secondary" 
              className="flex-1" 
              onClick={toggleVoiceInput}
              isLoading={isProcessingVoice}
            >
              {isListening ? <MicOff className="w-4 h-4 text-rose-500" /> : <Mic className="w-4 h-4" />}
              {isListening ? "Detener" : "Voz"}
            </Button>
            <Button 
              variant="secondary" 
              className="flex-1"
              onClick={() => fileInputRef.current?.click()}
              isLoading={isProcessingImage}
            >
              <Camera className="w-4 h-4" />
              Foto
            </Button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              capture="environment" 
              onChange={handleImageUpload}
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sistólica (PAS)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                    className="w-full h-16 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 font-mono text-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="120"
                    required
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" onClick={() => adjustValue(setSystolic, systolic, 1)} className="p-1 text-slate-400 hover:text-indigo-600" aria-label="Aumentar sistólica"><Plus className="w-4 h-4" /></button>
                      </TooltipTrigger>
                      <TooltipContent side="left">Aumentar sistólica</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" onClick={() => adjustValue(setSystolic, systolic, -1)} className="p-1 text-slate-400 hover:text-indigo-600" aria-label="Disminuir sistólica"><Minus className="w-4 h-4" /></button>
                      </TooltipTrigger>
                      <TooltipContent side="left">Disminuir sistólica</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Diastólica (PAD)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                    className="w-full h-16 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 font-mono text-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="80"
                    required
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" onClick={() => adjustValue(setDiastolic, diastolic, 1)} className="p-1 text-slate-400 hover:text-indigo-600" aria-label="Aumentar diastólica"><Plus className="w-4 h-4" /></button>
                      </TooltipTrigger>
                      <TooltipContent side="left">Aumentar diastólica</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" onClick={() => adjustValue(setDiastolic, diastolic, -1)} className="p-1 text-slate-400 hover:text-indigo-600" aria-label="Disminuir diastólica"><Minus className="w-4 h-4" /></button>
                      </TooltipTrigger>
                      <TooltipContent side="left">Disminuir diastólica</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Frecuencia Cardíaca (FC)</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={pulse}
                  onChange={(e) => setPulse(e.target.value)}
                  className="w-full h-16 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 pr-24 font-mono text-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="72"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <div className="flex flex-col gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" onClick={() => adjustValue(setPulse, pulse, 1)} className="p-1 text-slate-400 hover:text-indigo-600 transition-colors" aria-label="Aumentar frecuencia cardíaca"><Plus className="w-4 h-4" /></button>
                      </TooltipTrigger>
                      <TooltipContent side="left">Aumentar frecuencia cardíaca</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" onClick={() => adjustValue(setPulse, pulse, -1)} className="p-1 text-slate-400 hover:text-indigo-600 transition-colors" aria-label="Disminuir frecuencia cardíaca"><Minus className="w-4 h-4" /></button>
                      </TooltipTrigger>
                      <TooltipContent side="left">Disminuir frecuencia cardíaca</TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1" />
                  <Heart className="w-6 h-6 text-rose-500 animate-pulse" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notas</label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full min-h-[100px] bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                placeholder="¿Alguna observación?"
              />
            </div>

            {error && (
              <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 text-sm font-bold border border-rose-100 dark:border-rose-900/30">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button 
                type="submit" 
                className="w-full h-16 text-lg" 
                isLoading={isEditing ? updateReading.isPending : addReading.isPending}
                variant={status === 'danger' ? 'danger' : status === 'warning' ? 'secondary' : 'primary'}
              >
                {isEditing ? (
                  <>
                    <Save className="w-5 h-5" />
                    Guardar Cambios
                  </>
                ) : (
                  <>
                    {displayStep === 3 ? "Finalizar Sesión" : "Siguiente Toma"}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>

              {isEditing && (
                <div className="grid grid-cols-3 gap-3">
                  <Button 
                    type="button" 
                    variant="secondary" 
                    className="h-12"
                    onClick={handleReset}
                    disabled={!isDirty}
                  >
                    Restablecer
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="h-12 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                    onClick={() => setShowDeleteConfirm(true)}
                    isLoading={deleteReading.isPending}
                  >
                    Eliminar
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="h-12"
                    onClick={handleClose}
                  >
                    Cancelar
                  </Button>
                </div>
              )}

              {!isEditing && (
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    type="button" 
                    variant="secondary" 
                    className="h-12"
                    onClick={handleClear}
                    disabled={!isDirty}
                  >
                    Limpiar
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="h-12"
                    onClick={handleClose}
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
