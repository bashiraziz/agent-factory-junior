import type { ProjectDSL } from "./types";

const ALLOWED_STEP_TYPES = ["ask_student", "explain", "quiz", "output"];
const ALLOWED_STYLES = ["simple", "example", "step_by_step"];

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateProject(dsl: unknown): ValidationResult {
  const errors: string[] = [];

  if (!dsl || typeof dsl !== "object") {
    return { valid: false, errors: ["Project DSL is missing or invalid."] };
  }

  const d = dsl as Record<string, unknown>;

  if (!d.goal || typeof d.goal !== "string" || d.goal.trim() === "") {
    errors.push("A Goal block is required.");
  }

  if (!Array.isArray(d.rules) || d.rules.length < 1) {
    errors.push("At least one Safety Rule block is required.");
  }

  if (!Array.isArray(d.steps)) {
    errors.push("Steps must be an array.");
  } else {
    for (const step of d.steps as Array<Record<string, unknown>>) {
      if (!ALLOWED_STEP_TYPES.includes(step.type as string)) {
        errors.push(`Unsupported block type: "${step.type}". Allowed: ${ALLOWED_STEP_TYPES.join(", ")}`);
      }
      if (step.type === "explain" && !ALLOWED_STYLES.includes(step.style as string)) {
        errors.push(`Explain block has invalid style: "${step.style}".`);
      }
      if (step.type === "quiz" && (typeof step.question_count !== "number" || step.question_count < 1)) {
        errors.push("Quiz block requires a valid question_count >= 1.");
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
