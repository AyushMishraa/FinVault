import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import { DashboardService } from "../services/dashboard.service";
import { ApiResponse } from "../utils/ApiResponse";

export class DashboardController {
  /** GET /api/dashboard/summary?startDate=&endDate= */
  static async getSummary(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { startDate, endDate } = req.query as {
        startDate?: string;
        endDate?: string;
      };
      const data = await DashboardService.getSummary(
        req.user!.id,
        req.user!.role,
        startDate,
        endDate,
      );
      ApiResponse.success(res, data, "Summary retrieved successfully");
    } catch (err) {
      next(err);
    }
  }

  /** GET /api/dashboard/categories?startDate=&endDate= */
  static async getCategoryTotals(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { startDate, endDate } = req.query as {
        startDate?: string;
        endDate?: string;
      };
      const data = await DashboardService.getCategoryTotals(
        req.user!.id,
        req.user!.role,
        startDate,
        endDate,
      );
      ApiResponse.success(res, data, "Category totals retrieved successfully");
    } catch (err) {
      next(err);
    }
  }

  /** GET /api/dashboard/recent?limit= */
  static async getRecentActivity(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 10;
      const data = await DashboardService.getRecentActivity(
        req.user!.id,
        req.user!.role,
        limit,
      );
      ApiResponse.success(res, data, "Recent activity retrieved successfully");
    } catch (err) {
      next(err);
    }
  }

  /** GET /api/dashboard/trends/monthly?months= */
  static async getMonthlyTrends(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const months = req.query.months
        ? parseInt(req.query.months as string, 10)
        : 12;
      const data = await DashboardService.getMonthlyTrends(
        req.user!.id,
        req.user!.role,
        months,
      );
      ApiResponse.success(res, data, "Monthly trends retrieved successfully");
    } catch (err) {
      next(err);
    }
  }

  /** GET /api/dashboard/trends/weekly?weeks= */
  static async getWeeklyTrends(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const weeks = req.query.weeks
        ? parseInt(req.query.weeks as string, 10)
        : 8;
      const data = await DashboardService.getWeeklyTrends(
        req.user!.id,
        req.user!.role,
        weeks,
      );
      ApiResponse.success(res, data, "Weekly trends retrieved successfully");
    } catch (err) {
      next(err);
    }
  }
}
