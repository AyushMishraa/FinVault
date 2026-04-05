/**
 * Custom error class that carries an HTTP status code.
 * Thrown throughout services and controllers; caught by the global error handler.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg = "Bad request"): ApiError {
    return new ApiError(400, msg);
  }
  static unauthorized(msg = "Unauthorized"): ApiError {
    return new ApiError(401, msg);
  }
  static forbidden(msg = "Forbidden — insufficient permissions"): ApiError {
    return new ApiError(403, msg);
  }
  static notFound(resource = "Resource"): ApiError {
    return new ApiError(404, `${resource} not found`);
  }
  static conflict(msg = "Conflict"): ApiError {
    return new ApiError(409, msg);
  }
  static internal(msg = "Internal server error"): ApiError {
    return new ApiError(500, msg, false);
  }
}
