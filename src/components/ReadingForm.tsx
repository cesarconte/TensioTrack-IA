import * as React from "react";
import { useAppStore } from "../store/useAppStore";
import { useAddReading, useUpdateReading, useDeleteReading, useDashboard } from "../lib/api";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/Button";
import { CloseButton } from "./ui/CloseButton";
import { Badge } from "./ui/Badge";
import { toast } from "sonner";
import { GoogleGenAI, Type } from "@google/genai";
import { firebaseService } from "../lib/api";
import { getBloodPressureStatus, getBloodPressureStyle, getPulseStatus, getPulseStyle } from "../domain/health";
import { X, Camera, Minus, Plus, RefreshCw, Save, Trash2, Heart, Mic, MicOff } from "lucide-react";

function parseVoiceTranscriptLocally(transcript: string): {
  systolic: number | null;
  diastolic: number | null;
  pulse: number | null;
  notes: string | null;
} {
  let text = transcript
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const numberWords: { [key: string]: number } = {
    cero: 0, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9,
    diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17,
    dieciocho: 18, diecinueve: 19, veinte: 20, veintiuno: 21, veintidos: 22, veintitres: 23,
    veinticuatro: 24, veinticinco: 25, veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29,
    treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90,
    cien: 100, ciento: 100
  };

  const parseSpanishWordsToDigits = (s: string) => {
    let result = s;
    const tens = ["noventa", "ochenta", "setenta", "sesenta", "cincuenta", "cuarenta", "treinta", "veinte"];
    const units = ["nueve", "ocho", "siete", "seis", "cinco", "cuatro", "tres", "dos", "uno"];

    for (const t of tens) {
      for (const u of units) {
        const word = `${t} y ${u}`;
        const val = numberWords[t] + numberWords[u];
        result = result.replace(new RegExp(`\\b${word}\\b`, 'g'), val.toString());
      }
    }

    const veintis = ["veintiuno", "veintidos", "veintitres", "veinticuatro", "veinticinco", "veintiseis", "veintisiete", "veintiocho", "veintinueve"];
    veintis.forEach((v, idx) => {
      result = result.replace(new RegExp(`\\b${v}\\b`, 'g'), (21 + idx).toString());
    });

    Object.keys(numberWords).sort((a,b) => b.length - a.length).forEach(word => {
      result = result.replace(new RegExp(`\\b${word}\\b`, 'g'), numberWords[word].toString());
    });

    result = result.replace(/\b100\s+(\d+)\b/g, (_, num) => (100 + parseInt(num)).toString());
    result = result.replace(/\b(30|40|50|60|70|80|90)\s+(\d)\b/g, (_, ten, unit) => (parseInt(ten) + parseInt(unit)).toString());

    return result;
  };

  text = parseSpanishWordsToDigits(text);

  const numbers = text.match(/\b\d+\b/g)?.map(Number) || [];

  let systolic: number | null = null;
  let diastolic: number | null = null;
  let pulse: number | null = null;
  let notes: string | null = null;

  const pulseRegex = /(?:pulso|pulsaciones|ppm|frecuencia|corazon)\s*(?:de|es|de\s*de)?\s*(\d+)|(\d+)\s*(?:ppm|pulsaciones|de\s*pulso|de\s*frecuencia)/i;
  const pulseMatch = text.match(pulseRegex);
  if (pulseMatch) {
    const pulseVal = Number(pulseMatch[1] || pulseMatch[2]);
    if (pulseVal >= 30 && pulseVal <= 250) {
      pulse = pulseVal;
      text = text.replace(pulseMatch[0], " ");
    }
  }

  const remainingNumbers = text.match(/\b\d+\b/g)?.map(Number) || [];

  if (remainingNumbers.length >= 2) {
    let first = remainingNumbers[0];
    let second = remainingNumbers[1];

    if (first >= 60 && first <= 300 && second >= 40 && second <= 200) {
      systolic = first;
      diastolic = second;
    } else if (second >= 60 && second <= 300 && first >= 40 && first <= 200) {
      systolic = second;
      diastolic = first;
    }
  }

  if (!systolic || !diastolic) {
    const candidatePAS = numbers.filter(n => n >= 60 && n <= 300);
    const candidatePAD = numbers.filter(n => n >= 40 && n <= 200);

    if (candidatePAS.length > 0 && candidatePAD.length > 0) {
      let found = false;
      for (const pas of candidatePAS) {
        for (const pad of candidatePAD) {
          if (pas > pad && pas !== pulse && pad !== pulse) {
            systolic = pas;
            diastolic = pad;
            found = true;
            break;
          }
        }
        if (found) break;
      }
    }
  }

  const notesKeywords = ["cabeza", "dolor", "mareo", "cansado", "pastilla", "medicina", "despues", "antes", "ejercicio", "cafe"];
  const containsNotes = notesKeywords.some(kw => transcript.toLowerCase().includes(kw));
  if (containsNotes) {
    notes = transcript;
  }

  return { systolic, diastolic, pulse, notes };
}

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
    if (isEditing && editingReading) {
      setSystolic(editingReading.systolic.toString());
      setDiastolic(editingReading.diastolic.toString());
      setPulse(editingReading.heartRate?.toString() || '');
      setNotes(editingReading.notes || '');
      toast.info("Valores originales restaurados");
    } else {
      setSystolic('');
      setDiastolic('');
      setPulse('');
      setNotes('');
      toast.info("Formulario restablecido");
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

        toast.success(`Lectura ${displayStep} guardada correctamente`);

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

  const adjustValue = (setter: React.Dispatch<React.SetStateAction<string>>, fallback: number, delta: number) => {
    setter((prev) => {
      const parsed = parseInt(prev);
      const val = isNaN(parsed) ? fallback : parsed;
      const newVal = val + delta;
      return newVal > 0 ? newVal.toString() : '1';
    });
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

      // 1. Try local parsing first (offline-friendly, 0ms latency)
      const localData = parseVoiceTranscriptLocally(transcript);
      if (localData.systolic && localData.diastolic) {
        setSystolic(localData.systolic.toString());
        setDiastolic(localData.diastolic.toString());
        if (localData.pulse) setPulse(localData.pulse.toString());
        if (localData.notes) setNotes(localData.notes);
        toast.success("Lectura procesada localmente");
        setIsProcessingVoice(false);
        return;
      }

      // 2. Check network connectivity for fallback
      const isOnline = typeof window !== 'undefined' ? window.navigator.onLine : true;
      if (!isOnline) {
        toast.error("No se pudo interpretar el dictado localmente. Di algo como: '120 con 80' o '130 sobre 85 con 70 de pulso'");
        setIsProcessingVoice(false);
        return;
      }

      // 3. Online Gemini API Fallback
      try {
        const envProcess = typeof process !== 'undefined' ? process.env : undefined;
        const apiKey = envProcess?.GEMINI_API_KEY || (import.meta as any).env.VITE_GEMINI_API_KEY;
        if (!apiKey) throw new Error("API Key missing");

        const ai = new GoogleGenAI(apiKey) as any;
        const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Extrae PAS (sistólica), PAD (diastólica), FC (pulso) y cualquier comentario o nota relevante de: "${transcript}".
        Responde solo JSON: {"systolic": number, "diastolic": number, "pulse": number|null, "notes": string|null}`;
        const result = await model.generateContent(prompt);

        if (result.response?.usageMetadata?.totalTokenCount) {
          firebaseService.updateAITokenUsage(result.response.usageMetadata.totalTokenCount).catch(console.error);
        }

        const data = JSON.parse(result.response.text().replace(/```json|```/g, ''));

        if (data.systolic) setSystolic(data.systolic.toString());
        if (data.diastolic) setDiastolic(data.diastolic.toString());
        if (data.pulse) setPulse(data.pulse.toString());
        if (data.notes) setNotes(data.notes);
        toast.success("Lectura procesada por voz (Gemini AI)");
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

      if (result.response?.usageMetadata?.totalTokenCount) {
        firebaseService.updateAITokenUsage(result.response.usageMetadata.totalTokenCount).catch(console.error);
      }

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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-title"
      className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-md overflow-y-auto"
    >
      <div className="flex min-h-full items-center justify-center p-4 py-8 sm:p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-2xl bg-surface-low rounded-[3rem] p-6 sm:p-10 md:p-12 shadow-2xl relative overflow-hidden"
        >
          <CloseButton
            onClick={handleClose}
            label="Cerrar formulario"
            className="absolute top-6 right-6 z-10"
          />

          {/* Abstract background element */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-container/10 rounded-full blur-3xl"></div>

        {/* Header Section */}
        <div className="mb-6 sm:mb-10 relative">
          <h1 id="form-title" className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight font-display mb-1 sm:mb-2">
            {isEditing ? 'Editar Lectura' : 'Nueva Lectura'}
          </h1>
          <p className="text-xs sm:text-sm font-semibold tracking-widest text-primary uppercase opacity-80">
            {isEditing
              ? `MODIFICANDO REGISTRO DEL ${new Date(editingReading.recordedAt).toLocaleDateString('es-ES')}`
              : `SESIÓN ${currentSlot === 'morning' ? 'MAÑANA' : 'NOCHE'} • LECTURA ${displayStep} DE 3`
            }
          </p>
        </div>

        {/* Contextual Action Buttons */}
        <div className="flex gap-3 sm:gap-4 mb-6 sm:mb-10">
          <button
            type="button"
            onClick={toggleVoiceInput}
            className="flex-1 flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 bg-surface-highest rounded-2xl text-on-surface font-semibold hover:bg-surface-high transition-all active:scale-95 text-sm sm:text-base"
          >
            {isListening ? <MicOff className="text-primary text-xl sm:text-2xl" /> : <Mic className="text-primary text-xl sm:text-2xl" />}
            {isListening ? "Detener" : "Voz"}
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 bg-surface-highest rounded-2xl text-on-surface font-semibold hover:bg-surface-high transition-all active:scale-95 text-sm sm:text-base"
          >
            <Camera className="text-primary text-xl sm:text-2xl" />
            Foto
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            capture="environment"
            onChange={handleImageUpload}
            aria-label="Seleccionar foto de lectura de presión arterial"
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Measurement Fields Grid */}
          <div className="space-y-4 sm:space-y-6">
            {/* Systolic (PAS) */}
            <div className="bg-surface-high p-5 sm:p-6 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 transition-all">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <label htmlFor="pas-input" className="text-sm sm:text-base font-bold text-on-surface-variant tracking-wider uppercase cursor-pointer">SISTÓLICA (PAS)</label>
                  {sys > 0 && dia > 0 && (
                    <Badge className={cn("px-3 py-1 border-none text-[9px] font-black tracking-widest leading-none rounded-full", getBloodPressureStyle(getBloodPressureStatus(sys, dia)).bg, getBloodPressureStyle(getBloodPressureStatus(sys, dia)).color)}>
                      {getBloodPressureStyle(getBloodPressureStatus(sys, dia)).label}
                    </Badge>
                  )}
                </div>
                <span className="text-xs sm:text-sm text-on-surface-variant/60 font-medium">Presión Alta (mmHg)</span>
              </div>
              <div className="flex items-center justify-between md:justify-end gap-2 sm:gap-4 px-2 sm:px-0">
                <button type="button" onClick={() => adjustValue(setSystolic, 111, -1)} aria-label="Disminuir presión sistólica en 1 unidad" className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-2xl bg-surface-low flex items-center justify-center text-primary group-hover:bg-surface-lowest active:scale-90 transition-transform">
                  <Minus className="font-bold text-2xl sm:text-3xl" />
                </button>
                <input
                  id="pas-input"
                  type="number"
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value)}
                  className="w-24 sm:w-32 text-6xl sm:text-7xl font-extrabold text-on-surface font-display text-center bg-transparent border-none focus:ring-0 p-0 placeholder:text-on-surface"
                  placeholder="111"
                  required
                />
                <button type="button" onClick={() => adjustValue(setSystolic, 111, 1)} aria-label="Aumentar presión sistólica en 1 unidad" className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-2xl bg-surface-low flex items-center justify-center text-primary group-hover:bg-surface-lowest active:scale-90 transition-transform">
                  <Plus className="font-bold text-2xl sm:text-3xl" />
                </button>
              </div>
            </div>

            {/* Diastolic (PAD) */}
            <div className="bg-surface-high p-5 sm:p-6 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 transition-all">
              <div className="flex flex-col">
                <label htmlFor="pad-input" className="text-sm sm:text-base font-bold text-on-surface-variant tracking-wider uppercase cursor-pointer">DIASTÓLICA (PAD)</label>
                <span className="text-xs sm:text-sm text-on-surface-variant/60 font-medium">Presión Baja (mmHg)</span>
              </div>
              <div className="flex items-center justify-between md:justify-end gap-2 sm:gap-4 px-2 sm:px-0">
                <button type="button" onClick={() => adjustValue(setDiastolic, 77, -1)} aria-label="Disminuir presión diastólica en 1 unidad" className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-2xl bg-surface-low flex items-center justify-center text-primary active:scale-90 transition-transform">
                  <Minus className="font-bold text-2xl sm:text-3xl" />
                </button>
                <input
                  id="pad-input"
                  type="number"
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value)}
                  className="w-24 sm:w-32 text-6xl sm:text-7xl font-extrabold text-on-surface font-display text-center bg-transparent border-none focus:ring-0 p-0 placeholder:text-on-surface"
                  placeholder="77"
                  required
                />
                <button type="button" onClick={() => adjustValue(setDiastolic, 77, 1)} aria-label="Aumentar presión diastólica en 1 unidad" className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-2xl bg-surface-low flex items-center justify-center text-primary active:scale-90 transition-transform">
                  <Plus className="font-bold text-2xl sm:text-3xl" />
                </button>
              </div>
            </div>

            {/* Pulse (FC) */}
            <div className="bg-surface-high p-5 sm:p-6 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 transition-all">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <label htmlFor="pulse-input" className="text-sm sm:text-base font-bold text-on-surface-variant tracking-wider uppercase cursor-pointer">FRECUENCIA CARDÍACA (FC)</label>
                  <Heart className="text-destructive text-lg sm:text-xl fill-current" />
                  {fc > 0 && (
                    <Badge className={cn("px-3 py-1 border-none text-[9px] font-black tracking-widest leading-none rounded-full", getPulseStyle(getPulseStatus(fc)).bg, getPulseStyle(getPulseStatus(fc)).color)}>
                      {getPulseStyle(getPulseStatus(fc)).label}
                    </Badge>
                  )}
                </div>
                <span className="text-xs sm:text-sm text-on-surface-variant/60 font-medium">Latidos por minuto</span>
              </div>
              <div className="flex items-center justify-between md:justify-end gap-2 sm:gap-4 px-2 sm:px-0">
                <button type="button" onClick={() => adjustValue(setPulse, 68, -1)} aria-label="Disminuir frecuencia cardíaca en 1 unidad" className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-2xl bg-surface-low flex items-center justify-center text-primary active:scale-90 transition-transform">
                  <Minus className="font-bold text-2xl sm:text-3xl" />
                </button>
                <input
                  id="pulse-input"
                  type="number"
                  value={pulse}
                  onChange={(e) => setPulse(e.target.value)}
                  className="w-24 sm:w-32 text-6xl sm:text-7xl font-extrabold text-on-surface font-display text-center bg-transparent border-none focus:ring-0 p-0 placeholder:text-on-surface"
                  placeholder="68"
                />
                <button type="button" onClick={() => adjustValue(setPulse, 68, 1)} aria-label="Aumentar frecuencia cardíaca en 1 unidad" className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-2xl bg-surface-low flex items-center justify-center text-primary active:scale-90 transition-transform">
                  <Plus className="font-bold text-2xl sm:text-3xl" />
                </button>
              </div>
            </div>

            {/* Notes Section */}
            <div className="flex flex-col gap-2 sm:gap-3 mt-2 sm:mt-4">
              <label htmlFor="notes-input" className="text-[10px] sm:text-xs font-bold text-on-surface-variant tracking-widest ml-4 uppercase cursor-pointer">NOTAS</label>
              <textarea
                id="notes-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-surface-high border-none rounded-[2rem] p-4 sm:p-6 text-sm sm:text-base text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/50"
                rows={2}
                placeholder="Desayuno ligero"
              />
            </div>
          </div>

          {/* Bottom Actions Section */}
          <div className="mt-8 sm:mt-10 flex flex-col gap-6">
            {/* Primary Actions (Grouped) */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full">
              <button
                type="button"
                onClick={handleReset}
                disabled={!isDirty}
                className="w-full sm:w-auto h-12 px-6 text-sm sm:text-base text-on-surface-variant font-bold rounded-full hover:bg-surface-highest transition-colors active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <RefreshCw className="text-lg sm:text-xl" />
                Restablecer
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="w-full sm:w-auto h-12 px-6 sm:px-8 text-sm sm:text-base bg-surface-highest text-on-surface-variant font-bold rounded-full hover:bg-surface-high transition-colors active:scale-95 border-none flex items-center justify-center gap-2"
              >
                <X className="text-lg sm:text-xl" />
                Cancelar
              </button>

              <button
                type="submit"
                className="w-full sm:w-auto h-12 px-6 sm:px-8 text-sm sm:text-base bg-primary text-primary-foreground font-bold rounded-full shadow-[0_8px_20px_rgba(103,80,165,0.25)] flex items-center justify-center gap-2 sm:gap-3 hover:bg-primary/90 hover:shadow-lg transition-all active:scale-95"
              >
                <Save className="text-lg sm:text-xl" />
                Guardar
              </button>
            </div>

            {/* Destructive Action (Row 2 - Only in Edit Mode) */}
            {isEditing && (
              <div className="flex justify-center border-t border-border pt-6">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full sm:w-auto text-destructive font-bold flex items-center justify-center gap-2 px-6 py-3 sm:py-4 rounded-full hover:bg-destructive/5 transition-all active:scale-95 group text-sm sm:text-base"
                >
                  <Trash2 className="text-lg sm:text-xl group-hover:scale-110 transition-transform" />
                  Eliminar lectura
                </button>
              </div>
            )}
          </div>
        </form>
        </motion.div>
      </div>

      {/* Confirmation modal on closing with dirty changes */}
      {showConfirmClose && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-close-title"
          className="fixed inset-0 z-[250] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="bg-white dark:bg-card p-6 sm:p-8 rounded-[2rem] max-w-sm w-full text-center space-y-6 shadow-2xl">
            <h4 id="confirm-close-title" className="text-xl font-black text-foreground">¿Descartar cambios?</h4>
            <p className="text-sm text-on-surface-variant font-medium leading-relaxed">Tienes cambios sin guardar en el formulario. ¿Estás seguro de que deseas salir?</p>
            <div className="flex gap-4 pt-2">
              <Button variant="secondary" className="flex-1 rounded-full font-bold" onClick={() => setShowConfirmClose(false)}>Cancelar</Button>
              <Button variant="danger" className="flex-1 rounded-full font-bold" onClick={forceClose}>Descartar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation modal on deleting reading */}
      {showDeleteConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-delete-title"
          className="fixed inset-0 z-[250] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="bg-white dark:bg-card p-6 sm:p-8 rounded-[2rem] max-w-sm w-full text-center space-y-6 shadow-2xl">
            <h4 id="confirm-delete-title" className="text-xl font-black text-destructive">¿Eliminar lectura?</h4>
            <p className="text-sm text-on-surface-variant font-medium leading-relaxed">Esta acción no se puede deshacer. Se borrará permanentemente de tu historial médico.</p>
            <div className="flex gap-4 pt-2">
              <Button variant="secondary" className="flex-1 rounded-full font-bold" onClick={() => setShowDeleteConfirm(false)}>Cancelar</Button>
              <Button variant="danger" className="flex-1 rounded-full font-bold" onClick={handleDelete}>Eliminar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
