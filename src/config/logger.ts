import { pino } from "pino";
import { env, isProd, isTest } from "./env.js";

/**
 * Structured logger. Pretty-printed in development, JSON in production, silent in tests.
 * PII (raw resume text, tokens, secrets) must never be logged.
 */
export const logger = pino({
  level: isTest ? "silent" : env.LOG_LEVEL,
  transport: isProd
    ? undefined
    : {
        target: "pino-pretty",
        options: { colorize: true, translateTime: "SYS:standard", ignore: "pid,hostname" },
      },
});
