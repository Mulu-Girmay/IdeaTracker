import { body, param, query } from "express-validator";
import { IdeaStatus, IdeaCategory } from "../models/idea/types.js";

export const createIdeaValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 3, max: 100 })
    .withMessage("Title must be between 3 and 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters"),

  body("status")
    .optional()
    .isIn(Object.values(IdeaStatus))
    .withMessage(`Status must be one of: ${Object.values(IdeaStatus).join(", ")}`),

  body("category")
    .optional()
    .isIn(Object.values(IdeaCategory))
    .withMessage(`Category must be one of: ${Object.values(IdeaCategory).join(", ")}`),

  body("tags")
    .optional()
    .isArray()
    .withMessage("Tags must be an array")
    .custom((tags: any[]) => tags.every((t) => typeof t === "string"))
    .withMessage("Each tag must be a string"),
];

export const updateIdeaValidation = [
  param("id").isMongoId().withMessage("Invalid idea ID"),

  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Title must be between 3 and 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters"),

  body("status")
    .optional()
    .isIn(Object.values(IdeaStatus))
    .withMessage(`Status must be one of: ${Object.values(IdeaStatus).join(", ")}`),

  body("category")
    .optional()
    .isIn(Object.values(IdeaCategory))
    .withMessage(`Category must be one of: ${Object.values(IdeaCategory).join(", ")}`),

  body("tags")
    .optional()
    .isArray()
    .withMessage("Tags must be an array")
    .custom((tags: any[]) => tags.every((t) => typeof t === "string"))
    .withMessage("Each tag must be a string"),
];

export const ideaIdValidation = [
  param("id").isMongoId().withMessage("Invalid idea ID"),
];

export const getIdeasValidation = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  query("status").optional().isIn(Object.values(IdeaStatus)).withMessage("Invalid status"),
  query("category").optional().isIn(Object.values(IdeaCategory)).withMessage("Invalid category"),
];
