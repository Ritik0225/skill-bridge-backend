import { badRequest, notFound } from "../../utils/errors.js";
import { ProfileModel } from "../../models/Profile.js";
import { MarketWorthModel } from "../../models/MarketWorth.js";
import { estimateWorth } from "./worth.ai.js";
import type { WorthRequest } from "./worth.schemas.js";

interface ProfileSkill {
  name: string;
}

// Set by us, not the model — the disclaimer can't be softened by the AI.
const CAVEAT =
  "Rough AI estimate only — not based on real-time salary data. Treat it as a ballpark and verify against sources like Levels.fyi, Glassdoor, or local market data.";

export async function buildWorth(userId: string, req: WorthRequest) {
  const profile = await ProfileModel.findOne({ userId });
  if (!profile) {
    throw badRequest("Build your profile before estimating market worth.");
  }

  const result = await estimateWorth({
    experienceYears: req.experienceYears,
    location: req.location,
    targetRole: req.targetRole,
    seniority: String(profile.seniority),
    skills: (profile.skills as ProfileSkill[]).map((s) => s.name),
  });

  const doc = await MarketWorthModel.findOneAndUpdate(
    { userId },
    {
      $set: {
        experienceYears: req.experienceYears,
        location: req.location,
        targetRole: req.targetRole ?? null,
        ...result,
        confidence: "low", // forced — this feature is intentionally low-confidence
        caveat: CAVEAT, // forced — always present
      },
      $inc: { version: 1 },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return doc;
}

export async function getWorth(userId: string) {
  const doc = await MarketWorthModel.findOne({ userId });
  if (!doc) throw notFound("No estimate yet. Run one after building your profile.");
  return doc;
}
