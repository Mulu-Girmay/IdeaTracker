import { buildApp } from "../src/config/express";
import config from "./config/environments.js";
import { logger } from "./config/winston.js";
import { setupExceptionHandlers } from "./config/exceptionHandler.js";
import connectDB from "./config/db.js";
import http from "http";

setupExceptionHandlers();

const startServer = async () => {
  try {
    await connectDB({
      uri: config.database.uri,
      dbName: config.database.dbName,
    });
    logger.info(" Database connected successfully");

    const app = await buildApp();
    const server = http.createServer(app);

    (global as any).server = server;

    server.listen(config.server.port, () => {
      logger.info(`Server is running on port ${config.server.port}`);
      logger.info(` Environment: ${config.server.nodeEnv}`);
      logger.info(
        `Health check: http://localhost:${config.server.port}/health`,
      );

      if (config.server.isDevelopment) {
        logger.info(`API available at: http://localhost:${config.server.port}`);
      }
    });
    // Handle EXTERNAL SIGNALS
    const gracefulShutdown = (signal: string) => {
      logger.warn(`Received ${signal}, shutting down gracefully...`);
      server.close(() => {
        logger.info("Server closed");
        process.exit(0);
      });

      setTimeout(() => {
        logger.error("Force shutdown after timeout");
        process.exit(1);
      }, 5000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    logger.error(" Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
