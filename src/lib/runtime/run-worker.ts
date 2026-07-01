import { db } from "@/db";
import { agentRuns, replays, projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { validateProject } from "./validate-project";
import { buildSafePrompt } from "./build-safe-prompt";
import { callLLM } from "./llm";
import type { ProjectDSL } from "./types";
import { nanoid } from "@/lib/utils";
import { assertNotPaused, assertApproved, consumeRun } from "./guardrails";
import { moderateOutput } from "./moderate-output";

export async function runWorker(projectId: string, studentId: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));

  if (!project) throw new Error("Project not found.");
  if (project.ownerId !== studentId) throw new Error("Unauthorized.");

  const usage = await assertNotPaused(studentId);
  await assertApproved(project, studentId);

  const dsl = project.dslJson as ProjectDSL;
  const validation = validateProject(dsl);
  if (!validation.valid) {
    throw new Error(`Invalid project: ${validation.errors.join(", ")}`);
  }

  // Reserve one run against the limit *before* the LLM call so parallel
  // requests can't slip past the ceiling.
  const counters = await consumeRun(studentId, usage, 1);

  const prompt = buildSafePrompt(dsl);
  const llmResult = await callLLM(prompt, dsl);

  let outputText = llmResult.messages
    .map((m) => {
      if (m.role === "worker") return m.content;
      if (m.role === "quiz") return `[Quiz: ${m.questions.length} questions]`;
      return "";
    })
    .join("\n\n");

  const moderation = moderateOutput(outputText);
  let safetyFlags = [...llmResult.safety_flags];
  let messages = llmResult.messages;
  let status: "completed" | "flagged" = safetyFlags.length > 0 ? "flagged" : "completed";
  if (!moderation.ok) {
    outputText = moderation.replacement;
    messages = [{ role: "worker", content: moderation.replacement }];
    safetyFlags = [...safetyFlags, ...moderation.reasons];
    status = "flagged";
  }

  const runId = nanoid();
  const replayId = nanoid();
  const provider = process.env.LLM_PROVIDER || "mock";

  await db.transaction(async (tx) => {
    await tx.insert(agentRuns).values({
      id: runId,
      projectId,
      studentId,
      output: outputText,
      provider,
      status,
      safetyFlags,
    });
    await tx.insert(replays).values({
      id: replayId,
      runId,
      projectId,
      studentId,
      goal: dsl.goal,
      knowledgeUsed: dsl.knowledge.map((k) => k.content),
      rulesApplied: dsl.rules,
      stepsFollowed: llmResult.steps_completed,
      toolsUsed: [],
      approvalRequired: dsl.approval_required.map((a) => a.action),
      safetyFlags,
      output: outputText,
      provider,
    });
  });

  return {
    runId,
    replayId,
    output: outputText,
    messages,
    safetyFlags,
    runsUsedToday: counters.runsUsedToday,
    dailyRunLimit: counters.dailyRunLimit,
    provider,
  };
}
