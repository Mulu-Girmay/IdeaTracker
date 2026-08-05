import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import { logger, stream } from "./winston.js";
import config from "./environments.js";
import "../config/passport/passport.js";
import userRoutes from "../routes/user.routes.js";
import ideaRoutes from "../routes/idea.routes.js";
import { notFound, errorHandler } from "../controllers/middleware.js";

const buildApp = async (): Promise<Application> => {
  const app: Application = express();

  app.use(helmet());
  app.use(cors({ origin: config.cors.origin, credentials: config.cors.credentials }));
  app.use(morgan("combined", { stream }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  if (config.server.isDevelopment) {
    app.use((req: Request, res: Response, next: NextFunction) => {
      logger.debug(`${req.method} ${req.path}`, { ip: req.ip, userAgent: req.get("user-agent") });
      next();
    });
  }

  // Health check
  app.get("/health", (_req: Request, res: Response) => {
    res.json({
      status: "UP",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
    });
  });

  // Routes
  app.use("/api/users", userRoutes);
  app.use("/api/ideas", ideaRoutes);

  // 404 + Error handler — must be last
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

export { buildApp };
