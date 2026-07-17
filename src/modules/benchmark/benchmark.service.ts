import { badRequest, notFound } from "../../utils/errors.js";
import { ProfileModel } from "../../models/Profile.js";
import { SkillBenchmarkModel } from "../../models/SkillBenchmark.js";
import { assessBenchmark } from "./benchmark.ai.js";
import type { BenchmarkRequest } from "./benchmark.schemas.js";

interface ProfileSkill {
  name: string;
  category: string;
  confidence: number;
}

export async function buildBenchmark(userId: string, req: BenchmarkRequest) {
  const profile = await ProfileModel.findOne({ userId });
  if (!profile) {
    throw badRequest("Build your profile before benchmarking.");
  }

  const skills = (profile.skills as ProfileSkill[]).map((s) => ({
    name: s.name,
    category: s.category,
    confidence: s.confidence,
  }));

  const result = await assessBenchmark({
    experienceYears: req.experienceYears,
    targetRole: req.targetRole,
    seniority: String(profile.seniority),
    skills,
  });

  const doc = await SkillBenchmarkModel.findOneAndUpdate(
    { userId },
    {
      $set: {
        profileId: profile._id,
        experienceYears: req.experienceYears,
        targetRole: req.targetRole ?? null,
        ...result,
      },
      $inc: { version: 1 },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return doc;
}

export async function getBenchmark(userId: string) {
  const doc = await SkillBenchmarkModel.findOne({ userId });
  if (!doc) throw notFound("No benchmark yet. Run one after building your profile.");
  return doc;
}
