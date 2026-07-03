import { db } from "@/db";
import { profiles, parentChildLinks, classroomMembers, classrooms, providerKeys } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { decryptApiKey } from "@/lib/crypto-key";

export type KeySource = "byok" | "platform";

export async function resolveGeminiKey(
  studentId: string
): Promise<{ apiKey: string; source: KeySource; ownerProfileId?: string }> {
  // 1. Check any parent linked to this student for an active provider key
  const parentLinks = await db
    .select({ parentId: parentChildLinks.parentId })
    .from(parentChildLinks)
    .where(eq(parentChildLinks.studentId, studentId));

  for (const { parentId } of parentLinks) {
    const [pk] = await db
      .select()
      .from(providerKeys)
      .where(and(eq(providerKeys.ownerProfileId, parentId), eq(providerKeys.status, "active")));
    if (pk) {
      return { apiKey: decryptApiKey(pk.encryptedKey), source: "byok", ownerProfileId: parentId };
    }
  }

  // 2. Check the teacher of any classroom the student belongs to
  const memberships = await db
    .select({ classroomId: classroomMembers.classroomId })
    .from(classroomMembers)
    .where(eq(classroomMembers.studentId, studentId));

  for (const { classroomId } of memberships) {
    const [classroom] = await db
      .select({ teacherId: classrooms.teacherId })
      .from(classrooms)
      .where(eq(classrooms.id, classroomId));
    if (!classroom) continue;

    const [pk] = await db
      .select()
      .from(providerKeys)
      .where(and(eq(providerKeys.ownerProfileId, classroom.teacherId), eq(providerKeys.status, "active")));
    if (pk) {
      return { apiKey: decryptApiKey(pk.encryptedKey), source: "byok", ownerProfileId: classroom.teacherId };
    }
  }

  // 3. Fallback to platform key
  const platformKey = process.env.GEMINI_API_KEY;
  if (!platformKey) {
    throw new Error("GEMINI_API_KEY is not set and no BYOK key is configured.");
  }
  return { apiKey: platformKey, source: "platform" };
}
