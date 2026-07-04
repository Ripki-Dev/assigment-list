import { OpenAIClient } from "@anvia/openai";

interface ClientConfig {
  apiKey: string;
  baseUrl?: string;
}

export function getClient({ apiKey, baseUrl }: ClientConfig) {
  return new OpenAIClient({
    apiKey,
    baseUrl: baseUrl || process.env.API_URL,
  });
}
