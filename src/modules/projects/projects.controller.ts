import { asyncHandler } from "../../utils/asyncHandler.js";
import { unauthorized } from "../../utils/errors.js";
import * as service from "./projects.service.js";

function userId(req: { user?: { id: string } }): string {
  if (!req.user) throw unauthorized();
  return req.user.id;
}

export const generate = asyncHandler(async (req, res) => {
  const docs = await service.generateProjects(userId(req));
  res.json({ projects: docs.map((d) => d.toJSON()) });
});

export const list = asyncHandler(async (req, res) => {
  const docs = await service.listProjects(userId(req));
  res.json({ projects: docs.map((d) => d.toJSON()) });
});
