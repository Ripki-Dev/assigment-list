import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { CreateInterviewSchema, UpdateInterviewSchema } from "./schema.js";
import { interviewQueue } from "../../utils/queue.js";
import { prisma } from "../../utils/prisma.js";
import { notFound, badRequest } from "../../utils/error-handler.js";
import { send } from "../../utils/response.js";

export const interviewRouter = new Hono()
  .get("/", async (c) => {
    const sessions = await prisma.interviewSession.findMany({
      orderBy: { createdAt: "desc" },
    });
    return send(c, sessions);
  })
  .get("/:id", async (c) => {
    const id = parseInt(c.req.param("id"));
    const session = await prisma.interviewSession.findUnique({ where: { id } });
    if (!session) throw notFound("Session not found");
    return send(c, session);
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
      ...body,
    });

    return send(c, { message: "Job queued", sessionId: session.id });
  })
  .put("/:id", zValidator("json", UpdateInterviewSchema), async (c) => {
    const id = parseInt(c.req.param("id"));
    const body = c.req.valid("json");

    const existing = await prisma.interviewSession.findUnique({
      where: { id },
    });
    if (!existing) throw notFound("Session not found");

    const updated = await prisma.interviewSession.update({
      where: { id },
      data: body,
    });

    return send(c, updated);
  })
  .delete("/:id", async (c) => {
    const id = parseInt(c.req.param("id"));

    const existing = await prisma.interviewSession.findUnique({
      where: { id },
    });
    if (!existing) throw notFound("Session not found");

    await prisma.interviewSession.delete({ where: { id } });
    return send(c, { message: "Deleted" });
  })
  .post("/regenerate", async (c) => {
    const id = parseInt(c.req.query("id") || "");
    if (!id) throw badRequest("Query param 'id' is required");

    const existing = await prisma.interviewSession.findUnique({
      where: { id },
    });
    if (!existing) throw notFound("Session not found");

    await prisma.interviewSession.update({
      where: { id },
      data: {
        status: "pending",
        questions: undefined,
        evaluation: undefined,
        qualityScore: null,
      },
    });

    await interviewQueue.add("generate-questions", {
      sessionId: id,
      role: existing.role,
      level: existing.level,
      industry: existing.industry,
      additionalContext: existing.additionalContext,
    });

    return send(c, { message: "Regeneration queued", sessionId: id });
  });
