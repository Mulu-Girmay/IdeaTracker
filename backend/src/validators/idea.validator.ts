// src/models/User.ts
import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

// User status enum
export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
  PENDING_VERIFICATION = "pending_verification",
}

// User interface
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string; // Virtual field, not stored in DB
  role: UserRole;
  status: UserStatus;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  lastLogin?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  profilePicture?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateEmailVerificationToken(): string;
  generatePasswordResetToken(): string;
  isAccountLocked(): boolean;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
}

// User schema
const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
      select: false, // Don't return password by default in queries
    },
    confirmPassword: {
      type: String,
      required: [true, "Please confirm your password"],
      validate: {
        validator: function (this: IUser, value: string): boolean {
          return this.password === value;
        },
        message: "Passwords do not match",
      },
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.PENDING_VERIFICATION,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
    lastLogin: {
      type: Date,
    },
    loginAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    lockUntil: {
      type: Date,
    },
    profilePicture: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: [500, "Bio cannot exceed 500 characters"],
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.password;
        delete ret.confirmPassword;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: (doc, ret) => {
        delete ret.password;
        delete ret.confirmPassword;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Indexes for performance
UserSchema.index({ email: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ emailVerificationToken: 1 }, { sparse: true });
UserSchema.index({ resetPasswordToken: 1 }, { sparse: true });

// Pre-save middleware - Hash password
UserSchema.pre<IUser>("save", async function (next) {
  // Only hash if password is modified
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);

    // Remove confirmPassword field after validation
    this.confirmPassword = undefined;
    next();
  } catch (error: any) {
    next(error);
  }
});

// Pre-save middleware - Set defaults
UserSchema.pre<IUser>("save", function (next) {
  // Set default status if not provided
  if (!this.status) {
    this.status = UserStatus.PENDING_VERIFICATION;
  }

  // Set default role if not provided
  if (!this.role) {
    this.role = UserRole.USER;
  }

  next();
});

// Instance methods
UserSchema.methods.comparePassword = async function (
  this: IUser,
  candidatePassword: string,
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.generateEmailVerificationToken = function (
  this: IUser,
): string {
  const token = crypto.randomBytes(32).toString("hex");
  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return token;
};

UserSchema.methods.generatePasswordResetToken = function (this: IUser): string {
  const token = crypto.randomBytes(32).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  this.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  return token;
};

UserSchema.methods.isAccountLocked = function (this: IUser): boolean {
  if (!this.lockUntil) return false;
  return this.lockUntil > new Date();
};

UserSchema.methods.incrementLoginAttempts = async function (
  this: IUser,
): Promise<void> {
  this.loginAttempts += 1;

  // Lock account after 5 failed attempts
  if (this.loginAttempts >= 5) {
    this.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
  }

  await this.save();
};

UserSchema.methods.resetLoginAttempts = async function (
  this: IUser,
): Promise<void> {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  await this.save();
};

// Static methods
interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
  findActiveUsers(): Promise<IUser[]>;
  countByRole(role: UserRole): Promise<number>;
}

UserSchema.statics.findByEmail = async function (
  email: string,
): Promise<IUser | null> {
  return await this.findOne({ email }).select("+password");
};

UserSchema.statics.findActiveUsers = async function (): Promise<IUser[]> {
  return await this.find({ status: UserStatus.ACTIVE });
};

UserSchema.statics.countByRole = async function (
  role: UserRole,
): Promise<number> {
  return await this.countDocuments({ role });
};

// Create and export User model
const User = mongoose.model<IUser, IUserModel>("User", UserSchema);

export default User;
