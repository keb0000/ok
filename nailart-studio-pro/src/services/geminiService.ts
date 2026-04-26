import { GoogleGenAI } from "@google/genai";
import { NailDesign } from "../constants";

let genAI: GoogleGenAI | null = null;

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error("Gemini API Key is not configured. Please add it to your environment variables.");
  }
  if (!genAI) {
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

export async function generateNailDesign(prompt: string): Promise<Partial<NailDesign>> {
  const ai = getGenAI();

  const systemInstruction = `
    You are a professional nail artist AI. Based on the user's request, return a JSON object representing the nail design.
    The response must follow this structure:
    {
      "color": "HEX_CODE",
      "baseColor": "HEX_CODE",
      "shape": "square" | "almond" | "stiletto" | "round" | "duck" | "ballerina",
      "texture": "glossy" | "matte",
      "art": "none" | "french",
      "length": number (0.8 to 2.5),
      "parts": ["id1"]
    }
    Only return the JSON object, nothing else.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
    }
  });
  
  try {
    const text = response.text || "";
    const jsonStr = text.match(/\{.*\}/s)?.[0] || text;
    return JSON.parse(jsonStr);
  } catch (e) {
    return {};
  }
}

export async function extractDesignFromImage(base64Image: string): Promise<Partial<NailDesign>> {
  const ai = getGenAI();

  const prompt = "Identify the nail design in this image. Return a JSON object with: { \"color\": \"hex\", \"baseColor\": \"hex\", \"shape\": \"almond\"|\"square\"|\"stiletto\"|\"round\"|\"duck\"|\"ballerina\", \"texture\": \"glossy\"|\"matte\", \"art\": \"none\"|\"french\", \"length\": 0.8-2.5, \"parts\": string[] }.";

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { text: prompt },
        {
          inlineData: {
            data: base64Image.split(",")[1],
            mimeType: "image/jpeg",
          },
        },
      ]
    },
    config: {
      responseMimeType: "application/json",
    }
  });

  try {
    const text = response.text || "";
    const jsonStr = text.match(/\{.*\}/s)?.[0] || text;
    return JSON.parse(jsonStr);
  } catch (e) {
    return {};
  }
}
