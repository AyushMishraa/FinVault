import { User } from "../models/user.model";
import { IUser, Role, UserStatus } from "../types";
import { ApiError } from "../utils/ApiError";

interface UpdateInput {
  name?: string;
  role?: Role;
  status?: UserStatus;
}

export class UserService {
  /** Admins see all users; other roles see only active users. */
  static async getAll(requesterRole: Role): Promise<IUser[]> {
    const filter =
      requesterRole === Role.ADMIN ? {} : { status: UserStatus.ACTIVE };
    return User.find(filter).sort({ createdAt: -1 });
  }

  static async getById(id: string): Promise<IUser> {
    const user = await User.findById(id);
    if (!user) throw ApiError.notFound("User");
    return user;
  }

  /**
   * Updates name, role, and/or status.
   * Guards prevent accidentally locking out the last admin.
   */
  static async update(id: string, input: UpdateInput): Promise<IUser> {
    const user = await User.findById(id);
    if (!user) throw ApiError.notFound("User");

    // Cannot demote the last admin
    if (input.role && input.role !== Role.ADMIN && user.role === Role.ADMIN) {
      const adminCount = await User.countDocuments({ role: Role.ADMIN });
      if (adminCount === 1)
        throw ApiError.badRequest("Cannot change the role of the last admin");
    }

    // Cannot deactivate the last active admin
    if (input.status === UserStatus.INACTIVE && user.role === Role.ADMIN) {
      const activeAdmins = await User.countDocuments({
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
      });
      if (activeAdmins === 1)
        throw ApiError.badRequest("Cannot deactivate the last active admin");
    }

    Object.assign(user, input);
    await user.save();
    return user;
  }

  /** Flips active ↔ inactive. */
  static async toggleStatus(id: string): Promise<IUser> {
    const user = await User.findById(id);
    if (!user) throw ApiError.notFound("User");
    const next =
      user.status === UserStatus.ACTIVE
        ? UserStatus.INACTIVE
        : UserStatus.ACTIVE;
    return UserService.update(id, { status: next });
  }
}
