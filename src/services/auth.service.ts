import jwt from "jsonwebtoken";
import { User } from "../models/user.model";
import { IUser, Role, TokenPayload } from "../types";
import { ApiError } from "../utils/ApiError";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: Role;
}
interface LoginInput {
  email: string;
  password: string;
}
interface AuthResult {
  user: Record<string, unknown>;
  token: string;
}

export class AuthService {
  /**
   * Registers a new user account.
   *
   * Bootstrap rule: if this is the very first user in the database,
   * they are automatically granted the ADMIN role so the system can be
   * set up without manual database edits.
   */
  static async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await User.findOne({ email: input.email });
    if (existing)
      throw ApiError.conflict("An account with this email already exists");

    const count = await User.countDocuments();
    const role = count === 0 ? Role.ADMIN : (input.role ?? Role.VIEWER);

    const user = await User.create({ ...input, role });
    const token = AuthService.sign(user);

    return { user: user.toJSON() as Record<string, unknown>, token };
  }

  /**
   * Validates email + password and returns a signed JWT on success.
   */
  static async login(input: LoginInput): Promise<AuthResult> {
    // password field is select:false — must be explicitly requested
    const user = await User.findOne({ email: input.email }).select("+password");
    if (!user) throw ApiError.unauthorized("Invalid email or password");

    const ok = await user.comparePassword(input.password);
    if (!ok) throw ApiError.unauthorized("Invalid email or password");

    if (user.status === "inactive") {
      throw ApiError.unauthorized("Account deactivated — contact an admin.");
    }

    const token = AuthService.sign(user);
    return { user: user.toJSON() as Record<string, unknown>, token };
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private static sign(user: IUser): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw ApiError.internal("JWT secret is not configured");

    const payload: TokenPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, secret, {
      expiresIn: (process.env.JWT_EXPIRES_IN ??
        "7d") as jwt.SignOptions["expiresIn"],
    });
  }
}
