import { Response, NextFunction } from "express";
import { AuthRequest, Role } from "../types";
import { AuthService } from "../services/auth.service";
import { ApiResponse } from "../utils/ApiResponse";

export class AuthController {
  /** POST /api/auth/register — public */
  static async register(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { name, email, password, role } = req.body as {
        name: string;
        email: string;
        password: string;
        role?: Role;
      };
      const result = await AuthService.register({
        name,
        email,
        password,
        role,
      });
      ApiResponse.created(res, result, "Account created successfully");
    } catch (err) {
      next(err);
    }
  }

  /** POST /api/auth/login — public */
  static async login(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { email, password } = req.body as {
        email: string;
        password: string;
      };
      const result = await AuthService.login({ email, password });
      ApiResponse.success(res, result, "Login successful");
    } catch (err) {
      next(err);
    }
  }

  /** GET /api/auth/me — requires valid JWT */
  static async getMe(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      ApiResponse.success(res, req.user, "Profile retrieved");
    } catch (err) {
      next(err);
    }
  }
}
