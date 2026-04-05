import { Types } from "mongoose";
import { FinancialRecord } from "../models/record.model";
import { Role, TransactionType } from "../types";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const r2 = (n: number) => Math.round(n * 100) / 100;

export class DashboardService {
  /**
   * Top-level financial summary (total income, expenses, net balance + counts).
   * Admins see global figures; all other roles see only their own records.
   */
  static async getSummary(
    userId: string,
    role: Role,
    startDate?: string,
    endDate?: string,
  ) {
    const match = DashboardService.buildMatch(userId, role, startDate, endDate);

    const [result] = await FinancialRecord.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: {
              $cond: [{ $eq: ["$type", TransactionType.INCOME] }, "$amount", 0],
            },
          },
          totalExpenses: {
            $sum: {
              $cond: [
                { $eq: ["$type", TransactionType.EXPENSE] },
                "$amount",
                0,
              ],
            },
          },
          recordCount: { $sum: 1 },
          incomeCount: {
            $sum: { $cond: [{ $eq: ["$type", TransactionType.INCOME] }, 1, 0] },
          },
          expenseCount: {
            $sum: {
              $cond: [{ $eq: ["$type", TransactionType.EXPENSE] }, 1, 0],
            },
          },
        },
      },
    ]);

    const d = result ?? {
      totalIncome: 0,
      totalExpenses: 0,
      recordCount: 0,
      incomeCount: 0,
      expenseCount: 0,
    };
    return {
      totalIncome: r2(d.totalIncome as number),
      totalExpenses: r2(d.totalExpenses as number),
      netBalance: r2((d.totalIncome as number) - (d.totalExpenses as number)),
      recordCount: d.recordCount as number,
      incomeCount: d.incomeCount as number,
      expenseCount: d.expenseCount as number,
    };
  }

  /** Totals grouped by category + transaction type, sorted descending by total. */
  static async getCategoryTotals(
    userId: string,
    role: Role,
    startDate?: string,
    endDate?: string,
  ) {
    const match = DashboardService.buildMatch(userId, role, startDate, endDate);

    const rows = await FinancialRecord.aggregate([
      { $match: match },
      {
        $group: {
          _id: { category: "$category", type: "$type" },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    return rows.map((r) => ({
      category: (r._id as Record<string, string>).category,
      type: (r._id as Record<string, string>).type,
      total: r2(r.total as number),
      count: r.count as number,
    }));
  }

  /** Most recent N records with creator info looked up via $lookup. */
  static async getRecentActivity(userId: string, role: Role, limit = 10) {
    const match = DashboardService.buildMatch(userId, role);

    return FinancialRecord.aggregate([
      { $match: match },
      { $sort: { date: -1 } },
      { $limit: Math.min(limit, 50) },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "creator",
          pipeline: [{ $project: { name: 1, email: 1 } }],
        },
      },
      { $unwind: { path: "$creator", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          amount: 1,
          type: 1,
          category: 1,
          date: 1,
          notes: 1,
          creator: 1,
          createdAt: 1,
        },
      },
    ]);
  }

  /** Monthly income / expense / net for the last N months. */
  static async getMonthlyTrends(userId: string, role: Role, months = 12) {
    const since = new Date();
    since.setMonth(since.getMonth() - months);
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const match = DashboardService.buildMatch(userId, role);
    match.date = { $gte: since };

    const rows = await FinancialRecord.aggregate([
      { $match: match },
      {
        $group: {
          _id: { year: { $year: "$date" }, month: { $month: "$date" } },
          income: {
            $sum: {
              $cond: [{ $eq: ["$type", TransactionType.INCOME] }, "$amount", 0],
            },
          },
          expenses: {
            $sum: {
              $cond: [
                { $eq: ["$type", TransactionType.EXPENSE] },
                "$amount",
                0,
              ],
            },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    return rows.map((r) => {
      const id = r._id as { year: number; month: number };
      return {
        year: id.year,
        month: id.month,
        monthLabel: `${MONTHS[id.month - 1]} ${id.year}`,
        income: r2(r.income as number),
        expenses: r2(r.expenses as number),
        net: r2((r.income as number) - (r.expenses as number)),
      };
    });
  }

  /** Weekly income / expense / net for the last N weeks. */
  static async getWeeklyTrends(userId: string, role: Role, weeks = 8) {
    const since = new Date();
    since.setDate(since.getDate() - weeks * 7);

    const match = DashboardService.buildMatch(userId, role);
    match.date = { $gte: since };

    const rows = await FinancialRecord.aggregate([
      { $match: match },
      {
        $group: {
          _id: { week: { $isoWeek: "$date" }, year: { $isoWeekYear: "$date" } },
          income: {
            $sum: {
              $cond: [{ $eq: ["$type", TransactionType.INCOME] }, "$amount", 0],
            },
          },
          expenses: {
            $sum: {
              $cond: [
                { $eq: ["$type", TransactionType.EXPENSE] },
                "$amount",
                0,
              ],
            },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.week": 1 } },
    ]);

    return rows.map((r) => {
      const id = r._id as { week: number; year: number };
      return {
        week: id.week,
        year: id.year,
        income: r2(r.income as number),
        expenses: r2(r.expenses as number),
        net: r2((r.income as number) - (r.expenses as number)),
      };
    });
  }

  // ── Shared aggregation match-stage builder ─────────────────────────────────

  private static buildMatch(
    userId: string,
    role: Role,
    startDate?: string,
    endDate?: string,
  ): Record<string, unknown> {
    const match: Record<string, unknown> = { isDeleted: { $ne: true } };

    if (role !== Role.ADMIN) match.createdBy = new Types.ObjectId(userId);

    if (startDate || endDate) {
      const df: Record<string, Date> = {};
      if (startDate) df.$gte = new Date(startDate);
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        df.$lte = e;
      }
      match.date = df;
    }

    return match;
  }
}
