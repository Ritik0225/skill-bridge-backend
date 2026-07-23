import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { UserModel } from "../../models/User.js";
import { badRequest, conflict, unauthorized, notFound } from "../../utils/errors.js";
import { signToken } from "../../utils/jwt.js";
import { hashToken } from "../../utils/hash.js";
import { appUrl } from "../../config/env.js";
import { sendPasswordResetEmail } from "../../config/mailer.js";
import { logger } from "../../config/logger.js";
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from "./auth.schemas.js";

const SALT_ROUNDS = 10;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface AuthResult {
  user: Record<string, unknown>;
  token: string;
}

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const email = input.email.toLowerCase();
  const existing = await UserModel.findOne({ email });
  if (existing) {
    throw conflict("An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await UserModel.create({ name: input.name, email, passwordHash });
  const token = signToken({ sub: user.id, email: user.email });

  return { user: user.toJSON(), token };
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const email = input.email.toLowerCase();
  const user = await UserModel.findOne({ email });
  // Same error whether the email is unknown or the password is wrong (no user enumeration).
  if (!user) {
    throw unauthorized("Invalid email or password");
  }

  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) {
    throw unauthorized("Invalid email or password");
  }

  const token = signToken({ sub: user.id, email: user.email });
  return { user: user.toJSON(), token };
}

export async function getUserById(id: string): Promise<Record<string, unknown>> {
  const user = await UserModel.findById(id);
  if (!user) {
    throw notFound("User not found");
  }
  return user.toJSON();
}

/**
 * Start a password reset. Always resolves the same way whether or not the email
 * exists (no user enumeration). If it does, we store the HASH of a random token
 * (never the token itself), set a 1-hour expiry, and email the reset link.
 */
export async function requestPasswordReset(input: ForgotPasswordInput): Promise<void> {
  const email = input.email.toLowerCase();
  const user = await UserModel.findOne({ email });
  if (!user) return; // silent — same response regardless

  const rawToken = crypto.randomBytes(32).toString("hex");
  user.set("passwordResetTokenHash", hashToken(rawToken));
  user.set("passwordResetExpires", new Date(Date.now() + RESET_TOKEN_TTL_MS));
  await user.save();

  const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;
  try {
    await sendPasswordResetEmail(user.email, resetUrl);
  } catch (err) {
    // Don't leak delivery failures to the caller; log for ops.
    logger.error({ err }, "Failed to send password reset email");
  }
}

/**
 * Complete a reset: match the token by its hash and check expiry, then set the
 * new password and invalidate the token (single-use).
 */
export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  const user = await UserModel.findOne({
    passwordResetTokenHash: hashToken(input.token),
    passwordResetExpires: { $gt: new Date() },
  });
  if (!user) {
    throw badRequest("This reset link is invalid or has expired. Please request a new one.");
  }

  user.set("passwordHash", await bcrypt.hash(input.password, SALT_ROUNDS));
  user.set("passwordResetTokenHash", null);
  user.set("passwordResetExpires", null);
  await user.save();
}