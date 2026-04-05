import { z } from "zod";
import { TransactionType, CATEGORIES } from "../types";

const categoryEnum = z.enum(CATEGORIES);

export const createRecordSchema = z.object({
  body: z.object({
    amount: z
      .number({
        required_error: "Amount is required",
        invalid_type_error: "Amount must be a number",
      })
      .positive("Amount must be greater than 0"),
    type: z.nativeEnum(TransactionType, {
      required_error: "Transaction type is required",
      invalid_type_error: `Type must be one of: ${Object.values(TransactionType).join(", ")}`,
    }),
    category: categoryEnum,
    date: z
      .string({ required_error: "Date is required" })
      .refine(
        (v) => !isNaN(Date.parse(v)),
        "Date must be a valid date (e.g. 2024-06-15)",
      ),
    notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
  }),
});

export const updateRecordSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    amount: z.number().positive("Amount must be greater than 0").optional(),
    type: z.nativeEnum(TransactionType).optional(),
    category: categoryEnum.optional(),
    date: z
      .string()
      .refine((v) => !isNaN(Date.parse(v)), "Invalid date")
      .optional(),
    notes: z.string().max(500).optional(),
  }),
});

export const recordFilterSchema = z.object({
  query: z
    .object({
      type: z.nativeEnum(TransactionType).optional(),
      category: categoryEnum.optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      minAmount: z
        .string()
        .optional()
        .transform((v) => (v !== undefined ? parseFloat(v) : undefined)),
      maxAmount: z
        .string()
        .optional()
        .transform((v) => (v !== undefined ? parseFloat(v) : undefined)),
      search: z.string().optional(),
      page: z
        .string()
        .optional()
        .transform((v) => (v !== undefined ? parseInt(v, 10) : 1)),
      limit: z
        .string()
        .optional()
        .transform((v) =>
          v !== undefined ? Math.min(parseInt(v, 10), 100) : 10,
        ),
      sortBy: z
        .enum(["date", "amount", "category", "type", "createdAt"])
        .optional()
        .default("date"),
      sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
    })
    .default({}),
});

export const recordIdParamSchema = z.object({
  params: z.object({ id: z.string().min(1, "Record ID is required") }),
});
