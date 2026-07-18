import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { interviewRouter } from "./modules/interview/router.js";
import { chatRouter } from "./modules/chat/router.js";
import { errorHandler } from "./utils/error-handler.js";

const app = new Hono()
  .use(cors())
  .route("/interviews", interviewRouter)
  .route("/chat", chatRouter);

app.onError(errorHandler);

export type AppType = typeof app;

serve(
  {
    fetch: app.fetch,
    port: 8000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
