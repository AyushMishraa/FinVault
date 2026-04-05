import { Response } from "express";

/**
 * Uniform JSON envelope used by every endpoint:
 *   { success, message, data?, errors?, meta? }
 */
export class ApiResponse {
  static success<T>(
    res: Response,
    data: T,
    message = "Success",
    statusCode = 200,
    meta?: Record<string, unknown>,
  ): Response {
    const body: Record<string, unknown> = { success: true, message, data };
    if (meta) body.meta = meta;
    return res.status(statusCode).json(body);
  }

  static created<T>(
    res: Response,
    data: T,
    message = "Created successfully",
  ): Response {
    return ApiResponse.success(res, data, message, 201);
  }

  static error(
    res: Response,
    message: string,
    statusCode = 500,
    errors?: unknown,
  ): Response {
    const body: Record<string, unknown> = { success: false, message };
    if (errors !== undefined) body.errors = errors;
    return res.status(statusCode).json(body);
  }
}
