import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import type { ProjectDSL } from "./types";

type ChatTurn =
  | { role: "worker"; content: string }
  | { role: "user"; content: string };

function buildSystemPrompt(dsl: ProjectDSL): string {
  const knowledgeText = dsl.knowledge.map((k) => k.content).join("\n");
  const rulesText = dsl.rules.map((r) => `- ${r}`).join("\n");

  return `You are an educational AI Worker for children, having a friendly back-and-forth chat.

You MUST follow these rules — no exceptions:
- Be safe, kind, and age-appropriate at all times.
- Do NOT give test answers directly — guide the student to think first.
- Do NOT browse the web, access files, run code, or use external tools.
- Do NOT collect or repeat personal information.
- Stay focused on the project goal below. Do not go off-topic.
- Use encouraging, positive language.
- Keep replies short and clear (2–4 sentences unless explaining).
${rulesText}

Project goal:
${dsl.goal}

Approved knowledge (use only what is listed here):
${knowledgeText}`;
}

function historyToPrompt(history: ChatTurn[], userMessage: string): string {
  const turns = history
    .map((t) => (t.role === "worker" ? `Worker: ${t.content}` : `Student: ${t.content}`))
    .join("\n");
  return `${turns}\nStudent: ${userMessage}\nWorker:`;
}

export async function chatWorker(
  projectId: string,
  studentId: string,
  history: ChatTurn[],
  userMessage: string
): Promise<{ content: string }> {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));

  if (!project) throw new Error("Project not found.");
  if (project.ownerId !== studentId) throw new Error("Unauthorized.");

  const dsl = project.dslJson as ProjectDSL;
  const system = buildSystemPrompt(dsl);

  const provider = process.env.LLM_PROVIDER || "mock";
  if (provider !== "gemini") {
    return {
      content:
        "Thanks for your answer! (This chat needs the real Gemini model — set LLM_PROVIDER=gemini in .env.local to enable back-and-forth replies.)",
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");
  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
  const google = createGoogleGenerativeAI({ apiKey });

  const { text } = await generateText({
    model: google(model),
    system,
    prompt: historyToPrompt(history, userMessage),
  });

  return { content: text.trim() || "Hmm, let's try that again — can you rephrase?" };
}
