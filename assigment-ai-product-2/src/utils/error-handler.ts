import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export class AppError extends Error {
  constructor(
    public statusCode: ContentfulStatusCode,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function notFound(message = "Not found") {
  return new AppError(404, message);
}

export function badRequest(message: string) {
  return new AppError(400, message);
}

export function errorHandler(err: Error, c: Context) {
  if (err instanceof AppError) {
    return c.json({ error: err.message }, err.statusCode);
  }

  console.error("[Unhandled Error]", err);
  return c.json({ error: "Internal server error" }, 500);
}
