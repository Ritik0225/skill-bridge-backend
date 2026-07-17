import { asyncHandler } from "../../utils/asyncHandler.js";
import { unauthorized } from "../../utils/errors.js";
import * as service from "./jobmatch.service.js";

function userId(req: { user?: { id: string } }): string {
  if (!req.user) throw unauthorized();
  return req.user.id;
}

export const build = asyncHandler(async (req, res) => {
  const doc = await service.buildJobMatch(userId(req), req.body);
  res.json({ jobMatch: doc.toJSON() });
});

export const get = asyncHandler(async (req, res) => {
  const doc = await service.getJobMatch(userId(req));
  res.json({ jobMatch: doc.toJSON() });
});
