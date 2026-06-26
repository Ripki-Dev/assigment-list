import z from "zod";
import { createParsedCompletion } from "@anvia/core";
import { getModel, tavilyClient } from "./utils";
import "dotenv/config";

// Case 3: User gives a company name → short company profile with website and industry
// Pattern: Extraction Pipeline (04) + Search query generation (05)

const CompanyProfileSchema = z.object({
  name: z.string().describe("Official/legal company name"),
  industry: z.string().describe("Primary industry or sector"),
  website: z.string().describe("Company website URL"),
  description: z.string().describe("One or two sentence company description"),
  headquarters: z.string().describe("City/country of headquarters"),
});

async function getCompanyProfile(companyName: string) {
  // Step 1: Search for company information
  const searchResult = await tavilyClient.search(companyName, {
    searchDepth: "basic",
  });

  // Step 2: Extract structured profile from search results
  const response = await createParsedCompletion(getModel(), {
    instructions: `Extract a short company profile from the search results. If information is not found, return 'Unknown'.
You MUST respond with ONLY a valid JSON object in this exact format:
{"name": "...", "industry": "...", "website": "...", "description": "...", "headquarters": "..."}
No markdown, no explanation, no extra text.`,
    input: `Company to research: ${companyName}\n\nSearch results: ${JSON.stringify(searchResult.results)}`,
    schema: CompanyProfileSchema,
  });

  return response.data;
}

const companyName = "Gojek";
const profile = await getCompanyProfile(companyName);
console.log(profile);
