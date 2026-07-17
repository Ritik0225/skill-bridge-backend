import { rateLimit } from "express-rate-limit";

/**
 * Rate limiter for AI-backed routes (profile build, analysis, generation, ...).
 * These spend free-tier LLM quota, so they're limited more tightly than plain reads.
 * Keyed per-user (routes run after requireAuth), falling back to IP.
 */
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // per user, per window
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id ?? req.ip ?? "anon",
  message: {
    error: {
      code: "rate_limited",
      message: "Too many AI requests. Please wait a little and try again.",
    },
  },
});
