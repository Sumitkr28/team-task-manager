import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { HttpError } from "./auth";

type ErrorBody = { error: { code: string; message: string; details?: unknown } };

export function errorResponse(status: number, code: string, message: string, details?: unknown) {
  const body: ErrorBody = { error: { code, message, ...(details !== undefined ? { details } : {}) } };
  return NextResponse.json(body, { status });
}

export function handleError(err: unknown) {
  if (err instanceof HttpError) {
    return errorResponse(err.status, statusCode(err.status), err.message, err.details);
  }
  if (err instanceof ZodError) {
    return errorResponse(400, "validation_error", "Invalid request body", err.issues);
  }
  console.error("Unhandled error:", err);
  return errorResponse(500, "internal_error", "Something went wrong");
}

function statusCode(status: number): string {
  switch (status) {
    case 400:
      return "bad_request";
    case 401:
      return "unauthorized";
    case 403:
      return "forbidden";
    case 404:
      return "not_found";
    case 409:
      return "conflict";
    default:
      return "error";
  }
}
