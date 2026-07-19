import { GoogleGenerativeAI } from '@google/generative-ai';

export const GEMINI_AVAILABLE = Boolean(process.env.GEMINI_API_KEY);

let genAI;
if (GEMINI_AVAILABLE) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

export async function callGemini({ system, prompt }) {
  if (!GEMINI_AVAILABLE) {
    throw new Error('NO_API_KEY');
  }
  const model = genAI.getGenerativeModel({
    model: 'gemini-flash-latest',
    systemInstruction: system,
    generationConfig: { maxOutputTokens: 512 },
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
}
