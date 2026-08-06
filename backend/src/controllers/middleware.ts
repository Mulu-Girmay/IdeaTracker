import { Request, Response, NextFunction } from "express";
import { validationResult, ValidationChain } from "express-validator";
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
        logger.error("Authentication error:", {
          error: err.message,
          stack: err.stack,
          path: req.path,
        });
        return next(new AppError("Authentication failed", { statusCode: 500 }));
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: info?.message || "Authentication required",
          code: "UNAUTHORIZED",
        });
      }

      if (user.isActive === false) {
        return res.status(401).json({
          success: false,
          message: "Account is deactivated. Please contact support.",
          code: "ACCOUNT_DEACTIVATED",
        });
      }
      if (info?.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Access token expired",
          code: "TOKEN_EXPIRED",
        });
      }

      if (user.isAccountLocked && user.isAccountLocked()) {
        return res.status(401).json({
          success: false,
          message: "Account is temporarily locked. Please try again later.",
          code: "ACCOUNT_LOCKED",
        });
      }

      req.user = user;
      req.userId = user._id;
      next();
    },
  )(req, res, next);
};

export const authorize =
  (...roles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user as IUser;

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
        code: "UNAUTHORIZED",
      });
      return;
    }

    if (!roles.includes(user.role)) {
      logger.warn("Authorization failed", {
        userId: user._id,
        userRole: user.role,
        requiredRoles: roles,
        path: req.path,
      });

      res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
        code: "FORBIDDEN",
        requiredRoles: roles,
      });
      return;
    }

    next();
  };

export const checkOwnership = (
  model: any,
  ownerField: string = "owner",
  idParam: string = "id",
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const resourceId = req.params[idParam];

      if (!resourceId) {
        res.status(400).json({
          success: false,
          message: "Resource ID is required",
          code: "MISSING_RESOURCE_ID",
        });
        return;
      }

      const resource = await model.findById(resourceId);

      if (!resource) {
        res.status(404).json({
          success: false,
          message: "Resource not found",
          code: "RESOURCE_NOT_FOUND",
        });
        return;
      }

      const ownerId = resource[ownerField]?.toString();
      const requesterId = req.userId?.toString();

      if (ownerId !== requesterId) {
        const user = req.user as IUser;
        if (user && user.role === UserRole.ADMIN) {
          req.resource = resource;
          next();
          return;
        }

        res.status(403).json({
          success: false,
          message: "You are not authorized to modify this resource",
          code: "NOT_OWNER",
          ownerId,
          requesterId,
        });
        return;
      }

      req.resource = resource;
      next();
    } catch (error) {
      logger.error("Error in checkOwnership middleware:", { error });
      next(
        new AppError("Error checking resource ownership", { statusCode: 500 }),
      );
    }
  };
};

export const requirePermission = (
  roles: UserRole[] = [],
  options: {
    checkOwnership?: boolean;
    model?: any;
    ownerField?: string;
    idParam?: string;
  } = {},
) => {
  return [
    authenticate,
    ...(roles.length > 0 ? [authorize(...roles)] : []),
    ...(options.checkOwnership && options.model
      ? [checkOwnership(options.model, options.ownerField, options.idParam)]
      : []),
  ];
};

export const validateRequest =
  (validations: ValidationChain[]) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await Promise.all(validations.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        details: errors
          .array()
          .map((e) => ({ field: (e as any).path, message: e.msg })),
      });
      return;
    }
    next();
  };

export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    code: "ROUTE_NOT_FOUND",
  });
};

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  logger.error("Error occurred:", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.userId,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  if (err instanceof AppError) {
    err.sendResponse(res);
    return;
  }

  if (err.name === "ValidationError") {
    const details = Object.values(err.errors).map((e: any) => ({
      field: e.path,
      message: e.message,
      value: e.value,
    }));
    res.status(400).json({
      success: false,
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      details,
    });
    return;
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] ?? "field";
    const value = err.keyValue?.[field] || "";
    res.status(409).json({
      success: false,
      message: `${field} already exists`,
      code: "DUPLICATE_KEY",
      field,
      value,
    });
    return;
  }

  if (err.name === "JsonWebTokenError") {
    res.status(401).json({
      success: false,
      message: "Invalid token",
      code: "INVALID_TOKEN",
    });
    return;
  }

  if (err.name === "TokenExpiredError") {
    res.status(401).json({
      success: false,
      message: "Token expired",
      code: "TOKEN_EXPIRED",
      expiredAt: err.expiredAt,
    });
    return;
  }

  const isDevelopment = process.env.NODE_ENV === "development";
  res.status(500).json({
    success: false,
    message: isDevelopment ? err.message : "Internal Server Error",
    code: "INTERNAL_SERVER_ERROR",
    ...(isDevelopment && { stack: err.stack }),
    ...(isDevelopment && { details: err }),
  });
};
