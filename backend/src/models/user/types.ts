import { Document, Model, Types } from "mongoose";

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  lastLogin?: Date;
  loginAttempts: number;
  lockUntil?: Date;

  createdAt: Date;
  updatedAt: Date;

  isLocked: boolean;

  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
  generateRefreshToken(): string;
  generatePasswordResetToken(): string;
  getPublicProfile(): Partial<IUser>;
  updateLastLogin(): Promise<void>;
  isAccountLocked(): boolean;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
}

export interface IUserModel extends Model<IUser> {
  createUser(userData: CreateUserData): Promise<IUser>;
  authenticateUser(email: string, password: string): Promise<IUser>;
  findByEmail(email: string): Promise<IUser | null>;
  findByEmailWithPassword(email: string): Promise<IUser | null>;
  findUserById(id: string): Promise<IUser | null>;
  updateUser(userId: string, updateData: UpdateUserData): Promise<IUser>;
  resetPassword(token: string, newPassword: string): Promise<IUser>;
  changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<IUser>;
  getUsers(
    page: number,
    limit: number,
    filter?: any,
  ): Promise<{
    users: IUser[];
    total: number;
    page: number;
    totalPages: number;
  }>;
  softDeleteUser(userId: string): Promise<IUser>;
  activateUser(userId: string): Promise<IUser>;
  getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    admins: number;
    users: number;
  }>;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  isActive?: boolean;
  role?: UserRole;
}

export interface IUserMethods {
  comparePassword(this: IUser, candidatePassword: string): Promise<boolean>;
  generateAuthToken(this: IUser): string;
  generateRefreshToken(this: IUser): string;
  generatePasswordResetToken(this: IUser): string;
  getPublicProfile(this: IUser): Partial<IUser>;
  updateLastLogin(this: IUser): Promise<void>;
  isAccountLocked(this: IUser): boolean;
  incrementLoginAttempts(this: IUser): Promise<void>;
  resetLoginAttempts(this: IUser): Promise<void>;
}
