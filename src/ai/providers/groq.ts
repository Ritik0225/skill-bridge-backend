import Groq from "groq-sdk";
import { env } from "../../config/env.js";
import type { AIGenerateInput, AIProvider } from "../types.js";

/**
 * Fallback provider — Groq (free tier, runs open models like Llama).
 * Uses OpenAI-compatible JSON mode.
 */
export class GroqProvider implements AIProvider {
  readonly name = "groq";
  private client: Groq | null = null;

  isConfigured(): boolean {
    return Boolean(env.GROQ_API_KEY);
  }

  async generateJSON({ system, user }: AIGenerateInput): Promise<string> {
    if (!env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not set");
    }
    this.client ??= new Groq({ apiKey: env.GROQ_API_KEY });

    const res = await this.client.chat.completions.create({
      model: env.GROQ_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    return res.choices[0]?.message?.content ?? "";
  }
}
