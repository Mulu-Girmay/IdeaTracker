import winston from "winston";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const levels: Record<string, number> = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const logDir: string = path.join(__dirname, "../../logs");

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length
      ? `\n ${JSON.stringify(meta, null, 2)}`
      : "";
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  }),
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  levels,
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
      format: fileFormat,
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logDir, "combined.log"),
      format: fileFormat,
      maxsize: 10485760,
      maxFiles: 5,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, "exceptions.log"),
      format: fileFormat,
    }),
  ],
  exitOnError: false,
});

const stream: { write: (message: string) => void } = {
  write: (message: string): void => {
    logger.http(message.trim());
  },
};

export { logger, stream };
