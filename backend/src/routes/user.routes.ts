import express from "express";
import * as userController from "../controllers/user.controller.js";
import { authenticate, authorize } from "../controllers/middleware.js";
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

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: "Too many authentication attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: "Too many password reset attempts, please try again later",
});

router.post(
  "/register",
  authLimiter,
  validateRequest(registerValidation),
  userController.register,
);

router.post(
  "/login",
  authLimiter,
  validateRequest(loginValidation),
  userController.login,
);

router.post("/refresh-token", userController.refreshToken);

router.post(
  "/forgot-password",
  passwordResetLimiter,
  validateRequest(forgotPasswordValidation),
  userController.forgotPassword,
);

router.post(
  "/reset-password",
  passwordResetLimiter,
  validateRequest(resetPasswordValidation),
  userController.resetPassword,
);

router.get("/me", authenticate, userController.getCurrentUser);

router.put(
  "/me",
  authenticate,
  validateRequest(updateProfileValidation),
  userController.updateProfile,
);

router.post(
  "/change-password",
  authenticate,
  validateRequest(changePasswordValidation),
  userController.changePassword,
);

router.post("/logout", authenticate, userController.logout);

router.get(
  "/allUsers",
  authenticate,
  authorize(UserRole.ADMIN),
  userController.getAllUsers,
);

router.get(
  "/userStats",
  authenticate,
  authorize(UserRole.ADMIN),
  userController.getUserStats,
);

router.get(
  "/viewUser/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  userController.getUserById,
);

router.put(
  "/editUser:id",
  authenticate,
  authorize(UserRole.ADMIN),
  validateRequest(updateUserValidation),
  userController.updateUser,
);

router.delete(
  "/deleteUser/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  userController.deleteUser,
);

router.post(
  "/activateUser:id/activate",
  authenticate,
  authorize(UserRole.ADMIN),
  userController.activateUser,
);

export default router;
