import { body, param, query } from "express-validator";
import { UserRole } from "../models/user/types.js";

export const registerValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 3, max: 30 })
    .withMessage("Name must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_]+(?: [a-zA-Z0-9_]+)*$/)
    .withMessage("Name can only contain letters, numbers, and underscores")
    .custom((value: string) => {
      if (/\s{2,}/.test(value)) {
        throw new Error("Name cannot contain consecutive spaces");
      }
      return true;
    })
    .custom((value: string) => {
      if (value.startsWith(" ") || value.endsWith(" ")) {
        throw new Error("Name cannot start or end with a space");
      }
      return true;
    }),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  body("role")
    .optional()
    .isIn(Object.values(UserRole))
    .withMessage(`Role must be one of: ${Object.values(UserRole).join(", ")}`),
];

export const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password").notEmpty().withMessage("Password is required"),
];

export const updateProfileValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Name must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Name can only contain letters, numbers, and underscores"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
];

export const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters"),
];

export const forgotPasswordValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
];

export const resetPasswordValidation = [
  body("token").notEmpty().withMessage("Reset token is required"),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

export const updateUserValidation = [
  param("id")
    .notEmpty()
    .withMessage("User ID is required")
    .isMongoId()
    .withMessage("Invalid user ID format"),

  body("name")
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Name must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Name can only contain letters, numbers, and underscores"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("role")
    .optional()
    .isIn(Object.values(UserRole))
    .withMessage(`Role must be one of: ${Object.values(UserRole).join(", ")}`),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
];

export const getUserStatsValidation = [
  query("startDate").optional().isISO8601().withMessage("Invalid date format"),

  query("endDate").optional().isISO8601().withMessage("Invalid date format"),
];
