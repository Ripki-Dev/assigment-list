import { Hono } from "hono";
import { getModel } from "../../utils/openai.js";
import { createCompletionStream } from "@anvia/core/completion";
import { createEventStream } from "@anvia/server";

export const chatRouter = new Hono().post("/", async (c) => {
  const body = await c.req.json();

  const model = getModel();
  const stream = createCompletionStream(model, {
    messages: body.messages,
  });

  return createEventStream(stream, {
    format: "jsonl",
  });
});
