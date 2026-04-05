import { Response, NextFunction } from "express";
import { AuthRequest, Role, UserStatus } from "../types";
import { UserService } from "../services/user.service";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";

export class UserController {
  /** GET /api/users */
  static async getAll(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const users = await UserService.getAll(req.user!.role);
      ApiResponse.success(res, users, "Users retrieved successfully");
    } catch (err) {
      next(err);
    }
  }

  /** GET /api/users/:id — non-admins may only fetch themselves */
  static async getById(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;
      if (req.user!.role !== Role.ADMIN && id !== req.user!.id)
        throw ApiError.forbidden();
      const user = await UserService.getById(id);
      ApiResponse.success(res, user, "User retrieved successfully");
    } catch (err) {
      next(err);
    }
  }

  /** PATCH /api/users/:id — admin only */
  static async update(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { name, role, status } = req.body as {
        name?: string;
        role?: Role;
        status?: UserStatus;
      };
      const user = await UserService.update(req.params.id, {
        name,
        role,
        status,
      });
      ApiResponse.success(res, user, "User updated successfully");
    } catch (err) {
      next(err);
    }
  }

  /** PATCH /api/users/:id/toggle-status — admin only */
  static async toggleStatus(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const user = await UserService.toggleStatus(req.params.id);
      const label = user.status === "active" ? "activated" : "deactivated";
      ApiResponse.success(res, user, `User ${label} successfully`);
    } catch (err) {
      next(err);
    }
  }
}
