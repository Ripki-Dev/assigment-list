// ============================================================
// PATTERN 1: PROMPT CHAINING
// Step 1 analyzes the role, Step 2 uses that analysis as context
// ============================================================

export function getRoleAnalysisPrompt(role: string, level: string, industry: string, additionalContext?: string): string {
  return `
You are a senior technical recruiter and hiring manager expert.

Analyze the following role and produce a structured analysis that will be used to generate interview questions.

Role: ${role}
Level: ${level}
Industry: ${industry}
${additionalContext ? `Additional Context: ${additionalContext}` : ""}

Produce your analysis in the following JSON format:
{
  "coreCompetencies": ["list of 5-8 core technical/functional competencies required"],
  "softSkills": ["list of 3-5 critical soft skills for this level"],
  "challengeAreas": ["list of 3-4 common challenges someone in this role faces"],
  "levelExpectations": "description of what's expected at this seniority level",
  "industryContext": "how the industry affects the role requirements"
}

Return ONLY valid JSON, no markdown, no explanation.
`.trim();
}

// ============================================================
// PATTERN 2: PARALLEL FAN-OUT
// Three prompts run in parallel, each generating a different category
// ============================================================

export function getTechnicalQuestionsPrompt(roleAnalysis: string, level: string): string {
  return `
You are an expert technical interviewer.

Based on this role analysis:
${roleAnalysis}

Generate exactly 5 technical interview questions for a ${level}-level candidate.

Requirements:
- Questions should test depth of knowledge, not just recall
- Include follow-up probes for each question
- Vary difficulty: 1 easy, 2 medium, 2 hard
- Each question should map to a specific competency from the analysis

Return as JSON array:
[
  {
    "question": "the main question",
    "category": "technical",
    "difficulty": "easy|medium|hard",
    "competency": "which competency this tests",
    "followUps": ["follow-up 1", "follow-up 2"],
    "goodAnswerSignals": ["what a good answer includes"]
  }
]

Return ONLY valid JSON array, no markdown.
`.trim();
}

export function getBehavioralQuestionsPrompt(roleAnalysis: string, level: string): string {
  return `
You are an expert behavioral interviewer using the STAR method.

Based on this role analysis:
${roleAnalysis}

Generate exactly 4 behavioral interview questions for a ${level}-level candidate.

Requirements:
- Use STAR-oriented questions (Situation, Task, Action, Result)
- Focus on leadership, collaboration, conflict resolution, and decision-making
- Scale complexity to the seniority level
- Include what red flags to watch for

Return as JSON array:
[
  {
    "question": "the main question",
    "category": "behavioral",
    "difficulty": "medium|hard",
    "competency": "which soft skill this tests",
    "followUps": ["probing follow-up 1", "probing follow-up 2"],
    "goodAnswerSignals": ["what a good answer includes"],
    "redFlags": ["what indicates a poor answer"]
  }
]

Return ONLY valid JSON array, no markdown.
`.trim();
}

export function getSituationalQuestionsPrompt(roleAnalysis: string, level: string, industry: string): string {
  return `
You are an expert interviewer specializing in situational and case-based questions.

Based on this role analysis:
${roleAnalysis}

Generate exactly 3 situational/scenario-based interview questions for a ${level}-level candidate in the ${industry} industry.

Requirements:
- Present realistic workplace scenarios relevant to the industry
- Test problem-solving, prioritization, and judgment
- Include constraints that force trade-off decisions
- Scale complexity to seniority level

Return as JSON array:
[
  {
    "question": "the scenario and question",
    "category": "situational",
    "difficulty": "medium|hard",
    "competency": "what this tests",
    "followUps": ["what if scenario changes like this?"],
    "goodAnswerSignals": ["indicators of strong reasoning"],
    "evaluationCriteria": "how to score the response"
  }
]

Return ONLY valid JSON array, no markdown.
`.trim();
}

// ============================================================
// PATTERN 3: EVALUATOR & OPTIMIZER LOOP
// Evaluates merged questions for quality, returns score + feedback
// ============================================================

export function getEvaluatorPrompt(questions: string, role: string, level: string): string {
  return `
You are a senior hiring manager reviewing a set of interview questions for quality.

Role: ${role}
Level: ${level}

Questions to evaluate:
${questions}

Score the question set on these criteria (1-10 each):
1. Relevance: Do questions match the role and level?
2. Coverage: Are technical, behavioral, and situational aspects covered?
3. Difficulty Distribution: Is there appropriate variety?
4. Actionability: Can an interviewer easily use these?
5. Bias Check: Are questions fair and non-discriminatory?

Also identify:
- Any weak questions that should be replaced
- Any missing topic areas
- Specific improvement suggestions

Return as JSON:
{
  "scores": {
    "relevance": 8,
    "coverage": 7,
    "difficultyDistribution": 8,
    "actionability": 9,
    "biasCheck": 9
  },
  "overallScore": 8.2,
  "weakQuestions": [{"index": 0, "reason": "too generic"}],
  "missingTopics": ["topic that should be covered"],
  "improvements": ["specific suggestion 1"],
  "verdict": "pass|needs_improvement"
}

Return ONLY valid JSON, no markdown.
`.trim();
}

export function getOptimizerPrompt(questions: string, evaluationFeedback: string, role: string, level: string): string {
  return `
You are an expert interview question designer tasked with improving a question set.

Role: ${role}
Level: ${level}

Current questions:
${questions}

Evaluation feedback:
${evaluationFeedback}

Based on the feedback, improve the question set:
- Replace weak questions identified in the evaluation
- Add coverage for missing topics
- Apply the specific improvement suggestions
- Keep questions that scored well unchanged

Return the COMPLETE improved question set as a JSON array (same format as input).
Return ONLY valid JSON array, no markdown.
`.trim();
}
