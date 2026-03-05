import { GoogleGenAI, Type } from "@google/genai";
import { EmailRequest } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateEmail(request: EmailRequest) {
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

  const result = JSON.parse(response.text || "{}");
  return result as { subject: string; body: string };
}
