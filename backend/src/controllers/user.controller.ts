import { Request, Response, NextFunction } from "express";
import User from "../models/user/index.js";
import { logger } from "../config/winston.js";
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
  ConflictError,
} from "../error/ApiError.js";
import {
  CreateUserData,
  UpdateUserData,
  UserRole,
} from "../models/user/types.js";
import jwt from "jsonwebtoken";
import config from "../config/environments.js";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new ConflictError("User with this email already exists");
    }

    const userData: CreateUserData = {
      name,
      email,
      password,
      role: role || UserRole.USER,
    };

    const user = await User.createUser(userData);
    const token = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: user.getPublicProfile(),
        token,
        refreshToken,
      },
    });
  } catch (error) {
    logger.error("Error in register controller", { error });
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new BadRequestError("Email and password are required");
    }

    const user = await User.authenticateUser(email, password);

    await user.updateLastLogin();

    const token = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: user.getPublicProfile(),
        token,
        refreshToken,
      },
    });
  } catch (error) {
    logger.error("Error in login controller", { error });
    next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new BadRequestError("Refresh token is required");
    }

    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as any;
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    const newToken = user.generateAuthToken();
    const newRefreshToken = user.generateRefreshToken();

    res.status(200).json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    logger.error("Error in refreshToken controller", { error });
    next(error);
  }
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) throw new UnauthorizedError("User not authenticated");

    const user = await User.findById(userId);
    if (!user) throw new NotFoundError("User not found");

    res.status(200).json({
      success: true,
      data: user.getPublicProfile(),
    });
  } catch (error) {
    logger.error("Error in getCurrentUser controller", { error });
    next(error);
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.userId;
    const { name, email } = req.body;
    if (!userId) throw new UnauthorizedError("User not authenticated");

    const updateData: UpdateUserData = { name, email };
    const user = await User.updateUser(userId, updateData);

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user.getPublicProfile(),
    });
  } catch (error) {
    logger.error("Error in updateProfile controller", { error });
    next(error);
  }
};

export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;
    if (!userId) throw new UnauthorizedError("User not authenticated");

    const user = await User.changePassword(
      userId,
      currentPassword,
      newPassword,
    );

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
      data: user.getPublicProfile(),
    });
  } catch (error) {
    logger.error("Error in changePassword controller", { error });
    next(error);
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new BadRequestError("Email is required");
    }

    const user = await User.findByEmail(email);
    if (!user) {
      res.status(200).json({
        success: true,
        message:
          "If an account exists with this email, a password reset link will be sent",
      });
      return;
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save();

    logger.info(`Password reset token for ${email}: ${resetToken}`);

    res.status(200).json({
      success: true,
      message: "Password reset link sent to your email",
      resetToken:
        process.env.NODE_ENV === "development" ? resetToken : undefined,
    });
  } catch (error) {
    logger.error("Error in forgotPassword controller", { error });
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      throw new BadRequestError("Token and new password are required");
    }

    if (newPassword.length < 6) {
      throw new BadRequestError("New password must be at least 6 characters");
    }

    const user = await User.resetPassword(token, newPassword);

    res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    logger.error("Error in resetPassword controller", { error });
    next(error);
  }
};

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const { role, isActive, search } = req.query;

    const filter: any = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const result = await User.getUsers(page, limit, filter);

    res.status(200).json({
      success: true,
      data: {
        users: result.users.map((user) => user.getPublicProfile()),
        pagination: {
          page: result.page,
          totalPages: result.totalPages,
          total: result.total,
          limit,
        },
      },
    });
  } catch (error) {
    logger.error("Error in getAllUsers controller", { error });
    next(error);
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    res.status(200).json({
      success: true,
      data: user.getPublicProfile(),
    });
  } catch (error) {
    logger.error("Error in getUserById controller", { error });
    next(error);
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, role, isActive } = req.body;

    const updateData: UpdateUserData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    const user = await User.updateUser(id as string, updateData);

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user.getPublicProfile(),
    });
  } catch (error) {
    logger.error("Error in updateUser controller", { error });
    next(error);
  }
};

//admin delete user
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    const currentUserId = req.userId?.toString();
    if (id === currentUserId) {
      throw new BadRequestError("You cannot deactivate your own account");
    }

    const user = await User.softDeleteUser(id as string);

    res.status(200).json({
      success: true,
      message: "User deactivated successfully",
      data: user.getPublicProfile(),
    });
  } catch (error) {
    logger.error("Error in deleteUser controller", { error });
    next(error);
  }
};

//admin activate user
export const activateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.activateUser(id as string);

    res.status(200).json({
      success: true,
      message: "User activated successfully",
      data: user.getPublicProfile(),
    });
  } catch (error) {
    logger.error("Error in activateUser controller", { error });
    next(error);
  }
};

// user statistics
export const getUserStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const stats = await User.getUserStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error("Error in getUserStats controller", { error });
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    logger.error("Error in logout controller", { error });
    next(error);
  }
};
