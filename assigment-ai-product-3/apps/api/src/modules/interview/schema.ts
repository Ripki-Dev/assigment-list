import { z } from "zod";

export const CreateInterviewSchema = z.object({
  role: z.string().min(1),
  level: z.enum(["junior", "mid", "senior", "lead", "principal"]),
  industry: z.string().min(1),
  additionalContext: z.string().optional(),
});

export type CreateInterviewInput = z.infer<typeof CreateInterviewSchema>;
