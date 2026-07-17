import { badRequest } from "../../utils/errors.js";
import { ProfileModel } from "../../models/Profile.js";
import { GapAnalysisModel } from "../../models/GapAnalysis.js";
import { GeneratedProjectModel } from "../../models/GeneratedProject.js";
import { generateProjects as generateWithAi } from "./projects.ai.js";

interface MissingSkill {
  skill: string;
}
interface ProfileSkill {
  name: string;
}

/** Generate gap-closing projects from the user's current gap analysis (replaces the prior set). */
export async function generateProjects(userId: string) {
  const gap = await GapAnalysisModel.findOne({ userId });
  if (!gap) {
    throw badRequest("Run a gap analysis before generating projects.");
  }
  const profile = await ProfileModel.findOne({ userId });

  const result = await generateWithAi({
    targetRole: String(gap.targetRole),
    missingSkills: (gap.missingSkills as MissingSkill[]).map((s) => s.skill),
    currentSkills: profile ? (profile.skills as ProfileSkill[]).map((s) => s.name) : [],
  });

  // Replace the whole set — "generate" produces a fresh batch.
  await GeneratedProjectModel.deleteMany({ userId });
  const docs = await GeneratedProjectModel.insertMany(
    result.projects.map((p) => ({ ...p, userId, gapAnalysisId: gap._id })),
  );

  return docs;
}

export async function listProjects(userId: string) {
  return GeneratedProjectModel.find({ userId }).sort({ createdAt: 1 });
}
