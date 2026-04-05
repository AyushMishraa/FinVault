import { Request } from "express";
import { Document, Types } from "mongoose";

export enum Role {
  VIEWER = "viewer",
  ANALYST = "analyst",
  ADMIN = "admin",
}

export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export enum TransactionType {
  INCOME = "income",
  EXPENSE = "expense",
}

export const CATEGORIES = [
  "salary",
  "freelance",
  "investment",
  "rent",
  "utilities",
  "groceries",
  "healthcare",
  "entertainment",
  "transport",
  "education",
  "insurance",
  "loan",
  "tax",
  "other",
] as const;

export type Category = (typeof CATEGORIES)[number];

// ─────────────────────────────────────────────────────────────────────────────
// Mongoose document interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: Role;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

export interface IFinancialRecord extends Document {
  _id: Types.ObjectId;
  amount: number;
  type: TransactionType;
  category: Category;
  date: Date;
  notes?: string;
  createdBy: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────────────────

export interface TokenPayload {
  id: string;
  email: string;
  role: Role;
}

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────────────────────────────────────

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

// ─────────────────────────────────────────────────────────────────────────────
// Record filters (populated from query string after Zod coercion)
// ─────────────────────────────────────────────────────────────────────────────

export interface RecordFilters {
  type?: TransactionType;
  category?: Category;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
