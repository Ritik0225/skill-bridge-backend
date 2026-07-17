import { asyncHandler } from "../../utils/asyncHandler.js";
import { unauthorized } from "../../utils/errors.js";
import * as service from "./profile.service.js";

function userId(req: { user?: { id: string } }): string {
  if (!req.user) throw unauthorized();
  return req.user.id;
}

export const build = asyncHandler(async (req, res) => {
  const profile = await service.buildProfile(userId(req));
  res.json({ profile: profile.toJSON() });
});

export const get = asyncHandler(async (req, res) => {
  const profile = await service.getProfile(userId(req));
  res.json({ profile: profile.toJSON() });
});
