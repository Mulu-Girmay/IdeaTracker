import express from "express";
import * as ideaController from "../controllers/idea.conroller.js";
import {
  authenticate,
  authorize,
  validateRequest,
} from "../controllers/middleware.js";
import {
  createIdeaValidation,
  updateIdeaValidation,
  ideaIdValidation,
  getIdeasValidation,
} from "../validators/idea.validator.js";
import { UserRole } from "../models/user/types.js";

const router = express.Router();

router.use(authenticate);

/**
 * @route POST /api/ideas
 * @desc Create a new idea
 * @access Private (User + Admin)
 */
router.post(
  "/",
  validateRequest(createIdeaValidation),
  ideaController.createIdea,
);

/**
 * @route GET /api/ideas/my
 * @desc Get current user's ideas
 * @access Private (User + Admin)
 */
router.get(
  "/my",
  validateRequest(getIdeasValidation),
  ideaController.getMyIdeas,
);

/**
 * @route GET /api/ideas/:id
 * @desc Get idea by ID (owner or admin only)
 * @access Private
 */
router.get(
  "/:id",
  validateRequest(ideaIdValidation),
  ideaController.getIdeaById,
);

/**
 * @route PUT /api/ideas/:id
 * @desc Update idea (owner or admin only)
 * @access Private
 */
router.put(
  "/:id",
  validateRequest(updateIdeaValidation),
  ideaController.updateIdea,
);

/**
 * @route DELETE /api/ideas/:id
 * @desc Delete idea (owner or admin only)
 * @access Private
 */
router.delete(
  "/:id",
  validateRequest(ideaIdValidation),
  ideaController.deleteIdea,
);

// ============================================
// ADMIN ONLY ROUTES
// ============================================

/**
 * @route GET /api/ideas
 * @desc Get all ideas with filters and pagination
 * @access Admin
 */
router.get(
  "/",
  authorize(UserRole.ADMIN),
  validateRequest(getIdeasValidation),
  ideaController.getAllIdeas,
);

export default router;
