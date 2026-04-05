import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest, TokenPayload, UserStatus } from "../types";
import { ApiError } from "../utils/ApiError";
import { User } from "../models/user.model";

/**
 * Verifies the Bearer JWT from the Authorization header.
 * On success, attaches the decoded payload to req.user and confirms the user
 * still exists and is active in the database before passing to the next handler.
 */
export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw ApiError.unauthorized("No token provided. Please log in.");
    }

    const token = header.split(" ")[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) throw ApiError.internal("JWT secret is not configured");

    const decoded = jwt.verify(token, secret) as TokenPayload;

    // Re-validate user existence and status on each request
    const user = await User.findById(decoded.id).select("status role");
    if (!user) throw ApiError.unauthorized("User no longer exists");
    if (user.status === UserStatus.INACTIVE) {
      throw ApiError.unauthorized(
        "Your account has been deactivated — contact an admin.",
      );
    }

    req.user = { id: decoded.id, email: decoded.email, role: user.role };
    next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      next(ApiError.unauthorized("Invalid or expired token"));
    } else {
      next(err);
    }
  }
};
