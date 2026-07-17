import { badRequest, notFound } from "../../utils/errors.js";
import { SourceDocModel } from "../../models/SourceDoc.js";
import { ProfileModel } from "../../models/Profile.js";
import { aggregateExtracted } from "./profile.aggregate.js";
import { consolidateProfile } from "./profile.ai.js";

/** Rebuild the Current State from every processed source the user has. */
export async function buildProfile(userId: string) {
  const sources = await SourceDocModel.find({
    userId,
    status: "processed",
    extracted: { $ne: null },
  });
  if (sources.length === 0) {
    throw badRequest("Add and process at least one source before building your profile.");
  }

  const aggregated = aggregateExtracted(
    sources.map((s) => ({ type: String(s.type), extracted: s.extracted })),
  );
  const consolidated = await consolidateProfile(aggregated);

  // One profile per user — upsert and bump the version so the client sees it evolve.
  const profile = await ProfileModel.findOneAndUpdate(
    { userId },
    {
      $set: { ...consolidated, sourceDocIds: sources.map((s) => s._id) },
      $inc: { version: 1 },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return profile;
}

export async function getProfile(userId: string) {
  const profile = await ProfileModel.findOne({ userId });
  if (!profile) {
    throw notFound("No profile yet. Connect sources and build one.");
  }
  return profile;
}
