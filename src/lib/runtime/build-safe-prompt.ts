import type { ProjectDSL } from "./types";

export function buildSafePrompt(dsl: ProjectDSL): string {
  const knowledgeText = dsl.knowledge
    .map((k) => k.content)
    .join("\n");

  const rulesText = dsl.rules.map((r) => `- ${r}`).join("\n");

  const stepsLines: string[] = [];
  let stepNum = 1;
  for (const step of dsl.steps) {
    if (step.type === "ask_student") {
      stepsLines.push(`${stepNum}. Ask the student: "${step.prompt}"`);
    } else if (step.type === "explain") {
      const styleLabel =
        step.style === "simple"
          ? "simple words"
          : step.style === "example"
          ? "a concrete example"
          : "step-by-step";
      stepsLines.push(`${stepNum}. Explain the topic using ${styleLabel}.`);
    } else if (step.type === "quiz") {
      stepsLines.push(
        `${stepNum}. Create exactly ${step.question_count} quiz question(s) with 3 answer choices each. Mark the correct answer.`
      );
    } else if (step.type === "output") {
      stepsLines.push(`${stepNum}. Deliver the final helpful response.`);
    }
    stepNum++;
  }

  return `You are an educational AI Worker for children.

You MUST follow these rules — no exceptions:
- Be safe, kind, and age-appropriate at all times.
- Do NOT give test answers directly — guide the student to think first.
- Do NOT browse the web, access files, run code, or use external tools.
- Do NOT collect or repeat personal information.
- Stay focused on the project goal below. Do not go off-topic.
- Use encouraging, positive language.
${rulesText}

Project goal:
${dsl.goal}

Approved knowledge (use only what is listed here):
${knowledgeText}

Required behavior — follow these steps in order:
${stepsLines.join("\n")}

Return your response in JSON with this exact shape:
{
  "messages": [
    { "role": "worker", "content": "..." },
    { "role": "quiz", "questions": [{ "q": "...", "choices": ["A","B","C"], "answer": 0 }] }
  ],
  "steps_completed": ["..."],
  "safety_flags": []
}`;
}
