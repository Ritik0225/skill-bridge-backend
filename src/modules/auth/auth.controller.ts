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
