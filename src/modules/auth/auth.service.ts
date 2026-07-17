import bcrypt from "bcryptjs";
import { UserModel } from "../../models/User.js";
import { conflict, unauthorized, notFound } from "../../utils/errors.js";
import { signToken } from "../../utils/jwt.js";
import type { LoginInput, RegisterInput } from "./auth.schemas.js";

const SALT_ROUNDS = 10;

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
