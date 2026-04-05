import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import { IUser, Role, UserStatus } from "../types";

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // never returned in queries unless explicitly requested
    },
    role: {
      type: String,
      enum: Object.values(Role),
      default: Role.VIEWER,
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.ACTIVE,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const r = ret as Record<string, unknown>;
        delete r.password;
        delete r.__v;
        return r;
      },
    },
  },
);

// ── Hash password before every save that modifies it ────────────────────────

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password as string, salt);
  next();
});

// ── Instance helper ──────────────────────────────────────────────────────────

userSchema.methods.comparePassword = function (
  candidate: string,
): Promise<boolean> {
  return bcrypt.compare(candidate, this.password as string);
};

// ── Indexes ──────────────────────────────────────────────────────────────────

userSchema.index({ email: 1 });
userSchema.index({ role: 1, status: 1 });

export const User = mongoose.model<IUser>("User", userSchema);
