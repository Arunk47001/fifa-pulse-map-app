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
    generationConfig: {
      maxOutputTokens: 512,
      // Extraction and answer-phrasing here are simple, single-step tasks —
      // extended thinking only burns tokens and risks eating the output
      // budget before the model finishes writing (observed: truncated JSON).
      thinkingConfig: { thinkingBudget: 0 },
    },
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
}
