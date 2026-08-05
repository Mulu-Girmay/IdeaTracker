import userRoutes from "../routes/user.routes.js";
import ideasRoutes from "../routes/idea.routes.js";

import express from "express";
const router = express.Router();
router.use("/users", userRoutes);
router.use("/ideas", ideasRoutes);

export default router;
