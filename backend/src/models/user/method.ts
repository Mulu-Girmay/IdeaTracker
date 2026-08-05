import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import config from "../../config/environments.js";
import { IUser, IUserMethods } from "../user/types.js";

export const comparePassword = async function (
  this: IUser,
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const generateAuthToken = function (this: IUser): string {
  return jwt.sign(
    {
      userId: this._id,
      email: this.email,
      role: this.role,
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.expiresIn,
    },
  );
};

export const generateRefreshToken = function (this: IUser): string {
  return jwt.sign(
    {
      userId: this._id,
    },
    config.jwt.refreshSecret,
    {
      expiresIn: config.jwt.refreshExpiresIn,
    },
  );
};

export const generatePasswordResetToken = function (this: IUser): string {
  this.resetPasswordToken = undefined;
  this.resetPasswordExpires = undefined;

  const resetToken = crypto.randomBytes(32).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);
  return resetToken;
};

export const getPublicProfile = function (this: IUser): Partial<IUser> {
  const user = this.toObject();

  const sensitiveFields: (keyof IUser)[] = [
    "password",
    "resetPasswordToken",
    "resetPasswordExpires",
    "loginAttempts",
    "lockUntil",
  ];

  sensitiveFields.forEach((field) => {
    delete user[field];
  });

  return user;
};

export const updateLastLogin = async function (this: IUser): Promise<void> {
  this.lastLogin = new Date();
  await this.save();
};

export const isAccountLocked = function (this: IUser): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

export const incrementLoginAttempts = async function (
  this: IUser,
): Promise<void> {
  this.loginAttempts += 1;

  if (this.loginAttempts >= 5) {
    this.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  }

  await this.save();
};

export const resetLoginAttempts = async function (this: IUser): Promise<void> {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  await this.save();
};

export const userMethods: IUserMethods = {
  comparePassword,
  generateAuthToken,
  generateRefreshToken,
  generatePasswordResetToken,
  getPublicProfile,
  updateLastLogin,
  isAccountLocked,
  incrementLoginAttempts,
  resetLoginAttempts,
};

export default userMethods;
