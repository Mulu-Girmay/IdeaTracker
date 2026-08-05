import { AppError } from "./AppError.js";
export class APIError extends AppError {
  constructor(message: string, statusCode: number = 500, details: any = null) {
    const status = statusCode >= 400 && statusCode < 500 ? "fail" : "error";

    super(message, {
      statusCode,
      status,
      details,
      isPublic: true,
    });
  }
}
class BadRequestError extends APIError {
  constructor(message = "Bad request", details = null) {
    super(message, 400, details);
    this.name = "BadRequestError";
  }
}

class UnauthorizedError extends APIError {
  constructor(message = "Unauthorized", details = null) {
    super(message, 401, details);
    this.name = "UnauthorizedError";
  }
}

class ForbiddenError extends APIError {
  constructor(message = "Forbidden", details = null) {
    super(message, 403, details);
    this.name = "ForbiddenError";
  }
}

class NotFoundError extends APIError {
  constructor(message = "Resource not found", details = null) {
    super(message, 404, details);
    this.name = "NotFoundError";
  }
}

class ConflictError extends APIError {
  constructor(message = "Resource already exists", details = null) {
    super(message, 409, details);
    this.name = "ConflictError";
  }
}

class ValidationError extends APIError {
  constructor(message = "Validation failed", details = null) {
    super(message, 400, details);
    this.name = "ValidationError";
  }
}

class InternalServerError extends APIError {
  constructor(message = "Internal server error", details = null) {
    super(message, 500, details);
    this.name = "InternalServerError";
  }
}

module.exports = {
  APIError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  InternalServerError,
};
