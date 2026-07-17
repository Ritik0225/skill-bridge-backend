import { asyncHandler } from "../../utils/asyncHandler.js";
import { unauthorized } from "../../utils/errors.js";
import * as service from "./ingestion.service.js";

function userId(req: { user?: { id: string } }): string {
  if (!req.user) throw unauthorized();
  return req.user.id;
}

export const ingestResume = asyncHandler(async (req, res) => {
  const doc = await service.createSource(userId(req), "resume", {
    origin: { filename: req.file!.originalname },
    buffer: req.file!.buffer,
  });
  res.status(202).json(doc.toJSON());
});

export const ingestLinkedin = asyncHandler(async (req, res) => {
  const doc = await service.createSource(userId(req), "linkedin", {
    origin: { filename: req.file!.originalname },
    buffer: req.file!.buffer,
  });
  res.status(202).json(doc.toJSON());
});

export const ingestGithub = asyncHandler(async (req, res) => {
  const { username, token } = req.body;
  const doc = await service.createSource(userId(req), "github", {
    origin: { username },
    username,
    token,
  });
  res.status(202).json(doc.toJSON());
});

export const ingestPortfolio = asyncHandler(async (req, res) => {
  const { url } = req.body;
  const doc = await service.createSource(userId(req), "portfolio", {
    origin: { url },
    url,
  });
  res.status(202).json(doc.toJSON());
});

export const list = asyncHandler(async (req, res) => {
  const docs = await service.listSources(userId(req));
  res.json({ sources: docs.map((d) => d.toJSON()) });
});

export const getOne = asyncHandler(async (req, res) => {
  const doc = await service.getSource(userId(req), req.params.id!);
  res.json({ source: doc.toJSON() });
});

export const remove = asyncHandler(async (req, res) => {
  await service.deleteSource(userId(req), req.params.id!);
  res.status(204).send();
});
