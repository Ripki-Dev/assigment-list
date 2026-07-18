import { OpenAIClient } from "@anvia/openai";

export const openaiClient = new OpenAIClient({
  baseUrl: process.env.API_URL,
  apiKey: process.env.OPENAI_API_KEY,
});

export function getModel(model?: string) {
  return openaiClient.completionModel(model ?? process.env.AI_MODEL ?? "gemini/gemini-2.5-flash");
}
