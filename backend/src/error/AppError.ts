import { Response } from "express";

export interface AppErrorOptions {
  isOperational?: boolean;
  statusCode?: number;
  status?: string;
  details?: any;
  isPublic?: boolean;
  cause?: Error;
}

export interface ErrorResponse {
  name: string;
  message: string;
  statusCode: number;
  status: string;
  details?: any;
  isPublic: boolean;
  stack?: string;
  timestamp: string;
  path?: string;
  method?: string;
  correlationId?: string;
}

export class AppError extends Error {
  public readonly isOperational: boolean;
  public readonly statusCode: number;
  public readonly status: string;
  public readonly details: any;
  public readonly isPublic: boolean;
  public readonly cause?: Error;
  public readonly timestamp: string;
  public path?: string;
  public method?: string;
  public correlationId?: string;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message);

    this.name = this.constructor.name;
    this.isOperational = options.isOperational ?? true;
    this.statusCode = options.statusCode ?? 500;
    this.status = options.status ?? this.getDefaultStatus();
    this.details = options.details ?? null;
    this.isPublic = options.isPublic ?? false;
    this.cause = options.cause;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }

  private getDefaultStatus(): string {
    if (this.statusCode >= 500) return "error";
    if (this.statusCode >= 400) return "fail";
    return "success";
  }

  public toJSON(): ErrorResponse {
    const response: ErrorResponse = {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      status: this.status,
      isPublic: this.isPublic,
      timestamp: this.timestamp,
      details: this.details,
    };

    if (process.env.NODE_ENV === "development") {
      response.stack = this.stack;
    }

    if (this.path) {
      response.path = this.path;
    }
    if (this.method) {
      response.method = this.method;
    }
    if (this.correlationId) {
      response.correlationId = this.correlationId;
    }

    return response;
  }

  public sendResponse(res: Response): Response {
    const data = this.toJSON();

    if (!this.isPublic) {
      delete data.details;
    }

    if (process.env.NODE_ENV !== "development") {
      delete data.stack;
      if (!this.isPublic) {
        data.message = "Internal Server Error";
      }
    }

    return res.status(this.statusCode).json({
      success: false,
      ...data,
    });
  }

  public isOperationalError(): boolean {
    return this.isOperational;
  }

  public getClientMessage(): string {
    if (this.isPublic) {
      return this.message;
    }
    return "Internal Server Error";
  }
}

export default AppError;
