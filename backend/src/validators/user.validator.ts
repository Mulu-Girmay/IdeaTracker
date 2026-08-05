const { body } = require("express-validator");
const { PASSWORD_REGEX } = require("../utils/constants");

const userValidators = {
  register: [
    body("name")
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage("Username must be between 3 and 10 characters")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage(
        "Username can only contain letters, numbers, and underscores",
      ),

    body("email")
      .trim()
      .isEmail()
      .withMessage("Please provide a valid email address")
      .normalizeEmail(),

    body("password")
      .matches(PASSWORD_REGEX)
      .withMessage(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
      ),
  ],

  login: [
    body("email")
      .trim()
      .isEmail()
      .withMessage("Please provide a valid email address")
      .normalizeEmail(),

    body("password").notEmpty().withMessage("Password is required"),
  ],

  updateProfile: [
    body("name")
      .optional()
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage("name must be between 3 and 10 characters")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage(
        "Username can only contain letters, numbers, and underscores",
      ),

    body("email")
      .optional()
      .trim()
      .isEmail()
      .withMessage("Please provide a valid email address")
      .normalizeEmail(),
  ],

  changePassword: [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),

    body("newPassword")
      .matches(PASSWORD_REGEX)
      .withMessage(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
      ),
  ],

  forgotPassword: [
    body("email")
      .trim()
      .isEmail()
      .withMessage("Please provide a valid email address")
      .normalizeEmail(),
  ],

  resetPassword: [
    body("token").notEmpty().withMessage("Reset token is required"),

    body("newPassword")
      .matches(PASSWORD_REGEX)
      .withMessage(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
      ),
  ],
};

module.exports = userValidators;
