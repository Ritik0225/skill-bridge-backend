import { asyncHandler } from "../../utils/asyncHandler.js";
import { unauthorized } from "../../utils/errors.js";
import * as authService from "./auth.service.js";

export const register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.body);
  res.status(201).json(result);
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.loginUser(req.body);
  res.json(result);
});

export const me = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw unauthorized();
  }
  const user = await authService.getUserById(req.user.id);
  res.json({ user });
});
export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.requestPasswordReset(req.body);
  // Always the same response — never reveal whether the email is registered.
  res.json({ message: "If an account exists for that email, a reset link has been sent." });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body);
  res.json({ message: "Your password has been reset. You can now sign in." });
});