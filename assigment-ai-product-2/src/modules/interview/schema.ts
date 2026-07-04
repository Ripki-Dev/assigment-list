import z from "zod";

export const CreateInterviewSchema = z.object({
  role: z.string().min(1),
  level: z.enum(["junior", "mid", "senior", "lead", "principal"]),
  industry: z.string().min(1),
  additionalContext: z.string().optional(),
});

export const UpdateInterviewSchema = z.object({
  role: z.string().min(1).optional(),
  level: z.enum(["junior", "mid", "senior", "lead", "principal"]).optional(),
  industry: z.string().min(1).optional(),
  additionalContext: z.string().optional(),
});
