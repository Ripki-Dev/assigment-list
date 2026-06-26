import z from "zod";
import { createCompletion, createParsedCompletion } from "@anvia/core";
import { getModel } from "./utils";
import "dotenv/config";

// Case 1: "Why was I charged twice? Please fix it now"
// Pattern: Prompt Router (02) → Context Injection (03) → Agentic Decision (09)

// Step 1: Route — classify the customer's intent
const IntentSchema = z.object({
  intent: z.enum(["complaint", "refund_request", "billing_inquiry", "general"]),
  urgency: z.enum(["low", "medium", "high"]),
  reason: z.string(),
});

// Step 2: Agentic Decision — decide what action to take before answering
const ActionDecisionSchema = z.object({
  action: z.enum([
    "answer_directly",
    "lookup_account",
    "process_refund",
    "handoff_to_human",
  ]),
  reason: z.string(),
  requiresVerification: z
    .boolean()
    .describe("Whether the action needs human/account verification first"),
});

async function handleCustomerMessage(
  customerMessage: string,
  customerContext: {
    name: string;
    accountId: string;
    recentTransactions: string[];
  },
) {
  // Step 1: Route intent
  const intent = await createParsedCompletion(getModel(), {
    instructions: `Classify the customer's intent and urgency level. Consider if they're asking a question, making a complaint, or requesting a refund.
You MUST respond with ONLY valid JSON in this format: {"intent": "complaint|refund_request|billing_inquiry|general", "urgency": "low|medium|high", "reason": "..."}
No markdown, no explanation, no extra text.`,
    input: `Customer message: ${customerMessage}`,
    schema: IntentSchema,
  });

  console.log("Intent:", intent.data);

  // Step 2: Agentic Decision — what should the AI do before answering?
  const decision = await createParsedCompletion(getModel(), {
    instructions: `You are a customer support decision engine. Based on the customer's intent and context, decide the next action.

      Rules:
      - answer_directly: only for simple questions that don't involve money or account changes
      - lookup_account: when you need to verify transaction details before responding
      - process_refund: only if the issue is clearly a duplicate charge AND verified in transaction history
      - handoff_to_human: for anything involving financial disputes, angry customers, or actions you can't verify

      The customer has these recent transactions: ${customerContext.recentTransactions.join(", ")}

You MUST respond with ONLY valid JSON in this format: {"action": "answer_directly|lookup_account|process_refund|handoff_to_human", "reason": "...", "requiresVerification": true|false}
No markdown, no explanation, no extra text.`,
    input: `Customer message: ${customerMessage}\nClassified intent: ${intent.data.intent} (urgency: ${intent.data.urgency})`,
    schema: ActionDecisionSchema,
  });

  console.log("Decision:", decision.data);

  // Step 3: Context Injection — generate response with relevant context
  const contextDocuments = [
    {
      id: "policy",
      text: "Refund policy: Duplicate charges are eligible for automatic refund within 7 days. All refunds above $50 require manager approval.",
    },
    {
      id: "account",
      text: `Customer: ${customerContext.name}, Account: ${customerContext.accountId}`,
    },
    {
      id: "transactions",
      text: `Recent transactions: ${customerContext.recentTransactions.join("; ")}`,
    },
  ];

  if (decision.data.action === "handoff_to_human") {
    return {
      action: "handoff",
      response: `I understand your frustration. I'm escalating this to a specialist who can review your account and resolve this quickly. Reference: ${customerContext.accountId}`,
    };
  }

  const reply = await createCompletion(getModel(), {
    instructions: `
      You are a helpful billing support agent. Respond based on the decision made and the context provided.
      Decision: ${decision.data.action}
      Be empathetic, concise, and include a concrete next step.
    `,
    input: `Customer message: ${customerMessage}`,
    documents: contextDocuments,
  });

  return {
    action: decision.data.action,
    response: reply.text,
  };
}

const result = await handleCustomerMessage(
  "Why was I charged twice? Please fix it now.",
  {
    name: "Andi Pratama",
    accountId: "ACC-29381",
    recentTransactions: [
      "2024-12-01 - Rp150.000 - Monthly subscription",
      "2024-12-01 - Rp150.000 - Monthly subscription (duplicate)",
      "2024-11-01 - Rp150.000 - Monthly subscription",
    ],
  },
);

console.log("Final response:", result);
