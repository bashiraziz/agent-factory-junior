import { db } from "@/db";
import { agentRuns, reasoningReceipts, usageLimits, projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { validateProject } from "./validate-project";
import { buildSafePrompt } from "./build-safe-prompt";
import { callLLM } from "./llm";
import type { ProjectDSL } from "./types";
import { nanoid } from "@/lib/utils";

export async function runWorker(projectId: string, studentId: string) {
  // Load project
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));

  if (!project) throw new Error("Project not found.");
  if (project.ownerId !== studentId) throw new Error("Unauthorized.");

  // Check usage limits
  const [usage] = await db
    .select()
    .from(usageLimits)
    .where(eq(usageLimits.userId, studentId));

  const now = new Date();
  let currentUsage = usage;

  if (!currentUsage) {
    const [created] = await db
      .insert(usageLimits)
      .values({
        id: nanoid(),
        userId: studentId,
        dailyRunLimit: 5,
        runsUsedToday: 0,
        periodStart: now,
      })
      .returning();
    currentUsage = created;
  }

  // Reset counter if period has rolled over (new day)
  const periodStart = new Date(currentUsage.periodStart);
  const dayDiff = Math.floor(
    (now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (dayDiff >= 1) {
    await db
      .update(usageLimits)
      .set({ runsUsedToday: 0, periodStart: now, updatedAt: now })
      .where(eq(usageLimits.userId, studentId));
    currentUsage.runsUsedToday = 0;
  }

  if (currentUsage.runsUsedToday >= currentUsage.dailyRunLimit) {
    throw new Error(
      `Daily run limit reached (${currentUsage.dailyRunLimit} runs). Try again tomorrow!`
    );
  }

  // Validate DSL
  const dsl = project.dslJson as ProjectDSL;
  const validation = validateProject(dsl);
  if (!validation.valid) {
    throw new Error(`Invalid project: ${validation.errors.join(", ")}`);
  }

  // Build prompt and call LLM
  const prompt = buildSafePrompt(dsl);
  const llmResult = await callLLM(prompt, dsl);

  // Build output text
  const outputText = llmResult.messages
    .map((m) => {
      if (m.role === "worker") return m.content;
      if (m.role === "quiz") return `[Quiz: ${m.questions.length} questions]`;
      return "";
    })
    .join("\n\n");

  // Save run
  const runId = nanoid();
  await db.insert(agentRuns).values({
    id: runId,
    projectId,
    studentId,
    output: outputText,
    provider: process.env.LLM_PROVIDER || "mock",
    status: llmResult.safety_flags.length > 0 ? "flagged" : "completed",
    safetyFlags: llmResult.safety_flags,
  });

  // Save receipt
  const receiptId = nanoid();
  await db.insert(reasoningReceipts).values({
    id: receiptId,
    runId,
    projectId,
    studentId,
    goal: dsl.goal,
    knowledgeUsed: dsl.knowledge.map((k) => k.content),
    rulesApplied: dsl.rules,
    stepsFollowed: llmResult.steps_completed,
    toolsUsed: [],
    approvalRequired: dsl.approval_required.map((a) => a.action),
    safetyFlags: llmResult.safety_flags,
    output: outputText,
    provider: process.env.LLM_PROVIDER || "mock",
  });

  // Increment usage
  await db
    .update(usageLimits)
    .set({
      runsUsedToday: currentUsage.runsUsedToday + 1,
      updatedAt: now,
    })
    .where(eq(usageLimits.userId, studentId));

  return {
    runId,
    receiptId,
    output: outputText,
    messages: llmResult.messages,
    safetyFlags: llmResult.safety_flags,
    runsUsedToday: currentUsage.runsUsedToday + 1,
    dailyRunLimit: currentUsage.dailyRunLimit,
  };
}
