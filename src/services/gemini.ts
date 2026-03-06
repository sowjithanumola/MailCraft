import { GoogleGenAI, Type } from "@google/genai";
import { EmailRequest } from "../types";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export async function generateEmail(request: EmailRequest) {
  if (!apiKey) {
    throw new Error("API key not found. Please ensure GEMINI_API_KEY is set in your environment variables.");
  }
  
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Generate a professional email based on the following details:
    - Purpose: ${request.purpose}
    - Recipient: ${request.recipient}
    - Tone: ${request.tone}
    - Key Points: ${request.keyPoints}
    - Length: ${request.length}
    - Language: ${request.language}

    Please provide the response in JSON format with "subject" and "body" fields.
    The body should include a proper greeting, the main content, and a professional closing.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            body: { type: Type.STRING }
          },
          required: ["subject", "body"]
        }
      }
    });

    if (!response.text) {
      throw new Error("No response text received from AI");
    }

    const result = JSON.parse(response.text);
    return result as { subject: string; body: string };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Re-throw with a cleaner message if possible
    if (error?.message?.includes('503') || error?.message?.includes('high demand')) {
      throw new Error("The AI service is currently busy. Please try again in a few seconds.");
    }
    if (error?.message?.includes('403') || error?.message?.includes('leaked')) {
      throw new Error("API Key issue detected. Please check your security settings.");
    }
    throw error;
  }
}
