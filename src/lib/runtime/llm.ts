import type { ProjectDSL } from "./types";
import { callLLM as callMock } from "./mock-llm";
import { callGemini } from "./gemini";

export type { LLMResponse } from "./mock-llm";

export async function callLLM(
  prompt: string,
  dsl: ProjectDSL
) {
  const provider = process.env.LLM_PROVIDER ?? "mock";

  switch (provider) {
    case "gemini":
      return callGemini(prompt, dsl);
    default:
      return callMock(prompt, dsl);
  }
}
