import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Question } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const questionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          correctAnswerIndex: { type: Type.INTEGER },
          explanation: { type: Type.STRING },
          category: { type: Type.STRING }
        },
        required: ["text", "options", "correctAnswerIndex", "explanation", "category"]
      }
    }
  },
  required: ["questions"]
};

// Helper for Robust IDs
const generateRobustId = (prefix: string) => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const analyzeExamImage = async (base64Image: string): Promise<Question[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: "Analyze this image. If it contains a multiple-choice exam (QCM) or educational text related to Moroccan Police/Law/History, extract the questions and SOLVE them. If unrelated, return []." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: questionSchema,
        systemInstruction: "Expert DGSN exam corrector. Only analyze exam papers. Provide clear explanations in Arabic."
      }
    });
    const data = JSON.parse(response.text || "{}");
    return (data.questions || []).map((q: any) => ({ ...q, id: generateRobustId('extracted') }));
  } catch (error) {
    console.error("OCR Error:", error);
    throw new Error("Failed to analyze image.");
  }
};

export const generatePracticeQuestions = async (existingQuestions: Question[], focusCategory?: string): Promise<Question[]> => {
  try {
    const isSpecific = focusCategory && focusCategory !== 'الكل' && focusCategory !== 'عام';
    
    const categoryPrompt = isSpecific
      ? `GENERATE QUESTIONS EXCLUSIVELY FOR THIS CATEGORY: "${focusCategory}".`
      : `Cover all DGSN domains: History, Geography, Law, Police, International.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `GENERATE EXACTLY 20 QCM questions.
      ${categoryPrompt}
      
      **FORMAT:**
      - Arabic Language.
      - 4 options per question.
      - 1 correct answer.
      - Include 30% Hard, 40% Medium, 30% Easy questions.
      - EXPLANATION: Detailed, citing laws/dates where possible.
      
      **QUALITY:**
      - Factually accurate (2024-2025).
      - Professional DGSN style.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: questionSchema,
        systemInstruction: "You are an elite DGSN exam specialist. High difficulty, precise legal/historical facts."
      }
    });

    const data = JSON.parse(response.text || "{}");
    return (data.questions || []).map((q: any) => ({ ...q, id: generateRobustId('ai-gen') }));
  } catch (error) {
    console.error("Generation Error:", error);
    throw new Error("Failed to generate questions.");
  }
};