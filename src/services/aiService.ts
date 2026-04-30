import { GoogleGenAI } from "@google/genai";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { firebaseService } from "../lib/api";

// Initialize Gemini API
const getApiKey = () => {
  const envProcess = typeof process !== 'undefined' ? process.env : undefined;
  return envProcess?.GEMINI_API_KEY || (import.meta as any).env.VITE_GEMINI_API_KEY;
};

export const getCachedAnalysis = async (type: 'bp' | 'pulse', period: string) => {
  const user = auth.currentUser;
  if (!user) return null;

  const today = new Date().toISOString().split('T')[0];
  const docId = `${type}_${period}_${today}`;
  const docRef = doc(db, `users/${user.uid}/ai_analysis`, docId);

  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data().analysis;
  }
  return null;
};

export const generateAndCacheAnalysis = async (
  type: 'bp' | 'pulse',
  period: string,
  dataStr: string
) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const today = new Date().toISOString().split('T')[0];
  const docId = `${type}_${period}_${today}`;
  const docRef = doc(db, `users/${user.uid}/ai_analysis`, docId);

  const prompt = type === 'bp' 
    ? `Actúa como un cardiólogo experto. Analiza los siguientes datos de presión arterial de un paciente (protocolo AMPA) para el período de ${period}. Los datos son: ${dataStr}. Proporciona un análisis médico breve, profesional y fácil de entender para el paciente (máximo 3-4 líneas). Destaca tendencias importantes, si la presión está controlada, y si hay algún motivo de alerta. No uses formato markdown complejo, solo texto plano o negritas simples.`
    : `Actúa como un cardiólogo experto. Analiza los siguientes datos de frecuencia cardíaca (pulso) de un paciente para el período de ${period}. Los datos son: ${dataStr}. Proporciona un análisis médico breve, profesional y fácil de entender para el paciente (máximo 3-4 líneas). Destaca tendencias, si el pulso está en rangos normales (60-100 ppm), y si hay episodios de taquicardia o bradicardia. No uses formato markdown complejo, solo texto plano o negritas simples.`;

  const apiKey = getApiKey();
  if (!apiKey) throw new Error("No Gemini API key available");
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  const analysis = response.text || "No se pudo generar el análisis.";
  
  if (response.usageMetadata?.totalTokenCount) {
    firebaseService.updateAITokenUsage(response.usageMetadata.totalTokenCount).catch(console.error);
  }

  // Save to cache
  await setDoc(docRef, {
    analysis,
    type,
    period,
    createdAt: new Date().toISOString(),
    userUid: user.uid
  });

  return analysis;
};
