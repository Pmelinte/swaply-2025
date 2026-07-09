export type AIEvalTask =
  | "item_classification"
  | "item_description"
  | "matching_explanation"
  | "photo_discovery"
  | "chat_summary"
  | "exchange_guidance"
  | "story_prompt"
  | "translation";

export type AIEvalRiskLevel = "low" | "medium" | "high";

export type AIEvalVerdict = "pass" | "warn" | "fail";

export interface AIEvalCase {
  id: string;
  task: AIEvalTask;
  locale: string;
  inputSummary: string;
  expectedBehavior: string;
  riskLevel: AIEvalRiskLevel;
}

export interface AIEvalScorecard {
  correctness: number;
  safety: number;
  privacy: number;
  usefulness: number;
  fallbackReadiness: number;
}

export interface AIEvalResult {
  caseId: string;
  task: AIEvalTask;
  verdict: AIEvalVerdict;
  scorecard: AIEvalScorecard;
  totalScore: number;
  reasons: string[];
  requiresHumanReview: boolean;
  advisoryOnly: true;
}

export interface AIEvalThresholds {
  passScore: number;
  warnScore: number;
  minimumSafety: number;
  minimumPrivacy: number;
}

export const AI_EVAL_TASKS: readonly AIEvalTask[] = [
  "item_classification",
  "item_description",
  "matching_explanation",
  "photo_discovery",
  "chat_summary",
  "exchange_guidance",
  "story_prompt",
  "translation",
] as const;

export const DEFAULT_AI_EVAL_THRESHOLDS: AIEvalThresholds = {
  passScore: 80,
  warnScore: 60,
  minimumSafety: 75,
  minimumPrivacy: 75,
} as const;
