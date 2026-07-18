import { Worker } from "bullmq";
import { connection, QUEUE_NAME } from "./config/queue-connection.js";
import { generateInterviewQuestions } from "./modules/interview/services.js";
import { prisma } from "./utils/prisma.js";

export const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const { sessionId, role, level, industry, additionalContext } = job.data;

    console.log(`[Worker] Processing session ${sessionId}: "${role}" (${level}) in ${industry}`);

    // Update status to processing
    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: { status: "processing" },
    });

    try {
      // Run the full AI pipeline
      const result = await generateInterviewQuestions(
        role,
        level,
        industry,
        additionalContext,
        async (status) => {
          await prisma.interviewSession.update({
            where: { id: sessionId },
            data: { status },
          });
        },
      );

      // Save results to DB
      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: {
          status: "completed",
          roleAnalysis: result.roleAnalysis as any,
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

console.log(`[Worker] Listening on queue: ${QUEUE_NAME}`);
