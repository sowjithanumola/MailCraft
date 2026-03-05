import { GoogleGenAI, Type } from "@google/genai";
import { EmailRequest } from "../types";

const apiKey = process.env.GEMINI_API_KEY || "";
if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set in the environment.");
}
const ai = new GoogleGenAI({ apiKey });

export async function generateEmail(request: EmailRequest) {
  if (!apiKey) {
    throw new Error("API key not found. Please ensure GEMINI_API_KEY is set in your environment variables.");
  }
  
  // Using gemini-3-flash-preview as recommended in the guidelines
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

  // Retry logic for 503 errors
  let lastError: any;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      // Create a promise that rejects after 15 seconds
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Request timed out after 15 seconds")), 15000)
      );

      const generatePromise = ai.models.generateContent({
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

      // Race the generation against the timeout
      const response = await Promise.race([generatePromise, timeoutPromise]) as any;

      const result = JSON.parse(response.text || "{}");
      return result as { subject: string; body: string };
    } catch (error: any) {
      lastError = error;
      const isRetryable = 
        error?.message?.includes('503') || 
        error?.message?.includes('high demand') || 
        error?.message?.includes('UNAVAILABLE') ||
        error?.message?.includes('timed out');
      
      if (isRetryable && attempt < 3) {
        console.warn(`Attempt ${attempt} failed. Retrying in ${attempt * 2}s...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}
