import "server-only";

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super("UNAUTHORIZED", message, 401);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: unknown) {
    super("BAD_REQUEST", message, 400, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super("NOT_FOUND", message, 404);
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests, please try again later") {
    super("RATE_LIMITED", message, 429);
  }
}
