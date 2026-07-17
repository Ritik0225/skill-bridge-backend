import { asyncHandler } from "../../utils/asyncHandler.js";
import { unauthorized } from "../../utils/errors.js";
import * as service from "./career.service.js";

function userId(req: { user?: { id: string } }): string {
  if (!req.user) throw unauthorized();
  return req.user.id;
}

export const build = asyncHandler(async (req, res) => {
  const doc = await service.buildCareerPlan(userId(req), req.body);
  res.json({ careerPlan: doc.toJSON() });
});

export const get = asyncHandler(async (req, res) => {
  const doc = await service.getCareerPlan(userId(req));
  res.json({ careerPlan: doc.toJSON() });
});
