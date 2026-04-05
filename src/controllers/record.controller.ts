import { Response, NextFunction } from "express";
import { AuthRequest, RecordFilters } from "../types";
import { RecordService } from "../services/record.service";
import { ApiResponse } from "../utils/ApiResponse";

export class RecordController {
  /** POST /api/records */
  static async create(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { amount, type, category, date, notes } = req.body as {
        amount: number;
        type: string;
        category: string;
        date: string;
        notes?: string;
      };
      const record = await RecordService.create({
        amount,
        type,
        category,
        date,
        notes,
        createdBy: req.user!.id,
      });
      ApiResponse.created(res, record, "Financial record created successfully");
    } catch (err) {
      next(err);
    }
  }

  /** GET /api/records */
  static async getAll(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await RecordService.getAll(
        req.user!.id,
        req.user!.role,
        req.query as unknown as RecordFilters,
      );
      ApiResponse.success(
        res,
        result.data,
        "Records retrieved successfully",
        200,
        { pagination: result.pagination },
      );
    } catch (err) {
      next(err);
    }
  }

  /** GET /api/records/:id */
  static async getById(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const record = await RecordService.getById(
        req.params.id,
        req.user!.id,
        req.user!.role,
      );
      ApiResponse.success(res, record, "Record retrieved successfully");
    } catch (err) {
      next(err);
    }
  }

  /** PATCH /api/records/:id */
  static async update(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { amount, type, category, date, notes } = req.body as {
        amount?: number;
        type?: string;
        category?: string;
        date?: string;
        notes?: string;
      };
      const record = await RecordService.update(
        req.params.id,
        req.user!.id,
        req.user!.role,
        { amount, type, category, date, notes },
      );
      ApiResponse.success(res, record, "Record updated successfully");
    } catch (err) {
      next(err);
    }
  }

  /** DELETE /api/records/:id */
  static async remove(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      await RecordService.softDelete(
        req.params.id,
        req.user!.id,
        req.user!.role,
      );
      ApiResponse.success(res, null, "Record deleted successfully");
    } catch (err) {
      next(err);
    }
  }
}
