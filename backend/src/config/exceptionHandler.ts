import { logger } from "./winston.js";
import { Server } from "http";
interface ErrorContext {
  [key: string]: any;
}

interface LogErrorOptions {
  type: string;
  error: Error | any;
  context?: ErrorContext;
}
