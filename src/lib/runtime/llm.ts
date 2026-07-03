import type { ProjectDSL } from "./types";
import { callLLM as callMock } from "./mock-llm";
import { callGemini } from "./gemini";

export type { LLMResponse } from "./mock-llm";

export async function callLLM(
  prompt: string,
  dsl: ProjectDSL,
  apiKey?: string
) {
  const provider = process.env.LLM_PROVIDER ?? "mock";

  switch (provider) {
    case "gemini":
      return callGemini(prompt, dsl, apiKey);
    default:
      return callMock(prompt, dsl);
  }
}
