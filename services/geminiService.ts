
import { GoogleGenAI, Type } from "@google/genai";
import { MathProblem, Operator } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateMathProblems(count: number): Promise<MathProblem[]> {
  // Static data is handled in App.tsx for performance and reliability
  return [];
}

export async function judgeDrawing(base64Data: string, expectedOperator: Operator): Promise<boolean> {
  try {
    const base64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/png", data: base64 } },
          { text: `Đây là hình vẽ nét thô của một đứa trẻ. Bé đang vẽ dấu so sánh "${expectedOperator}". Đúng hay sai? Trả về JSON { "isMatch": boolean }.` }
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { isMatch: { type: Type.BOOLEAN } },
          required: ["isMatch"],
        },
      },
    });
    const result = JSON.parse(response.text || '{"isMatch": false}');
    return !!result.isMatch;
  } catch (error) {
    console.error("Judge drawing error:", error);
    return false;
  }
}
