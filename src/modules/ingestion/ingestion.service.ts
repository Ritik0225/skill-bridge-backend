import { logger } from "../../config/logger.js";
import { notFound } from "../../utils/errors.js";
import { contentHash } from "../../utils/hash.js";
import { SourceDocModel, type SourceType } from "../../models/SourceDoc.js";
import { parsePdf } from "./parsers/pdf.js";
import { fetchGithub } from "./parsers/github.js";
import { fetchPortfolio } from "./parsers/portfolio.js";
import { extractFromText } from "./extract.js";

/** Everything a processing run might need. Only some fields apply per type. */
export interface IngestInput {
  origin: Record<string, unknown>;
  buffer?: Buffer;
  username?: string;
  token?: string;
  url?: string;
}

/**
 * Create a pending SourceDoc and kick off processing in the background.
 * Returns immediately (202) so the client can poll for status.
 */
export async function createSource(userId: string, type: SourceType, input: IngestInput) {
  const doc = await SourceDocModel.create({ userId, type, status: "pending", origin: input.origin });

  // Fire-and-forget: processSource persists its own success/failure to the doc.
  void processSource(String(doc._id), userId, type, input).catch((err) => {
    logger.error({ err, sourceId: String(doc._id) }, "processSource crashed unexpectedly");
  });

  return doc;
}

async function processSource(
  id: string,
  userId: string,
  type: SourceType,
  input: IngestInput,
): Promise<void> {
  await SourceDocModel.findByIdAndUpdate(id, { status: "processing", error: null });

  try {
    // Hard cap the whole pipeline so a slow/hung parse or AI call can't stick forever.
    await withTimeout(runPipeline(id, userId, type, input), PROCESS_TIMEOUT_MS);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Processing failed";
    await SourceDocModel.findByIdAndUpdate(id, { status: "failed", error: message });
  }
}

const PROCESS_TIMEOUT_MS = 120_000; // 2 minutes

async function runPipeline(
  id: string,
  userId: string,
  type: SourceType,
  input: IngestInput,
): Promise<void> {
  // 1. Parse the raw source into text (+ optional structured data).
  let text: string;
  let rawData: unknown;
  switch (type) {
    case "resume":
    case "linkedin":
      text = await parsePdf(input.buffer!);
      break;
    case "github": {
      const gh = await fetchGithub(input.username!, input.token);
      text = gh.text;
      rawData = gh.data;
      break;
    }
    case "portfolio":
      text = await fetchPortfolio(input.url!);
      break;
  }

  // 2. Persist parsed text immediately, so it survives even if extraction fails.
  const hash = contentHash(text);
  await SourceDocModel.findByIdAndUpdate(id, { rawText: text, rawData, contentHash: hash });

  // 3. Dedup: reuse a prior processed extraction for the same user + content.
  const prior = await SourceDocModel.findOne({
    userId,
    contentHash: hash,
    status: "processed",
    _id: { $ne: id },
  });
  const extracted = prior?.extracted ?? (await extractFromText(type, text));

  await SourceDocModel.findByIdAndUpdate(id, { status: "processed", extracted });
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Processing timed out")), ms).unref();
    }),
  ]);
}

/**
 * On boot, any source still "pending"/"processing" was orphaned by a restart
 * (processing is a fire-and-forget background task that doesn't survive one).
 * Mark them failed so they don't hang forever and the client stops polling.
 */
export async function resetOrphanedSources(): Promise<number> {
  const res = await SourceDocModel.updateMany(
    { status: { $in: ["pending", "processing"] } },
    { status: "failed", error: "Processing was interrupted (server restarted). Please retry." },
  );
  return res.modifiedCount ?? 0;
}

export async function listSources(userId: string) {
  return SourceDocModel.find({ userId }).sort({ createdAt: -1 });
}

export async function getSource(userId: string, id: string) {
  const doc = await SourceDocModel.findOne({ _id: id, userId });
  if (!doc) throw notFound("Source not found");
  return doc;
}

export async function deleteSource(userId: string, id: string) {
  const doc = await SourceDocModel.findOneAndDelete({ _id: id, userId });
  if (!doc) throw notFound("Source not found");
  return doc;
}
