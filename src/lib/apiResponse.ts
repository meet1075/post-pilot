/**
 * PostPilot — Standard API Response Formatter
 *
 * Implements the unified response schema:
 *
 * Success:
 * {
 *   "status": "success",
 *   "code": 200,
 *   "message": "...",
 *   "data": { ... }
 * }
 *
 * General Error:
 * {
 *   "status": "error",
 *   "code": 404,
 *   "message": "User not found",
 *   "errors": null
 * }
 *
 * Validation Error:
 * {
 *   "status": "error",
 *   "code": 422,
 *   "message": "Validation failed",
 *   "errors": [
 *     { "field": "email", "message": "Email is invalid" },
 *     { "field": "password", "message": "Minimum 8 characters required" }
 *   ]
 * }
 */

import type { z } from "zod";

export interface ApiSuccessResponse<T = Record<string, unknown>> {
  status: "success";
  code: number;
  message: string;
  data: T;
  success: true;
}

export interface ApiValidationErrorItem {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  status: "error";
  code: number;
  message: string;
  errors: ApiValidationErrorItem[] | null;
  success: false;
  error?: { message: string; code?: string };
}

export function apiSuccess<T extends Record<string, unknown>>(
  data: T,
  message = "Operation completed successfully",
  code = 200
): ApiSuccessResponse<T> & T {
  return {
    status: "success",
    code,
    message,
    data,
    success: true,
    ...data,
  };
}

export function apiError(
  message = "An error occurred",
  code = 500,
  errors: ApiValidationErrorItem[] | null = null
): ApiErrorResponse {
  return {
    status: "error",
    code,
    message,
    errors,
    success: false,
    error: { message, code: String(code) },
  };
}

export function formatZodIssues(issues: z.ZodIssue[]): ApiValidationErrorItem[] {
  return issues.map((issue) => ({
    field: issue.path.join(".") || "root",
    message: issue.message,
  }));
}
