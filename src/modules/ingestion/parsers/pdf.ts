import { createRequire } from "node:module";
import { badRequest } from "../../../utils/errors.js";

// pdf-parse's index.js runs a debug block on import under ESM (it tries to read a
// bundled test PDF and crashes). Import the library file directly via createRequire
// to avoid that, and give it a small local type.
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (
  data: Buffer,
) => Promise<{ text: string; numpages: number }>;

/** Extract plain text from a PDF buffer (resume / LinkedIn export). */
export async function parsePdf(buffer: Buffer): Promise<string> {
  let result: { text: string };
  try {
    result = await pdfParse(buffer);
  } catch {
    throw badRequest("Could not read this PDF. Please upload a valid, text-based PDF.");
  }
  const text = result.text.trim();
  if (text.length < 20) {
    // Likely a scanned/image-only PDF with no extractable text (we don't OCR in V1).
    throw badRequest(
      "No readable text found in this PDF (is it a scanned image?). Upload a text-based PDF.",
    );
  }
  return text;
}
