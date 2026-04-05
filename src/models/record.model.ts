import mongoose, { Schema } from "mongoose";
import { IFinancialRecord, TransactionType, CATEGORIES } from "../types";

const financialRecordSchema = new Schema<IFinancialRecord>(
  {
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },
    type: {
      type: String,
      enum: Object.values(TransactionType),
      required: [true, "Transaction type is required"],
    },
    category: {
      type: String,
      enum: [...CATEGORIES],
      required: [true, "Category is required"],
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // ── Soft delete fields ────────────────────────────────────────────────────
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const r = ret as Record<string, unknown>;
        delete r.__v;
        delete r.isDeleted;
        delete r.deletedAt;
        return r;
      },
    },
  },
);

// ── Automatically exclude soft-deleted docs from all find* queries ───────────

financialRecordSchema.pre(
  /^find/,
  function (this: mongoose.Query<unknown, unknown>, next) {
    if (this.getFilter().isDeleted === undefined) {
      this.where({ isDeleted: { $ne: true } });
    }
    next();
  },
);

// ── Indexes ──────────────────────────────────────────────────────────────────

financialRecordSchema.index({ createdBy: 1, date: -1 });
financialRecordSchema.index({ type: 1, category: 1 });
financialRecordSchema.index({ date: -1 });
financialRecordSchema.index({ isDeleted: 1 });

export const FinancialRecord = mongoose.model<IFinancialRecord>(
  "FinancialRecord",
  financialRecordSchema,
);
