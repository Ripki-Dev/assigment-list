export function parseJSON<T = unknown>(text: string): T {
  let cleaned = text.trim();

  // Strip markdown code fences
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7); // remove ```json
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3); // remove ```
  }

  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3); // remove trailing ```
  }

  return JSON.parse(cleaned.trim()) as T;
}
