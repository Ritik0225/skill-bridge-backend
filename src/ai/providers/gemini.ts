import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env.js";
import type { AIGenerateInput, AIProvider } from "../types.js";

/**
 * Default provider — Google Gemini (free tier).
 * Uses JSON response mode so the model returns parseable JSON.
 */
export class GeminiProvider implements AIProvider {
  readonly name = "gemini";
  private client: GoogleGenerativeAI | null = null;

  isConfigured(): boolean {
    return Boolean(env.GEMINI_API_KEY);
  }

  async generateJSON({ system, user }: AIGenerateInput): Promise<string> {
    if (!env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    this.client ??= new GoogleGenerativeAI(env.GEMINI_API_KEY);

    const model = this.client.getGenerativeModel({
      model: env.GEMINI_MODEL,
      systemInstruction: system,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const result = await model.generateContent(user);
    return result.response.text();
  }
}
