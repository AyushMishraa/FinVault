import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError";

/**
 * Global error handler.
 * Converts well-known library errors (Mongoose, JWT) into ApiErrors,
 * then sends a consistent JSON response.
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  let error: ApiError;

  // ── Mongoose: bad ObjectId cast ───────────────────────────────────────────
  if (err instanceof mongoose.Error.CastError) {
    error = ApiError.badRequest(
      `Invalid value '${String(err.value)}' for field '${err.path}'`,
    );
  }

  // ── Mongoose: schema validation failed ───────────────────────────────────
  else if (err instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(err.errors).map((e) => e.message);
    error = new ApiError(400, messages.join("; "));
  }

  // ── MongoDB: duplicate key (E11000) ───────────────────────────────────────
  else if ((err as NodeJS.ErrnoException).code === "11000") {
    const raw = err as unknown as Record<string, unknown>;
    const keyValue = (raw.keyValue ?? {}) as Record<string, unknown>;
    const field = Object.keys(keyValue)[0] ?? "field";
    error = ApiError.conflict(`A record with this ${field} already exists`);
  }

  // ── Already an ApiError ───────────────────────────────────────────────────
  else if (err instanceof ApiError) {
    error = err;
  }

  // ── Unknown / programmer error ────────────────────────────────────────────
  else {
    if (process.env.NODE_ENV !== "production")
      console.error("Unhandled error:", err);
    error = ApiError.internal();
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

/** Catches requests to unknown routes and forwards a 404 ApiError. */
export const notFoundHandler = (
  _req: Request,
  _res: Response,
  next: NextFunction,
): void => next(ApiError.notFound("Endpoint"));
