export type BlockType =
  | "goal"
  | "knowledge"
  | "rule"
  | "ask_student"
  | "explain"
  | "quiz"
  | "output"
  | "approval_required";

export interface DSLBlock {
  type: BlockType;
  value?: string;
  prompt?: string;
  style?: "simple" | "example" | "step_by_step";
  question_count?: number;
  action?: string;
  content?: string;
}

export interface ProjectDSL {
  version: string;
  name: string;
  description?: string;
  goal: string;
  knowledge: Array<{ type: "teacher_note"; content: string }>;
  rules: string[];
  steps: Array<
    | { type: "ask_student"; prompt: string }
    | { type: "explain"; style: "simple" | "example" | "step_by_step" }
    | { type: "quiz"; question_count: number }
    | { type: "output" }
  >;
  approval_required: Array<{ action: string }>;
}

export interface ReasoningReceipt {
  runId: string;
  projectId: string;
  studentId: string;
  goal: string;
  knowledgeUsed: string[];
  rulesApplied: string[];
  stepsFollowed: string[];
  toolsUsed: string[];
  approvalRequired: string[];
  safetyFlags: string[];
  output: string;
  provider: string;
}
