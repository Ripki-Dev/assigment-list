import z from "zod";
import { createParsedCompletion } from "@anvia/core";
import { getModel } from "./utils";
import "dotenv/config";

// Case 2: Long meeting transcript → decisions, risks, and action items
// Pattern: Parallel Fan-out/Fan-in (07) + Extraction Pipeline (04)

const DecisionsSchema = z.object({
  decisions: z.array(
    z.object({
      decision: z.string().describe("What was decided"),
      context: z.string().describe("Brief context or reason"),
    }),
  ),
});

const RisksSchema = z.object({
  risks: z.array(
    z.object({
      risk: z.string().describe("The risk identified"),
      severity: z.enum(["low", "medium", "high"]),
      mitigation: z.string().describe("Suggested mitigation if mentioned"),
    }),
  ),
});

const ActionItemsSchema = z.object({
  actionItems: z.array(
    z.object({
      task: z.string().describe("What needs to be done"),
      owner: z.string().describe("Person responsible, or 'Unassigned'"),
      deadline: z
        .string()
        .describe("Deadline if mentioned, or 'Not specified'"),
    }),
  ),
});

async function extractMeetingInsights(transcript: string) {
  // Fan-out: 3 parallel extraction tasks
  const [decisionsResult, risksResult, actionItemsResult] = await Promise.all([
    createParsedCompletion(getModel(), {
      instructions: `You are a decision extractor. Find all decisions made during this meeting.
You MUST respond with ONLY valid JSON in this format: {"decisions": [{"decision": "...", "context": "..."}]}
No markdown, no explanation, no extra text.`,
      input: `Meeting transcript:\n${transcript}`,
      schema: DecisionsSchema,
    }),
    createParsedCompletion(getModel(), {
      instructions: `You are a risk analyst. Identify all risks, concerns, or blockers mentioned in this meeting.
You MUST respond with ONLY valid JSON in this format: {"risks": [{"risk": "...", "severity": "low|medium|high", "mitigation": "..."}]}
No markdown, no explanation, no extra text.`,
      input: `Meeting transcript:\n${transcript}`,
      schema: RisksSchema,
    }),
    createParsedCompletion(getModel(), {
      instructions: `You are a project coordinator. Extract all action items, who is responsible, and deadlines.
You MUST respond with ONLY valid JSON in this format: {"actionItems": [{"task": "...", "owner": "...", "deadline": "..."}]}
No markdown, no explanation, no extra text.`,
      input: `Meeting transcript:\n${transcript}`,
      schema: ActionItemsSchema,
    }),
  ]);

  // Fan-in: combine results
  return {
    decisions: decisionsResult.data.decisions,
    risks: risksResult.data.risks,
    actionItems: actionItemsResult.data.actionItems,
  };
}

const sampleTranscript = `
Andi: Oke team, kita perlu decide soal tech stack buat project baru. Saya propose kita pakai Next.js.
Budi: Setuju, tapi concern saya soal learning curve. Tim backend belum familiar sama React.
Andi: Valid point. Kita decide pakai Next.js, tapi alokasi 1 minggu untuk training.
Citra: Noted. Saya juga mau raise risk soal timeline. Client minta launch tanggal 15, tapi scope-nya besar.
Andi: Betul, itu high risk. Citra, bisa draft proposal scope reduction ke client sebelum Jumat?
Citra: Siap, saya handle.
Budi: Satu lagi, kita belum punya design system. Siapa yang lead?
Andi: Budi, kamu lead design system setup. Target minggu depan sudah ada component library dasar.
Budi: Oke, saya mulai dari Senin.
Andi: Great. Decision lain: kita pakai Vercel untuk deployment, bukan AWS. Lebih simple untuk timeline ini.
`;

const insights = await extractMeetingInsights(sampleTranscript);
console.log(JSON.stringify(insights, null, 2));
