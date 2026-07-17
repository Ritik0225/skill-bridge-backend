import { asyncHandler } from "../../utils/asyncHandler.js";
import { unauthorized } from "../../utils/errors.js";
import * as service from "./worth.service.js";

function userId(req: { user?: { id: string } }): string {
  if (!req.user) throw unauthorized();
  return req.user.id;
}

export const build = asyncHandler(async (req, res) => {
  const doc = await service.buildWorth(userId(req), req.body);
  res.json({ worth: doc.toJSON() });
});

export const get = asyncHandler(async (req, res) => {
  const doc = await service.getWorth(userId(req));
  res.json({ worth: doc.toJSON() });
});
