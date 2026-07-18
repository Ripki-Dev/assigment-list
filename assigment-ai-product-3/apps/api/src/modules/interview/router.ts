import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { CreateInterviewSchema } from "./schema.js";
import { interviewQueue } from "../../config/queue.js";
import { prisma } from "../../utils/prisma.js";
import { AppError } from "../../utils/error-handler.js";

export const interviewRouter = new Hono()
  .get("/", async (c) => {
    const sessions = await prisma.interviewSession.findMany({
      orderBy: { createdAt: "desc" },
    });
    return c.json(sessions);
  })
  .get("/:id", async (c) => {
    const id = parseInt(c.req.param("id"));
    const session = await prisma.interviewSession.findUnique({ where: { id } });
    if (!session) throw new AppError(404, "Session not found");
    return c.json(session);
  })
  .post("/", zValidator("json", CreateInterviewSchema), async (c) => {
    const body = c.req.valid("json");

    const session = await prisma.interviewSession.create({
      data: {
        role: body.role,
        level: body.level,
        industry: body.industry,
        additionalContext: body.additionalContext,
      },
    });

    await interviewQueue.add("generate-questions", {
      sessionId: session.id,
      role: body.role,
      level: body.level,
      industry: body.industry,
      additionalContext: body.additionalContext,
    });

    return c.json({ sessionId: session.id });
  });
