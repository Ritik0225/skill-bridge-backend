import { Schema, model, type InferSchemaType } from "mongoose";

export const DIFFICULTY_LEVELS = ["beginner", "intermediate", "advanced"] as const;

/**
 * A generated, buildable project spec designed to close skill gaps.
 * Unlike Profile/Benchmark/Analysis (one per user), a user has MANY of these —
 * the generator replaces the whole set on each run.
 */
const generatedProjectSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    gapAnalysisId: { type: Schema.Types.ObjectId, ref: "GapAnalysis" },
    title: { type: String, required: true },
    pitch: { type: String, default: "" },
    skillsCovered: { type: [String], default: [] },
    stack: { type: [String], default: [] },
    milestones: { type: [String], default: [] },
    acceptanceCriteria: { type: [String], default: [] },
    difficulty: { type: String, enum: DIFFICULTY_LEVELS, default: "intermediate" },
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

export type GeneratedProjectType = InferSchemaType<typeof generatedProjectSchema>;
export const GeneratedProjectModel = model("GeneratedProject", generatedProjectSchema);
