import { OpenAIClient } from "@anvia/openai";
import { tavily } from "@tavily/core";
import "dotenv/config";

const openClient = new OpenAIClient({
  apiKey: process.env.OPENAI_API_KEY,
  baseUrl: "https://ai.sumopod.com/v1",
});

export function getModel(model: string = "MiniMax-M3") {
  return openClient.completionModel(model);
}

export const tavilyClient = tavily({
  apiKey: process.env.TAVILY_API_KEY!,
});
