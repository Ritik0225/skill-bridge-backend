import { Schema, model, type InferSchemaType } from "mongoose";

/** Gap analysis for a target role — one per user, rebuilt on each run. */
const gapAnalysisSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    targetRole: { type: String, required: true },
    /** [{ skill, category, importance: high|medium|low, why }] */
    missingSkills: { type: [Schema.Types.Mixed], default: [] },
    strongAreas: { type: [String], default: [] },
    readinessScore: { type: Number, default: 0 },
    summary: { type: String, default: "" },
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

export type GapAnalysisType = InferSchemaType<typeof gapAnalysisSchema>;
export const GapAnalysisModel = model("GapAnalysis", gapAnalysisSchema);
