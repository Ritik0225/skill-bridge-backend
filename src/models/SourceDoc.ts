import { Schema, model, type InferSchemaType } from "mongoose";

export const SOURCE_TYPES = ["resume", "linkedin", "github", "portfolio"] as const;
export const SOURCE_STATUSES = ["pending", "processing", "processed", "failed"] as const;

const sourceDocSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: SOURCE_TYPES, required: true },
    status: { type: String, enum: SOURCE_STATUSES, default: "pending", index: true },
    /** Origin metadata: { filename? , url? , username? }. */
    origin: { type: Schema.Types.Mixed, default: {} },
    /** Extracted plain text (resume/linkedin/portfolio) — kept server-side, not sent to the client. */
    rawText: { type: String },
    /** Structured raw data (e.g. GitHub API response) — server-side only. */
    rawData: { type: Schema.Types.Mixed },
    /** AI-normalized result: { summary, skills[], roles[] }. */
    extracted: { type: Schema.Types.Mixed },
    /** SHA-256 of the parsed text — enables dedup / cache reuse. */
    contentHash: { type: String, index: true },
    /** Failure reason when status === "failed". */
    error: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        // Large / server-only fields are omitted from API responses.
        delete ret.rawText;
        delete ret.rawData;
        return ret;
      },
    },
  },
);

// Fast "reuse an identical source" lookups for dedup.
sourceDocSchema.index({ userId: 1, contentHash: 1 });

export type SourceType = (typeof SOURCE_TYPES)[number];
export type SourceDocType = InferSchemaType<typeof sourceDocSchema>;
export const SourceDocModel = model("SourceDoc", sourceDocSchema);
