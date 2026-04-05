import { Response, NextFunction } from "express";
import { AuthRequest, Role } from "../types";
import { ApiError } from "../utils/ApiError";

/**
 * Role hierarchy — higher value means more privileges.
 * Used by authorizeMinRole() so a single threshold unlocks all roles above it.
 */
const ROLE_LEVEL: Record<Role, number> = {
  [Role.VIEWER]: 1,
  [Role.ANALYST]: 2,
  [Role.ADMIN]: 3,
};

/**
 * Exact-match guard — req.user.role must be one of the provided roles.
 *
 * @example  router.post('/', authorize(Role.ANALYST, Role.ADMIN), handler)
 */
export const authorize =
  (...allowed: Role[]) =>
  (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!allowed.includes(req.user.role)) return next(ApiError.forbidden());
    next();
  };

/**
 * Threshold guard — req.user.role must be at or above minRole in the hierarchy.
 *
 * @example  router.get('/trends', authorizeMinRole(Role.ANALYST), handler)
 *           // allows Analyst and Admin
 */
export const authorizeMinRole =
  (minRole: Role) =>
  (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(ApiError.unauthorized());
    if (ROLE_LEVEL[req.user.role] < ROLE_LEVEL[minRole])
      return next(ApiError.forbidden());
    next();
  };
