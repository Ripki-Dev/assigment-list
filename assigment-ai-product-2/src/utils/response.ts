import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const STATUS_MAP: Record<HttpMethod, ContentfulStatusCode> = {
  GET: 200,
  POST: 201,
  PUT: 200,
  PATCH: 200,
  DELETE: 200,
};

export function send(c: Context, data: unknown) {
  const method = c.req.method.toUpperCase() as HttpMethod;
  const status = STATUS_MAP[method] || 200;
  return c.json(data, status);
}
