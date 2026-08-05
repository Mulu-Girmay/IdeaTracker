import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import { logger, stream } from "./winston.js";
import config from "./environments.js";

interface RequestLog {
  method: string;
  path: string;
  ip: string | undefined;
  userAgent: string | undefined;
}

const buildApp = async (): Promise<Application> => {
  const app: Application = express();

  app.use(helmet());

  app.use(
    cors({
      origin: config.cors.origin,
      credentials: config.cors.credentials,
    }),
  );

  app.use(morgan("combined", { stream }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  if (config.server.isDevelopment) {
    app.use((req: Request, res: Response, next: NextFunction) => {
      const logData: RequestLog = {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get("user-agent"),
      };
      logger.debug(`${req.method} ${req.path}`, logData);
      next();
    });
  }

  app.get("/health", (req: Request, res: Response) => {
    res.json({
      status: "UP",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
    });
  });

  return app;
};

export { buildApp };
