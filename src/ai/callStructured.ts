import type { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { logger } from "../config/logger.js";
import { badGateway, serviceUnavailable } from "../utils/errors.js";
import { contentHash } from "../utils/hash.js";
import { aiCache } from "./cache.js";
import { createLimiter } from "./concurrency.js";
import { GeminiProvider } from "./providers/gemini.js";
import { GroqProvider } from "./providers/groq.js";
import type { AIProvider } from "./types.js";

// Provider order = preference. Gemini first (default), Groq as fallback.
const DEFAULT_PROVIDERS: AIProvider[] = [new GeminiProvider(), new GroqProvider()];
const DEFAULT_MAX_RETRIES = 2; // per provider, before falling back
const limiter = createLimiter(2); // cap concurrent AI calls (free-tier friendly)

export interface CallStructuredOptions<T> {
  /**
   * Zod schema the response must satisfy — also drives the JSON-schema hint sent to the model.
   * Input type is `unknown` so schemas using `.default()`/transforms (output != input) are accepted.
   */
  schema: z.ZodType<T, z.ZodTypeDef, unknown>;
  /** A short name for the schema (used in the prompt + cache key). */
  schemaName: string;
  /** Authoritative instruction. Never build this from untrusted user data. */
  system: string;
  /** The task payload (may include ingested text — treated as data). */
  user: string;
  /** When true, identical inputs are served from cache (skips the AI call). */
  cache?: boolean;
  /** Override providers — primarily for tests. */
  providers?: AIProvider[];
  maxRetries?: number;
}

/**
 * The single entry point for every AI call. Guarantees a schema-valid, typed
 * result by: injecting the JSON schema into the prompt, validating the response
 * with Zod, retrying on failure, falling back across providers, and caching.
 */
export async function callStructured<T>(opts: CallStructuredOptions<T>): Promise<T> {
  const providers = (opts.providers ?? DEFAULT_PROVIDERS).filter((p) => p.isConfigured());
  if (providers.length === 0) {
    throw serviceUnavailable(
      "No AI provider configured. Set GEMINI_API_KEY (or GROQ_API_KEY) in the environment.",
    );
  }

  const jsonSchema = zodToJsonSchema(opts.schema, opts.schemaName);
  const user = `${opts.user}\n\nReturn ONLY a JSON object conforming to this JSON Schema (no markdown, no commentary):\n${JSON.stringify(jsonSchema)}`;

  const cacheKey = opts.cache ? contentHash(opts.schemaName, opts.system, user) : null;
  if (cacheKey) {
    const hit = aiCache.get<T>(cacheKey);
    if (hit !== undefined) {
      logger.debug({ schema: opts.schemaName }, "AI cache hit");
      return hit;
    }
  }

  const maxRetries = opts.maxRetries ?? DEFAULT_MAX_RETRIES;
  let lastError: unknown;

  for (const provider of providers) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const raw = await limiter(() => provider.generateJSON({ system: opts.system, user }));
        const parsed = opts.schema.safeParse(extractJson(raw));
        if (parsed.success) {
          if (cacheKey) aiCache.set(cacheKey, parsed.data);
          return parsed.data;
        }
        // Bad shape — retry (maybe the model wandered off-format).
        lastError = parsed.error;
        logger.warn(
          { provider: provider.name, attempt, schema: opts.schemaName },
          "AI response failed schema validation, retrying",
        );
      } catch (err) {
        lastError = err;
        if (isTransient(err) && attempt < maxRetries) {
          await sleep(backoffMs(attempt));
          continue;
        }
        logger.warn(
          { provider: provider.name, err: errMessage(err) },
          "AI provider errored, moving to fallback",
        );
        break; // give up on this provider, try the next
      }
    }
  }

  // Give a clearer message when the root cause is a quota / rate-limit issue.
  const cause = errMessage(lastError);
  const quotaish = /429|quota|rate.?limit|exceeded/i.test(cause);
  throw badGateway(
    quotaish
      ? "AI quota exceeded or rate-limited — check your Gemini key/model, or try again shortly."
      : "AI request failed after retries and fallback.",
    { cause },
  );
}

/** Parse JSON from a model response, tolerating markdown fences / stray prose. */
function extractJson(raw: string): unknown {
  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/, "")
      .trim();
  }
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

/** Rate limits (429) and 5xx are worth retrying; a 400 or bad key is not. */
function isTransient(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  if (typeof status === "number") {
    return status === 429 || (status >= 500 && status < 600);
  }
  const msg = errMessage(err).toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("rate") ||
    msg.includes("quota") ||
    msg.includes("timeout") ||
    msg.includes("overloaded") ||
    msg.includes("unavailable")
  );
}

function backoffMs(attempt: number): number {
  return Math.min(2000, 300 * 2 ** attempt) + Math.floor(Math.random() * 100);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
