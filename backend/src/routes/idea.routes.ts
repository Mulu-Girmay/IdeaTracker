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

router.post(
  "/create",
  validateRequest(createIdeaValidation),
  ideaController.createIdea,
);

router.get(
  "/my",
  validateRequest(getIdeasValidation),
  ideaController.getMyIdeas,
);

router.get(
  "/view/:id",
  validateRequest(ideaIdValidation),
  ideaController.getIdeaById,
);

router.put(
  "/update/:id",
  validateRequest(updateIdeaValidation),
  ideaController.updateIdea,
);

router.delete(
  "/delete/:id",
  validateRequest(ideaIdValidation),
  ideaController.deleteIdea,
);

router.get(
  "/all",
  authorize(UserRole.ADMIN),
  validateRequest(getIdeasValidation),
  ideaController.getAllIdeas,
);

export default router;
