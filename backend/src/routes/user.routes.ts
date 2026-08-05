import express from "express";
import * as userController from "../controllers/user.controller.js";
import {
  authenticate,
  authorize,
  checkOwnership,
} from "../controllers/middleware.js";
import { validateRequest } from "../controllers/middleware.js";
import {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation,
  resetPasswordValidation,
  forgotPasswordValidation,
  updateUserValidation,
} from "../validators/user.validator.js";
import { rateLimit } from "express-rate-limit";
import { UserRole } from "../models/user/types.js";
import User from "../models/user/index.js";

const router = express.Router();

// Rate limiting for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: "Too many authentication attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: "Too many password reset attempts, please try again later",
});

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

/**
 * @route POST /api/users/register
 * @desc Register a new user
 * @access Public
 */
router.post(
  "/register",
  authLimiter,
  validateRequest(registerValidation),
  userController.register,
);

/**
 * @route POST /api/users/login
 * @desc Login user
 * @access Public
 */
router.post(
  "/login",
  authLimiter,
  validateRequest(loginValidation),
  userController.login,
);

/**
 * @route POST /api/users/refresh-token
 * @desc Refresh access token
 * @access Public
 */
router.post("/refresh-token", userController.refreshToken);

/**
 * @route POST /api/users/forgot-password
 * @desc Request password reset
 * @access Public
 */
router.post(
  "/forgot-password",
  passwordResetLimiter,
  validateRequest(forgotPasswordValidation),
  userController.forgotPassword,
);

/**
 * @route POST /api/users/reset-password
 * @desc Reset password with token
 * @access Public
 */
router.post(
  "/reset-password",
  passwordResetLimiter,
  validateRequest(resetPasswordValidation),
  userController.resetPassword,
);

// ============================================
// AUTHENTICATED ROUTES (Requires valid JWT)
// ============================================

/**
 * @route GET /api/users/me
 * @desc Get current user profile
 * @access Private
 */
router.get("/me", authenticate, userController.getCurrentUser);

/**
 * @route PUT /api/users/me
 * @desc Update current user profile
 * @access Private
 */
router.put(
  "/me",
  authenticate,
  validateRequest(updateProfileValidation),
  userController.updateProfile,
);

/**
 * @route POST /api/users/change-password
 * @desc Change current user password
 * @access Private
 */
router.post(
  "/change-password",
  authenticate,
  validateRequest(changePasswordValidation),
  userController.changePassword,
);

/**
 * @route POST /api/users/logout
 * @desc Logout user
 * @access Private
 */
router.post("/logout", authenticate, userController.logout);

// ============================================
// ADMIN ROUTES (Requires JWT + Admin role)
// ============================================

/**
 * @route GET /api/users
 * @desc Get all users with pagination and filters
 * @access Admin
 */
router.get(
  "/",
  authenticate,
  authorize(UserRole.ADMIN),
  userController.getAllUsers,
);

/**
 * @route GET /api/users/stats
 * @desc Get user statistics
 * @access Admin
 */
router.get(
  "/stats",
  authenticate,
  authorize(UserRole.ADMIN),
  userController.getUserStats,
);

/**
 * @route GET /api/users/:id
 * @desc Get user by ID
 * @access Admin
 */
router.get(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  userController.getUserById,
);

/**
 * @route PUT /api/users/:id
 * @desc Update user by ID (admin)
 * @access Admin
 */
router.put(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  validateRequest(updateUserValidation),
  userController.updateUser,
);

/**
 * @route DELETE /api/users/:id
 * @desc Soft delete user (deactivate)
 * @access Admin
 */
router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  userController.deleteUser,
);

/**
 * @route POST /api/users/:id/activate
 * @desc Activate user
 * @access Admin
 */
router.post(
  "/:id/activate",
  authenticate,
  authorize(UserRole.ADMIN),
  userController.activateUser,
);

export default router;
