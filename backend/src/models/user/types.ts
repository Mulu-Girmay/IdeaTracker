// src/models/types/user.types.ts
import { Document, Types } from "mongoose";

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

export interface IUser extends Document {
  // Fields
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
  fullName: string;
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
