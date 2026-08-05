import { Request, Response, NextFunction } from "express";
import passport from "../config/passport/passport.js";
import { logger } from "../config/winston.js";
import { AppError } from "../error/AppError.js";
import { IUser, UserRole } from "../models/user/types.js";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  passport.authenticate(
    "jwt",
    { session: false },
    (err: Error | null, user: IUser | false, info: any) => {
      if (err) {
        logger.error("Authentication error:", err);
        return next(err);
      }

      if (!user) {
        res.status(401).json({
          success: false,
          message: info?.message || "Authentication required",
        });
        return;
      }

      req.user = user;
      req.userId = user._id;
      next();
    },
  )(req, res, next);
};

// ================= Role Authorization =================

export const authorize =
  (...roles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user as IUser;

    if (!user || !roles.includes(user.role)) {
      res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
      return;
    }

    next();
  };

export const checkOwnership =
  (model: any, ownerField: string = "owner") =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resource = await model.findById(req.params.id);

      if (!resource) {
        res.status(404).json({ success: false, message: "Resource not found" });
        return;
      }

      const ownerId = resource[ownerField]?.toString();
      const requesterId = req.userId?.toString();

      if (ownerId !== requesterId) {
        res.status(403).json({
          success: false,
          message: "You are not authorized to modify this resource",
        });
        return;
      }

      req.resource = resource;
      next();
    } catch (error) {
      next(error);
    }
  };

export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
};

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  logger.error("Error:", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.userId,
  });

  if (err instanceof AppError) {
    err.sendResponse(res);
    return;
  }

  if (err.name === "ValidationError") {
    const details = Object.values(err.errors).map((e: any) => e.message);
    res
      .status(400)
      .json({ success: false, message: "Validation failed", details });
    return;
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] ?? "field";
    res
      .status(409)
      .json({ success: false, message: `${field} already exists` });
    return;
  }

  if (err.name === "JsonWebTokenError") {
    res.status(401).json({ success: false, message: "Invalid token" });
    return;
  }

  if (err.name === "TokenExpiredError") {
    res.status(401).json({ success: false, message: "Token expired" });
    return;
  }

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
