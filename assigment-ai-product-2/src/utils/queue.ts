import { Queue } from "bullmq";
import { connection, INTERVIEW_QUEUE_NAME } from "./queue-config.js";

export const interviewQueue = new Queue(INTERVIEW_QUEUE_NAME, { connection });
