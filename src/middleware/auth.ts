import type { RequestHandler } from "express";
import { unauthorized } from "../utils/errors.js";
import { verifyToken } from "../utils/jwt.js";

/**
 * Requires a valid `Authorization: Bearer <jwt>` header.
 * On success, attaches `{ id, email }` to `req.user`.
 */
export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(unauthorized("Missing or malformed Authorization header"));
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    next(unauthorized("Invalid or expired token"));
  }
};
