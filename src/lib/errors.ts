/**
 * PostPilot — Application Errors
 * Typed error classes with HTTP status codes.
 * All server functions should throw these; the middleware catches them.
 */

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

export interface ValidationErrorItem {
  field: string;
  message: string;
}

export class ValidationError extends AppError {
  public readonly errorsList: ValidationErrorItem[];

  constructor(
    message = "Validation failed",
    public readonly fields?: Record<string, string[]> | ValidationErrorItem[],
  ) {
    super(message, 422, "VALIDATION_ERROR");

    if (Array.isArray(fields)) {
      this.errorsList = fields;
    } else if (fields && typeof fields === "object") {
      this.errorsList = Object.entries(fields).flatMap(([field, msgs]) =>
        msgs.map((msg) => ({ field, message: msg }))
      );
    } else {
      this.errorsList = [];
    }
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests. Please slow down.") {
    super(message, 429, "RATE_LIMITED");
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "CONFLICT");
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, detail?: string) {
    super(
      `${service} service error${detail ? `: ${detail}` : ""}`,
      502,
      "EXTERNAL_SERVICE_ERROR",
    );
  }
}

/** Standard unified API error format */
export interface StandardErrorResponse {
  status: "error";
  code: number;
  message: string;
  errors: ValidationErrorItem[] | null;
  // Backward-compatibility fields:
  success: false;
  error: { message: string; code?: string; fields?: Record<string, string[]> };
}

/** Serialise any error into a safe JSON response body */
export function errorToResponse(error: unknown): StandardErrorResponse {
  if (error instanceof ValidationError) {
    const errorObj: { message: string; code?: string; fields?: Record<string, string[]> } = {
      message: error.message,
      code: "VALIDATION_ERROR",
    };
    if (error.fields && !Array.isArray(error.fields)) {
      errorObj.fields = error.fields;
    }

    return {
      status: "error",
      code: 422,
      message: error.message,
      errors: error.errorsList.length > 0 ? error.errorsList : null,
      success: false,
      error: errorObj,
    };
  }

  if (error instanceof AppError) {
    const errPayload: { message: string; code?: string; fields?: Record<string, string[]> } = {
      message: error.message,
    };
    if (error.code) errPayload.code = error.code;

    return {
      status: "error",
      code: error.statusCode,
      message: error.message,
      errors: null,
      success: false,
      error: errPayload,
    };
  }

  console.error("[PostPilot] Unhandled error:", error);
  const msg = error instanceof Error ? error.message : "An unexpected error occurred";
  return {
    status: "error",
    code: 500,
    message: msg,
    errors: null,
    success: false,
    error: { message: msg, code: "INTERNAL_ERROR" },
  };
}
