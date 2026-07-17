import { Schema, model, type InferSchemaType } from "mongoose";

export const SENIORITY_LEVELS = [
  "junior",
  "mid",
  "senior",
  "staff",
  "lead",
  "principal",
  "unknown",
] as const;

/**
 * The consolidated "Current State" — one per user, rebuilt from all processed sources.
 * Skills and roles are stored as flexible sub-objects (their shape is validated by Zod
 * at the AI-layer boundary before they land here).
 */
const profileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    summary: { type: String, default: "" },
    seniority: { type: String, enum: SENIORITY_LEVELS, default: "unknown" },
    skills: { type: [Schema.Types.Mixed], default: [] },
    roles: { type: [Schema.Types.Mixed], default: [] },
    /** Which sources this profile was built from (provenance). */
    sourceDocIds: { type: [Schema.Types.ObjectId], ref: "SourceDoc", default: [] },
    /** Bumped each rebuild, so the client can tell the state evolved. */
    version: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

export type ProfileType = InferSchemaType<typeof profileSchema>;
export const ProfileModel = model("Profile", profileSchema);
