import type { RequestHandler } from "express";
import multer from "multer";
import { badRequest } from "../utils/errors.js";

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

// In-memory storage: we parse the PDF from the buffer and never touch disk
// (no temp files, no path-traversal surface).
const single = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"));
  },
}).single("file");

/** Accept a single PDF upload on field "file"; map multer errors to clean 400s. */
export const uploadPdf: RequestHandler = (req, res, next) => {
  single(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      const message =
        err.code === "LIMIT_FILE_SIZE" ? "PDF is too large (max 5 MB)" : "File upload failed";
      next(badRequest(message));
      return;
    }
    if (err) {
      next(badRequest(err instanceof Error ? err.message : "File upload failed"));
      return;
    }
    if (!req.file) {
      next(badRequest("A PDF file is required (form field name: 'file')"));
      return;
    }
    next();
  });
};
