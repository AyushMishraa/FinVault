import { Types } from "mongoose";
import { FinancialRecord } from "../models/record.model";
import {
  IFinancialRecord,
  PaginatedResult,
  RecordFilters,
  Role,
} from "../types";
import { ApiError } from "../utils/ApiError";

interface CreateInput {
  amount: number;
  type: string;
  category: string;
  date: string;
  notes?: string;
  createdBy: string;
}

interface UpdateInput {
  amount?: number;
  type?: string;
  category?: string;
  date?: string;
  notes?: string;
}

export class RecordService {
  static async create(input: CreateInput): Promise<IFinancialRecord> {
    return FinancialRecord.create({
      ...input,
      createdBy: new Types.ObjectId(input.createdBy),
    });
  }

  /**
   * Paginated + filtered record list.
   * Admins see all records; Analyst/Viewer see only their own.
   */
  static async getAll(
    userId: string,
    role: Role,
    filters: RecordFilters,
  ): Promise<PaginatedResult<IFinancialRecord>> {
    const {
      type,
      category,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      search,
      page = 1,
      limit = 10,
      sortBy = "date",
      sortOrder = "desc",
    } = filters;

    const query: Record<string, unknown> = {};

    // Scope to the requesting user unless they're an admin
    if (role !== Role.ADMIN) query.createdBy = new Types.ObjectId(userId);

    if (type) query.type = type;
    if (category) query.category = category;

    if (startDate || endDate) {
      const df: Record<string, Date> = {};
      if (startDate) df.$gte = new Date(startDate);
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        df.$lte = e;
      }
      query.date = df;
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      const af: Record<string, number> = {};
      if (minAmount !== undefined) af.$gte = minAmount;
      if (maxAmount !== undefined) af.$lte = maxAmount;
      query.amount = af;
    }

    if (search) query.notes = { $regex: search, $options: "i" };

    const skip = (page - 1) * limit;
    const dir = sortOrder === "asc" ? 1 : -1;

    const [records, total] = await Promise.all([
      FinancialRecord.find(query)
        .populate("createdBy", "name email role")
        .sort({ [sortBy]: dir })
        .skip(skip)
        .limit(limit),
      FinancialRecord.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);
    return {
      data: records,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /** Non-admins may only access records they created. */
  static async getById(
    id: string,
    userId: string,
    role: Role,
  ): Promise<IFinancialRecord> {
    const record = await FinancialRecord.findById(id).populate(
      "createdBy",
      "name email role",
    );
    if (!record) throw ApiError.notFound("Financial record");
    if (role !== Role.ADMIN && record.createdBy.toString() !== userId)
      throw ApiError.forbidden();
    return record;
  }

  /** Non-admins may only update records they created. */
  static async update(
    id: string,
    userId: string,
    role: Role,
    input: UpdateInput,
  ): Promise<IFinancialRecord> {
    const record = await FinancialRecord.findById(id);
    if (!record) throw ApiError.notFound("Financial record");
    if (role !== Role.ADMIN && record.createdBy.toString() !== userId)
      throw ApiError.forbidden();
    Object.assign(record, input);
    await record.save();
    return record;
  }

  /**
   * Soft-delete: sets isDeleted = true and records deletedAt timestamp.
   * The pre-find middleware automatically excludes these from all future queries.
   */
  static async softDelete(
    id: string,
    userId: string,
    role: Role,
  ): Promise<void> {
    const record = await FinancialRecord.findById(id);
    if (!record) throw ApiError.notFound("Financial record");
    if (role !== Role.ADMIN && record.createdBy.toString() !== userId)
      throw ApiError.forbidden();
    record.isDeleted = true;
    record.deletedAt = new Date();
    await record.save();
  }
}
