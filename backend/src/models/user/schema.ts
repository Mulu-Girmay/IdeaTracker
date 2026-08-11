import mongoose, { Schema } from "mongoose";
import { IUser, IUserModel, UserRole } from "./types.js";
import { logger } from "../../config/winston.js";
import userMethods from "./method.js";
import userStatics from "./statics.js";
import bcrypt from "bcryptjs";

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
      match: [
        /^[a-zA-Z0-9_]+(?: [a-zA-Z0-9_]+)*$/,
        "Username can only contain letters, numbers, underscores, and single spaces between words",
      ],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    isActive: {
      type: Boolean,
      default: true,
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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

UserSchema.index({ resetPasswordToken: 1 }, { sparse: true });
UserSchema.index({ isActive: 1 });
UserSchema.index({ role: 1 });

UserSchema.virtual("isLocked").get(function (this: IUser): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
});

UserSchema.pre("save", async function (this: IUser) {
  if (!this.isModified("password")) return;
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    logger.error("Error hashing password", { error });
  }
});

UserSchema.methods = { ...UserSchema.methods, ...userMethods } as any;
UserSchema.statics = { ...UserSchema.statics, ...userStatics } as any;

const User = mongoose.model<IUser, IUserModel>("User", UserSchema);

export default User;
