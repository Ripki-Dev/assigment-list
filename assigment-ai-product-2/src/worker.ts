import { Worker } from "bullmq";
import { INTERVIEW_QUEUE_NAME, connection } from "./utils/queue-config.js";
import { generateInterviewQuestions } from "./modules/interview/services.js";
import { prisma } from "./utils/prisma.js";
import "dotenv/config";

export const worker = new Worker(
  INTERVIEW_QUEUE_NAME,
  async (job) => {
    const { sessionId, role, level, industry, additionalContext } = job.data;

    console.log(`[Worker] Processing session ${sessionId}: ${role} (${level})`);

    // Update status to processing
    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: { status: "processing" },
    });

    try {
      // Run the full AI pipeline
      const result = await generateInterviewQuestions(role, level, industry, additionalContext);

      // Save results to DB
      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: {
          status: "completed",
          questions: result.questions as any,
          evaluation: result.evaluation as any,
          qualityScore: result.qualityScore,
        },
      });

      console.log(
        `[Worker] Session ${sessionId} completed. Score: ${result.qualityScore}, Eval loops: ${result.evalLoops}`,
      );
    } catch (error) {
      console.error(`[Worker] Session ${sessionId} failed:`, error);

      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: {
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        },
      });

      throw error;
    }
  },
  { connection },
);

console.log(`[Worker] Listening on queue: ${INTERVIEW_QUEUE_NAME}`);
