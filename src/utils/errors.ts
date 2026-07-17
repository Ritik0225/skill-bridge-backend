/**
 * Application error carrying an HTTP status and a stable machine-readable code.
 * Thrown anywhere; translated to a JSON response by the error-handler middleware.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(statusCode: number, message: string, code = "error", details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, AppError);
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new AppError(400, message, "bad_request", details);

export const unauthorized = (message = "Unauthorized") =>
  new AppError(401, message, "unauthorized");

export const forbidden = (message = "Forbidden") => new AppError(403, message, "forbidden");

export const notFound = (message = "Not found") => new AppError(404, message, "not_found");

export const conflict = (message: string, details?: unknown) =>
  new AppError(409, message, "conflict", details);

export const badGateway = (message = "Upstream service error", details?: unknown) =>
  new AppError(502, message, "bad_gateway", details);

export const serviceUnavailable = (message = "Service unavailable", details?: unknown) =>
  new AppError(503, message, "service_unavailable", details);
