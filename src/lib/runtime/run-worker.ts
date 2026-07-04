import { db } from "@/db";
import { agentRuns, replays, projects, providerKeys, classroomMembers } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { validateProject } from "./validate-project";
import { buildSafePrompt } from "./build-safe-prompt";
import { callLLM } from "./llm";
import type { ProjectDSL } from "./types";
import { nanoid } from "@/lib/utils";
import { assertNotPaused, assertApproved, consumeRun } from "./guardrails";
import { moderateOutput } from "./moderate-output";
import { resolveGeminiKey } from "./resolve-key";

function isAuthOrQuotaError(err: unknown): boolean {
  const msg = String(err instanceof Error ? err.message : err);
  return /401|403|API_KEY_INVALID|quota|RESOURCE_EXHAUSTED/i.test(msg);
}

export async function runWorker(projectId: string, studentId: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));

  if (!project) throw new Error("Project not found.");

  const isOwner = project.ownerId === studentId;
  if (!isOwner) {
    if (project.shareStatus !== "approved") throw new Error("Unauthorized.");
    // Verify viewer and owner share a classroom
    const ownerClassrooms = (await db.select({ classroomId: classroomMembers.classroomId })
      .from(classroomMembers).where(eq(classroomMembers.studentId, project.ownerId)))
      .map((r) => r.classroomId);
    if (!ownerClassrooms.length) throw new Error("Unauthorized.");
    const [shared] = await db.select().from(classroomMembers)
      .where(and(eq(classroomMembers.studentId, studentId), inArray(classroomMembers.classroomId, ownerClassrooms)));
    if (!shared) throw new Error("Unauthorized.");
  }

  const usage = await assertNotPaused(studentId);
  if (isOwner) await assertApproved(project, studentId);

  const dsl = project.dslJson as ProjectDSL;
  const validation = validateProject(dsl);
  if (!validation.valid) {
    throw new Error(`Invalid project: ${validation.errors.join(", ")}`);
  }

  // Resolve the API key before consuming the run slot.
  const { apiKey, source, ownerProfileId } = await resolveGeminiKey(studentId);
  const byokActive = source === "byok";

  // Reserve one run against the limit *before* the LLM call.
  const counters = await consumeRun(studentId, usage, { byokActive });

  const prompt = buildSafePrompt(dsl);

  let llmResult;
  let providerLabel =
    process.env.LLM_PROVIDER === "gemini"
      ? byokActive ? "gemini-byok" : "gemini"
      : process.env.LLM_PROVIDER ?? "mock";

  try {
    llmResult = await callLLM(prompt, dsl, apiKey);
  } catch (err) {
    if (byokActive && ownerProfileId && isAuthOrQuotaError(err)) {
      // Mark the BYOK key as invalid so the owner sees a reconnect banner.
      await db
        .update(providerKeys)
        .set({ status: "invalid", updatedAt: new Date() })
        .where(eq(providerKeys.ownerProfileId, ownerProfileId));

      // Retry transparently with the platform key — child sees nothing scary.
      const platformKey = process.env.GEMINI_API_KEY;
      if (platformKey) {
        llmResult = await callLLM(prompt, dsl, platformKey);
        providerLabel = "gemini"; // fell back to platform
      } else {
        throw err;
      }
    } else {
      throw err;
    }
  }

  let outputText = llmResult.messages
    .map((m) => {
      if (m.role === "worker") return m.content;
      if (m.role === "quiz") return `[Quiz: ${m.questions.length} questions]`;
      return "";
    })
    .join("\n\n");

  const moderation = await moderateOutput(outputText);
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

  await db.transaction(async (tx) => {
    await tx.insert(agentRuns).values({
      id: runId,
      projectId,
      studentId,
      output: outputText,
      provider: providerLabel,
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
      provider: providerLabel,
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
    provider: providerLabel,
  };
}
