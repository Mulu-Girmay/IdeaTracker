import { logger } from "./winston.js";
import { Server } from "http";

interface ErrorContext {
  [key: string]: any;
}

const logError = (
  type: string,
  error: Error | any,
  context: ErrorContext = {},
): void => {
  logger.error(`${type}:`, {
    error: error.message || error,
    stack: error.stack || "No stack trace available",
    ...context,
  });
};

const gracefulShutdown = (reason: string): void => {
  logger.warn(` Graceful shutdown: ${reason}`);

  const server = (global as any).server as Server | undefined;

  if (server) {
    server.close(() => {
      logger.info("Server closed, exiting process");
      process.exit(1);
    });

    setTimeout(() => {
      logger.error("Force exit after timeout");
      process.exit(1); //Prevents infinite hang
    }, 5000);
  } else {
    process.exit(1);
  }
};
const setupExceptionHandlers = (): void => {
  process.on("uncaughtException", (error: Error) => {
    logError("Uncaught Exception", error, {
      pid: process.pid,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
    gracefulShutdown("Uncaught Exception"); //Handle UNEXPECTED crashes
  });

  process.on("unhandledRejection", (reason: any) => {
    logError("Unhandled Rejection", reason, {
      pid: process.pid,
      uptime: process.uptime(),
    });
    gracefulShutdown("Unhandled Rejection");
  });

  process.on("SIGTERM", () => {
    gracefulShutdown("SIGTERM received");
  });

  process.on("SIGINT", () => {
    gracefulShutdown("SIGINT received");
  });

  process.on("warning", (warning: Error) => {
    logger.warn(" Process warning:", {
      name: warning.name,
      message: warning.message,
      stack: warning.stack,
    });
  });

  console.log(" Exception handlers configured");
};

export { setupExceptionHandlers, logError, gracefulShutdown };

// import express from "express";
// import { setupExceptionHandlers } from "./utils/exceptionHandlers.js";

// setupExceptionHandlers(); //  CRITICAL - Called FIRST!

// const app = express();

// app.get("/crash", () => {
//   throw new Error("BOOM!"); // Still crashes BUT...
// });

// app.listen(3000);
// What happens:

// User visits /crash

// Error is thrown

// Handler catches it

// Logs the error
// Closes server gracefully

// Process exits cleanly
