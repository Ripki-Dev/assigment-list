import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { interviewRouter } from "./modules/interview/router.js";
import { errorHandler } from "./utils/error-handler.js";

const app = new Hono();

app.onError(errorHandler);
app.route("/interviews", interviewRouter);

serve(
  {
    fetch: app.fetch,
    port: 8000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
