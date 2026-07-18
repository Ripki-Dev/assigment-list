import { createCompletion } from "@anvia/core";
import { getModel } from "../../utils/openai.js";
import { parseJSON } from "../../utils/parse-json.js";
import {
  getRoleAnalysisPrompt,
  getTechnicalQuestionsPrompt,
  getBehavioralQuestionsPrompt,
  getSituationalQuestionsPrompt,
  getEvaluatorPrompt,
  getOptimizerPrompt,
} from "./prompts.js";

const MAX_RETRIES = 2;
const MAX_EVAL_LOOPS = 2;
const QUALITY_THRESHOLD = 7.0;

async function callAI(prompt: string): Promise<string> {
  const model = getModel();
  const response = await createCompletion(model, {
    input: prompt,
    maxTokens: 8000,
  });
  return response.text;
}

export async function callAIWithParse<T = unknown>(prompt: string): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await callAI(prompt);
      return parseJSON<T>(result);
    } catch (err) {
      lastError = err as Error;
      console.warn(
        `[AI] JSON parse failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}): ${lastError.message}`,
      );
    }
  }

  throw new Error(
    `Failed to get valid JSON after ${MAX_RETRIES + 1} attempts: ${lastError?.message}`,
  );
}

// ============================================================
// PATTERN 1: PROMPT CHAINING
// Step 1 → Step 2 (output of step 1 feeds into step 2)
// ============================================================
async function analyzeRole(
  role: string,
  level: string,
  industry: string,
  additionalContext?: string,
): Promise<string> {
  const prompt = getRoleAnalysisPrompt(role, level, industry, additionalContext);
  const result = await callAI(prompt);
  parseJSON(result); // validate JSON
  return result;
}

// ============================================================
// PATTERN 2: PARALLEL FAN-OUT & FAN-IN
// Three generation tasks run simultaneously, results merged
// ============================================================
async function generateQuestionsParallel(
  roleAnalysis: string,
  level: string,
  industry: string,
): Promise<unknown[]> {
  const [techQuestions, behavQuestions, sitQuestions] = await Promise.all([
    callAIWithParse(getTechnicalQuestionsPrompt(roleAnalysis, level)),
    callAIWithParse(getBehavioralQuestionsPrompt(roleAnalysis, level)),
    callAIWithParse(getSituationalQuestionsPrompt(roleAnalysis, level, industry)),
  ]);

  return [
    ...(techQuestions as unknown[]),
    ...(behavQuestions as unknown[]),
    ...(sitQuestions as unknown[]),
  ];
}

// ============================================================
// PATTERN 3: EVALUATOR & OPTIMIZER LOOP
// Evaluate → if below threshold → optimize → re-evaluate
// ============================================================
interface EvaluationResult {
  scores: Record<string, number>;
  overallScore: number;
  weakQuestions: Array<{ index: number; reason: string }>;
  missingTopics: string[];
  improvements: string[];
  verdict: "pass" | "needs_improvement";
}

async function evaluateAndOptimize(
  questions: unknown[],
  role: string,
  level: string,
  onStatusUpdate?: (status: string) => Promise<void>,
): Promise<{
  questions: unknown[];
  evaluation: EvaluationResult;
  loops: number;
}> {
  let currentQuestions = questions;
  let evaluation: EvaluationResult | null = null;
  let loops = 0;

  if (onStatusUpdate) {
    await onStatusUpdate("evaluating");
  }

  while (loops < MAX_EVAL_LOOPS) {
    // Evaluate
    const evaluation_raw = await callAIWithParse(
      getEvaluatorPrompt(
        JSON.stringify(currentQuestions, null, 2),
        role,
        level,
      ),
    );
    evaluation = evaluation_raw as EvaluationResult;
    loops++;

    console.log(
      `[Evaluator] Loop ${loops}: score=${evaluation.overallScore}, verdict=${evaluation.verdict}`,
    );

    // Check if quality is sufficient
    if (
      evaluation.overallScore >= QUALITY_THRESHOLD &&
      evaluation.verdict === "pass"
    ) {
      break;
    }

    // Optimize if below threshold
    if (loops < MAX_EVAL_LOOPS) {
      console.log(
        `[Optimizer] Score ${evaluation.overallScore} < ${QUALITY_THRESHOLD}, optimizing...`,
      );
      const optimized = await callAIWithParse(
        getOptimizerPrompt(
          JSON.stringify(currentQuestions, null, 2),
          JSON.stringify(evaluation, null, 2),
          role,
          level,
        ),
      );
      currentQuestions = optimized as unknown[];
    }
  }

  return { questions: currentQuestions, evaluation: evaluation!, loops };
}

// ============================================================
// MAIN PIPELINE: Chains all patterns together
// ============================================================
export interface PipelineResult {
  questions: unknown[];
  evaluation: EvaluationResult;
  qualityScore: number;
  roleAnalysis: unknown;
  evalLoops: number;
}

export async function generateInterviewQuestions(
  role: string,
  level: string,
  industry: string,
  additionalContext?: string,
  onStatusUpdate?: (status: string) => Promise<void>,
): Promise<PipelineResult> {
  // Step 1: Prompt Chaining — analyze the role first
  console.log(
    `[Chain] Step 1: Analyzing role "${role}" (${level}) in ${industry}`,
  );
  const roleAnalysisRaw = await analyzeRole(
    role,
    level,
    industry,
    additionalContext,
  );
  const roleAnalysis = parseJSON(roleAnalysisRaw);

  // Step 2: Parallel Fan-out — generate 3 categories simultaneously
  console.log(
    "[Fan-out] Step 2: Generating technical, behavioral, situational in parallel",
  );
  const allQuestions = await generateQuestionsParallel(
    roleAnalysisRaw,
    level,
    industry,
  );
  console.log(`[Fan-in] Merged ${allQuestions.length} questions`);

  // Step 3: Evaluator & Optimizer loop
  console.log("[Evaluator] Step 3: Evaluating quality...");
  const { questions, evaluation, loops } = await evaluateAndOptimize(
    allQuestions,
    role,
    level,
    onStatusUpdate,
  );

  return {
    questions,
    evaluation,
    qualityScore: evaluation.overallScore,
    roleAnalysis,
    evalLoops: loops,
  };
}
