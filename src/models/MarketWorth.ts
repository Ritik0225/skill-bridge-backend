import { Schema, model, type InferSchemaType } from "mongoose";

/**
 * A rough market-worth estimate — one per user.
 * NOTE: intentionally LOW confidence. There's no trustworthy free salary data,
 * so this is an AI ballpark, and `confidence`/`caveat` are set by the SERVICE
 * (not the model) to guarantee the disclaimer is always present.
 */
const marketWorthSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    experienceYears: { type: Number, required: true },
    location: { type: String, required: true },
    targetRole: { type: String, default: null },
    currency: { type: String, default: "USD" },
    low: { type: Number, default: 0 },
    mid: { type: Number, default: 0 },
    high: { type: Number, default: 0 },
    confidence: { type: String, default: "low" },
    caveat: { type: String, default: "" },
    basis: { type: [String], default: [] },
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

export type MarketWorthType = InferSchemaType<typeof marketWorthSchema>;
export const MarketWorthModel = model("MarketWorth", marketWorthSchema);
