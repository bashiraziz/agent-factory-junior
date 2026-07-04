import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject, generateText, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import type { ProjectDSL } from "./types";
import { assertNotPaused, assertApproved } from "./guardrails";
import { moderateOutput } from "./moderate-output";

type ChatTurn =
  | { role: "worker"; content: string }
  | { role: "user"; content: string };

type QuizQuestion = { q: string; choices: string[]; answer: number; explanation?: string };

const QuizSchema = z.object({
  questions: z.array(
    z.object({
      q: z.string(),
      choices: z.array(z.string()).min(2),
      answer: z.number().int().min(0),
      explanation: z.string(),
    })
  ),
});

function baseSystem(dsl: ProjectDSL): string {
  const knowledge = dsl.knowledge.map((k) => k.content).join("\n");
  const rules = dsl.rules.map((r) => `- ${r}`).join("\n");
  return `You are an educational AI Worker for children.
Safety rules:
- Kind, safe, age-appropriate language.
- Do NOT give homework answers directly.
- Stay on the project goal.
${rules}

Project goal:
${dsl.goal}

Approved knowledge:
${knowledge}`;
}

function convoText(history: ChatTurn[]): string {
  return history
    .map((t) => (t.role === "worker" ? `Worker: ${t.content}` : `Student: ${t.content}`))
    .join("\n");
}

export async function advanceWorker(
  projectId: string,
  studentId: string,
  history: ChatTurn[],
  phase: "quiz" | "output"
): Promise<
  | { kind: "quiz"; questions: QuizQuestion[] }
  | { kind: "worker"; content: string }
> {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));
  if (!project) throw new Error("Project not found.");
  if (project.ownerId !== studentId) throw new Error("Unauthorized.");

  await assertNotPaused(studentId);
  await assertApproved(project, studentId);

  const dsl = project.dslJson as ProjectDSL;
  const quizStep = dsl.steps.find((s) => s.type === "quiz") as
    | { type: "quiz"; question_count: number }
    | undefined;
  const questionCount = quizStep?.question_count ?? 3;

  const apiKey = process.env.GEMINI_API_KEY;
  const provider = process.env.LLM_PROVIDER || "mock";

  if (provider !== "gemini" || !apiKey) {
    if (phase === "quiz") {
      return {
        kind: "quiz",
        questions: [
          {
            q: "Sample question — did you follow along?",
            choices: ["Yes", "Kind of", "Not yet"],
            answer: 0,
          },
        ],
      };
    }
    return { kind: "worker", content: "Great job today! Keep exploring 🌟" };
  }

  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
  const google = createGoogleGenerativeAI({ apiKey });
  const system = baseSystem(dsl);
  const convo = convoText(history);

  if (phase === "quiz") {
    const prompt = `Based on the conversation below, create exactly ${questionCount} multiple-choice question(s) to check the student's understanding. Each question must have 3 answer choices. Mark the correct answer with a 0-based index. For each question, include a short, kid-friendly "explanation" (1-2 sentences) that says *why* the correct answer is right — this is shown to the student after they submit so they learn from mistakes.

Conversation so far:
${convo}`;
    try {
      const { object } = await generateObject({
        model: google(model),
        schema: QuizSchema,
        prompt,
        system,
      });
      return { kind: "quiz", questions: object.questions.slice(0, questionCount) };
    } catch (err) {
      if (err instanceof NoObjectGeneratedError || (err as Error)?.name === "NoObjectGeneratedError") {
        return {
          kind: "worker",
          content: "I couldn't build a quiz this time — try wrapping up instead!",
        };
      }
      throw err;
    }
  }

  // phase === "output"
  const prompt = `Wrap up the session with a short, encouraging summary of what the student learned. Keep it to 2-4 sentences. End with a friendly send-off.

Conversation so far:
${convo}`;
  const { text } = await generateText({
    model: google(model),
    system,
    prompt,
  });
  const raw = text.trim() || "Great work today — keep exploring! 🌟";
  const moderation = await moderateOutput(raw);
  return {
    kind: "worker",
    content: moderation.ok ? raw : moderation.replacement,
  };
}
