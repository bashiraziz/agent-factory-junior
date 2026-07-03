import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject, generateText, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import type { ProjectDSL } from "./types";
import type { LLMResponse } from "./mock-llm";

// Flat, non-discriminated schema — many models struggle with discriminated unions.
const MessageSchema = z.object({
  role: z.enum(["worker", "quiz"]),
  content: z.string().optional(),
  questions: z
    .array(
      z.object({
        q: z.string(),
        choices: z.array(z.string()),
        answer: z.number().int().min(0),
        explanation: z.string().optional(),
      })
    )
    .optional(),
});

const ResponseSchema = z.object({
  messages: z.array(MessageSchema),
  steps_completed: z.array(z.string()),
  safety_flags: z.array(z.string()),
});

function stripPromptJsonBlock(prompt: string): string {
  // Remove the "Return your response in JSON with this exact shape: {...}" tail —
  // it conflicts with generateObject's schema-driven output and confuses Gemini.
  return prompt.replace(/Return your response in JSON[\s\S]*$/i, "").trim();
}

function normalizeMessages(raw: z.infer<typeof ResponseSchema>): LLMResponse {
  const messages: LLMResponse["messages"] = [];
  for (const m of raw.messages) {
    if (m.role === "quiz" && m.questions && m.questions.length > 0) {
      messages.push({ role: "quiz", questions: m.questions });
    } else if (m.role === "worker" && m.content) {
      messages.push({ role: "worker", content: m.content });
    }
  }
  return {
    messages,
    steps_completed: raw.steps_completed,
    safety_flags: raw.safety_flags,
  };
}

export async function callGemini(
  prompt: string,
  _dsl: ProjectDSL,
  apiKey?: string
): Promise<LLMResponse> {
  const resolvedKey = apiKey ?? process.env.GEMINI_API_KEY;
  if (!resolvedKey) throw new Error("GEMINI_API_KEY is not set.");

  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
  const google = createGoogleGenerativeAI({ apiKey: resolvedKey });
  const cleanPrompt = stripPromptJsonBlock(prompt);

  try {
    const { object } = await generateObject({
      model: google(model),
      schema: ResponseSchema,
      prompt: cleanPrompt,
    });
    return normalizeMessages(object);
  } catch (err) {
    // Fallback: if structured output failed, get plain text and wrap it as a single worker message
    // so the student still sees something useful instead of an error card.
    if (err instanceof NoObjectGeneratedError || (err as Error)?.name === "NoObjectGeneratedError") {
      const { text } = await generateText({
        model: google(model),
        prompt: cleanPrompt,
      });
      return {
        messages: [{ role: "worker", content: text.trim() || "I couldn't build a full response this time. Try running again!" }],
        steps_completed: [],
        safety_flags: [],
      };
    }
    throw err;
  }
}
