import { body } from "express-validator";

const ideaValidators = {
  create: [
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
  ],

  update: [
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
  ],
};

export default ideaValidators;
