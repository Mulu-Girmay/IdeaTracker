import crypto from "crypto";
import { IUser, IUserModel, CreateUserData, UpdateUserData, UserRole } from "./types.js";
import { UnauthorizedError, NotFoundError, BadRequestError } from "../../error/ApiError.js";

export const createUser = async function (
  this: IUserModel,
  userData: CreateUserData,
): Promise<IUser> {
  const user = new this(userData);
  await user.save();
  return user;
};

export const authenticateUser = async function (
  this: IUserModel,
  email: string,
  password: string,
): Promise<IUser> {
  const user = await this.findOne({ email }).select("+password");

  if (!user) throw new UnauthorizedError("Invalid email or password");

  if (user.isAccountLocked()) {
    throw new UnauthorizedError("Account is temporarily locked. Please try again later.");
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    await user.incrementLoginAttempts();
    throw new UnauthorizedError("Invalid email or password");
  }

  await user.resetLoginAttempts();
  return user;
};

export const findByEmail = async function (
  this: IUserModel,
  email: string,
): Promise<IUser | null> {
  return this.findOne({ email });
};

export const findByEmailWithPassword = async function (
  this: IUserModel,
  email: string,
): Promise<IUser | null> {
  return this.findOne({ email }).select("+password");
};

export const findUserById = async function (
  this: IUserModel,
  id: string,
): Promise<IUser | null> {
  return this.findById(id);
};

export const updateUser = async function (
  this: IUserModel,
  userId: string,
  updateData: UpdateUserData,
): Promise<IUser> {
  const allowedFields: (keyof UpdateUserData)[] = ["name", "email", "isActive", "role"];
  const filtered: Partial<UpdateUserData> = {};

  for (const key of allowedFields) {
    if (updateData[key] !== undefined) filtered[key] = updateData[key] as any;
  }

  if (Object.keys(filtered).length === 0) {
    throw new BadRequestError("No valid fields to update");
  }

  if (filtered.email) {
    const existing = await this.findOne({ email: filtered.email, _id: { $ne: userId } });
    if (existing) throw new BadRequestError("Email already in use by another account");
  }

  const user = await this.findByIdAndUpdate(userId, filtered, { new: true, runValidators: true });
  if (!user) throw new NotFoundError("User not found");
  return user;
};

export const resetPassword = async function (
  this: IUserModel,
  token: string,
  newPassword: string,
): Promise<IUser> {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await this.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() },
  });

  if (!user) throw new UnauthorizedError("Invalid or expired reset token");

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  return user;
};

export const changePassword = async function (
  this: IUserModel,
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<IUser> {
  const user = await this.findById(userId).select("+password");
  if (!user) throw new NotFoundError("User not found");

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw new UnauthorizedError("Current password is incorrect");

  user.password = newPassword;
  await user.save();
  return user;
};

export const getUsers = async function (
  this: IUserModel,
  page: number = 1,
  limit: number = 10,
  filter: any = {},
): Promise<{ users: IUser[]; total: number; page: number; totalPages: number }> {
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    this.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
    this.countDocuments(filter),
  ]);
  return { users, total, page, totalPages: Math.ceil(total / limit) };
};

export const softDeleteUser = async function (
  this: IUserModel,
  userId: string,
): Promise<IUser> {
  const user = await this.findByIdAndUpdate(userId, { isActive: false }, { new: true });
  if (!user) throw new NotFoundError("User not found");
  return user;
};

export const activateUser = async function (
  this: IUserModel,
  userId: string,
): Promise<IUser> {
  const user = await this.findByIdAndUpdate(userId, { isActive: true }, { new: true });
  if (!user) throw new NotFoundError("User not found");
  return user;
};

export const getUserStats = async function (
  this: IUserModel,
): Promise<{ total: number; active: number; inactive: number; admins: number; users: number }> {
  const [total, active, inactive, admins, users] = await Promise.all([
    this.countDocuments(),
    this.countDocuments({ isActive: true }),
    this.countDocuments({ isActive: false }),
    this.countDocuments({ role: UserRole.ADMIN }),
    this.countDocuments({ role: UserRole.USER }),
  ]);
  return { total, active, inactive, admins, users };
};

export const userStatics = {
  createUser,
  authenticateUser,
  findByEmail,
  findByEmailWithPassword,
  findUserById,
  updateUser,
  resetPassword,
  changePassword,
  getUsers,
  softDeleteUser,
  activateUser,
  getUserStats,
};

export default userStatics;
