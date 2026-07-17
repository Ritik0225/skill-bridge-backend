import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface JwtPayload {
  /** User id (subject). */
  sub: string;
  email: string;
}

const EXPIRES_IN = "7d";

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  // jwt.verify returns string | JwtPayload; our tokens are always objects.
  if (typeof decoded === "string") {
    throw new Error("Unexpected token payload");
  }
  return decoded as unknown as JwtPayload;
}
