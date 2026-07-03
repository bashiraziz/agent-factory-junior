import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { profiles, providerKeys } from "@/db/schema";
import { eq } from "drizzle-orm";
import { encryptApiKey } from "@/lib/crypto-key";
import { nanoid } from "@/lib/utils";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

const KEY_FORMAT = /^AIza[0-9A-Za-z_\-]{20,}$/;

async function resolveOwnerProfile(req: NextRequest) {
  void req; // headers() reads from async context — NextRequest not needed
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, session.user.id));
  return profile ?? null;
}

export async function GET(req: NextRequest) {
  const profile = await resolveOwnerProfile(req);
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (profile.role === "student") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [pk] = await db
    .select()
    .from(providerKeys)
    .where(eq(providerKeys.ownerProfileId, profile.id));

  if (!pk) {
    return NextResponse.json({ connected: false });
  }

  return NextResponse.json({
    connected: true,
    keyTail: pk.keyTail,
    status: pk.status,
    lastValidatedAt: pk.lastValidatedAt,
  });
}

export async function POST(req: NextRequest) {
  const profile = await resolveOwnerProfile(req);
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (profile.role === "student") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { apiKey?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";

  // Format check
  if (!KEY_FORMAT.test(apiKey)) {
    return NextResponse.json(
      { error: "That key doesn't look right — Google keys start with AIza" },
      { status: 400 }
    );
  }

  // Live validation — call Gemini with the submitted key
  try {
    const google = createGoogleGenerativeAI({ apiKey });
    const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
    await generateText({
      model: google(model),
      prompt: "Say OK",
    });
  } catch {
    return NextResponse.json(
      { error: "Google didn't accept that key. Double-check you copied the whole thing." },
      { status: 400 }
    );
  }

  // Encrypt and store
  const encryptedKey = encryptApiKey(apiKey);
  const keyTail = apiKey.slice(-4);
  const now = new Date();

  const existing = await db
    .select({ id: providerKeys.id })
    .from(providerKeys)
    .where(eq(providerKeys.ownerProfileId, profile.id));

  if (existing.length > 0) {
    await db
      .update(providerKeys)
      .set({
        encryptedKey,
        keyTail,
        status: "active",
        lastValidatedAt: now,
        updatedAt: now,
      })
      .where(eq(providerKeys.ownerProfileId, profile.id));
  } else {
    await db.insert(providerKeys).values({
      id: nanoid(),
      ownerProfileId: profile.id,
      provider: "gemini",
      encryptedKey,
      keyTail,
      status: "active",
      lastValidatedAt: now,
    });
  }

  return NextResponse.json({ ok: true, keyTail });
}

export async function DELETE(req: NextRequest) {
  const profile = await resolveOwnerProfile(req);
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (profile.role === "student") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db
    .delete(providerKeys)
    .where(eq(providerKeys.ownerProfileId, profile.id));

  return NextResponse.json({ ok: true });
}
