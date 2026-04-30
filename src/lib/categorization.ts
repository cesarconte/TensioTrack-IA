import { GoogleGenAI } from "@google/genai";
import { firebaseService } from "./api";

export const categorizeNote = async (note: string | null | undefined): Promise<string | null> => {
  if (!note || note.trim() === '') return null;

  try {
    const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env.VITE_GEMINI_API_KEY;
    if (!apiKey) return null;

    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Categoriza la siguiente nota de salud en una de estas categorías: 'estrés', 'dieta', 'sueño', 'ejercicio', 'medicación', 'alcohol/tabaco', 'otro'.
      Nota: "${note}".
      Responde solo con la palabra de la categoría en minúsculas.`,
    });

    if (response.usageMetadata?.totalTokenCount) {
      firebaseService.updateAITokenUsage(response.usageMetadata.totalTokenCount).catch(console.error);
    }

    const category = response.text?.trim().toLowerCase();
    const validCategories = ['estrés', 'dieta', 'sueño', 'ejercicio', 'medicación', 'alcohol/tabaco', 'otro'];
    
    return validCategories.includes(category || '') ? category! : 'otro';
  } catch (error) {
    console.error("Categorization error:", error);
    return 'otro';
  }
};
