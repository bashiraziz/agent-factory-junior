import type { ProjectDSL } from "./types";

export interface LLMResponse {
  messages: Array<
    | { role: "worker"; content: string }
    | { role: "quiz"; questions: Array<{ q: string; choices: string[]; answer: number }> }
  >;
  steps_completed: string[];
  safety_flags: string[];
}

export async function callLLM(
  _prompt: string,
  dsl: ProjectDSL
): Promise<LLMResponse> {
  const provider = process.env.LLM_PROVIDER || "mock";

  if (provider === "mock") {
    return generateMockResponse(dsl);
  }

  // Stub: real providers can be wired via env vars in future versions
  return generateMockResponse(dsl);
}

function generateMockResponse(dsl: ProjectDSL): LLMResponse {
  const messages: LLMResponse["messages"] = [];
  const steps_completed: string[] = [];

  for (const step of dsl.steps) {
    if (step.type === "ask_student") {
      messages.push({
        role: "worker",
        content: `Hi! Before we start — **${step.prompt}** Give it a try first, even a guess is great. 🌱`,
      });
      steps_completed.push("Asked the student what they know");
    } else if (step.type === "explain") {
      const style =
        step.style === "simple"
          ? "simple words"
          : step.style === "example"
          ? "a concrete example"
          : "step-by-step";
      messages.push({
        role: "worker",
        content: `Exactly right — nice start! Plants catch **sunlight** with their green leaves. They mix it with **water** from the roots and **carbon dioxide** from the air to make their own food (sugar) — and they give us oxygen too. That whole recipe is called **photosynthesis**.`,
      });
      steps_completed.push(`Explained in ${style}`);
    } else if (step.type === "quiz") {
      const count = step.question_count || 3;
      const allQuestions = [
        {
          q: "What gas do plants take from the air?",
          choices: ["Oxygen", "Carbon dioxide", "Helium"],
          answer: 1,
        },
        {
          q: "What part of the plant captures sunlight?",
          choices: ["Roots", "Stem", "Leaves"],
          answer: 2,
        },
        {
          q: "What do plants produce during photosynthesis besides food?",
          choices: ["Carbon dioxide", "Nitrogen", "Oxygen"],
          answer: 2,
        },
        {
          q: "What do plants use water for in photosynthesis?",
          choices: ["To make soil", "As an ingredient to make food", "To absorb sunlight"],
          answer: 1,
        },
      ];
      messages.push({
        role: "quiz",
        questions: allQuestions.slice(0, count),
      });
      steps_completed.push(`Created ${count} quiz question${count !== 1 ? "s" : ""}`);
    } else if (step.type === "output") {
      messages.push({
        role: "worker",
        content: `Great job today! You learned about photosynthesis — how plants use sunlight, water, and carbon dioxide to make food. Keep exploring! 🌿`,
      });
      steps_completed.push("Delivered final output");
    }
  }

  if (messages.length === 0) {
    messages.push({
      role: "worker",
      content: `Hello! I'm your AI Worker for: **${dsl.goal}**. Let's get started!`,
    });
    steps_completed.push("Delivered greeting");
  }

  return { messages, steps_completed, safety_flags: [] };
}
