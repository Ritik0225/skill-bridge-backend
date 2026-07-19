import "dotenv/config";
import { z } from "zod";

/**
 * Environment schema. Parsed and validated once at startup so the app
 * fails fast with a clear message if configuration is missing/invalid.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-flash-latest"),
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default("llama-3.3-70b-versatile"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Logger isn't available yet at this point, so use console directly.
  console.error("❌ Invalid environment variables:");
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";

// Guard against shipping the placeholder secret to production.
if (isProd && env.JWT_SECRET.includes("insecure")) {
  console.error("❌ Refusing to start: set a real JWT_SECRET in production.");
  process.exit(1);
}

/** Allowed CORS origins as an array (comma-separated in the env var). */
export const corsOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim());
