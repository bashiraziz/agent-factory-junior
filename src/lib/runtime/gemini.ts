import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import type { ProjectDSL } from "./types";
import type { LLMResponse } from "./mock-llm";

const MessageSchema = z.discriminatedUnion("role", [
  z.object({ role: z.literal("worker"), content: z.string() }),
  z.object({
    role: z.literal("quiz"),
    questions: z.array(
      z.object({
        q: z.string(),
        choices: z.array(z.string()),
        answer: z.number().int().min(0),
      })
    ),
  }),
]);

const ResponseSchema = z.object({
  messages: z.array(MessageSchema),
  steps_completed: z.array(z.string()),
  safety_flags: z.array(z.string()),
});

export async function callGemini(
  prompt: string,
  _dsl: ProjectDSL
): Promise<LLMResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");

  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

  const google = createGoogleGenerativeAI({ apiKey });

  const { object } = await generateObject({
    model: google(model),
    schema: ResponseSchema,
    prompt,
  });

  return object;
}
