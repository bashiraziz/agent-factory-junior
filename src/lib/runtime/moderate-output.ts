import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

export interface ModerationResult {
  ok: boolean;
  replacement: string;
  reasons: string[];
}

const FRIENDLY_BLOCK =
  "Your Worker said something it shouldn't — a grown-up can review it.";

// ─── Layer 1: keyword blocklist (sync, free) ────────────────────────────────
const BLOCK_PATTERNS: { name: string; re: RegExp }[] = [
  { name: "profanity",     re: /\b(fuck|shit|bitch|asshole|dick|cunt|piss|bastard)\b/i },
  { name: "self_harm",     re: /\b(kill\s*yourself|suicide|self[- ]harm|hang\s*yourself)\b/i },
  { name: "violence",      re: /\b(kill\s+(a|the|your|him|her|them)|shoot\s+(a|the|him|her|them)|stab|behead)\b/i },
  { name: "sexual",        re: /\b(porn|nude|naked\s+(child|kid|boy|girl)|sexual)\b/i },
  // SSN: separators required — avoids flagging plain 9-digit numbers (e.g. zip+4)
  { name: "personal_info", re: /\b\d{3}[-.\s]\d{2}[-.\s]\d{4}\b/ },
  // Phone: separators/parens required — avoids flagging plain 10-digit numbers
  { name: "contact",       re: /\b(?:\+?\d{1,3}[-.\s])?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/ },
  { name: "external_link", re: /https?:\/\/\S+/i },
];

function keywordCheck(text: string): string[] {
  return BLOCK_PATTERNS.filter((p) => p.re.test(text)).map((p) => p.name);
}

// ─── Layer 2: model-based classifier (async) ─────────────────────────────────
const MODERATION_PROMPT = `You are a content safety classifier for an educational app used by children aged 8–12.
Respond ONLY with valid JSON — no markdown, no extra text.

Classify this AI-generated text as safe or unsafe for a child to read.

UNSAFE if ANY of:
- Profanity, sexual content, graphic violence or gore
- Self-harm, suicide, or dangerous activity instructions
- Hate speech, racism, discrimination, or bullying
- Personal data (addresses, phone numbers, emails, full names)
- Content that undermines a parent's or teacher's authority or safety rules
- External links, requests to contact anyone, or attempts to continue outside the app
- Manipulation, flattery designed to extract personal info, or unusual emotional pressure

SAFE if:
- Educational content appropriate for ages 8–12
- Age-appropriate discussion of difficult topics (bias, deepfakes, AI mistakes, feelings)
- Kind, encouraging language — even if it includes words like "hurt" or "danger" in a lesson

Respond with exactly one of:
{"safe":true}
{"safe":false,"reason":"one-sentence reason"}

Text to classify:
"""
{TEXT}
"""`;

async function modelCheck(text: string): Promise<string[]> {
  const apiKey =
    process.env.GEMINI_MODERATION_KEY || process.env.GEMINI_API_KEY;

  // If no key is configured (dev/mock env), skip model check.
  if (!apiKey) return [];

  try {
    const google = createGoogleGenerativeAI({ apiKey });
    const model = process.env.GEMINI_MODERATION_MODEL ?? "gemini-2.0-flash";

    const { text: raw } = await generateText({
      model: google(model),
      prompt: MODERATION_PROMPT.replace("{TEXT}", text.slice(0, 4000)),
      maxOutputTokens: 64,
      temperature: 0,
    });

    const json = JSON.parse(raw.trim()) as { safe: boolean; reason?: string };
    if (!json.safe) {
      return [`model_unsafe:${json.reason ?? "unspecified"}`];
    }
    return [];
  } catch (err) {
    // Fail-open: if moderation API errors, log and allow.
    console.error("[moderation] model check failed — allowing output:", err);
    return ["model_check_error"];
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────
export async function moderateOutput(text: string): Promise<ModerationResult> {
  // Layer 1: fast, free, sync keyword check
  const keywordReasons = keywordCheck(text);
  if (keywordReasons.length > 0) {
    return { ok: false, replacement: FRIENDLY_BLOCK, reasons: keywordReasons };
  }

  // Layer 2: model-based check (only runs if Layer 1 passes)
  const modelReasons = await modelCheck(text);

  // model_check_error: flag for logging but don't block the kid
  const blockingReasons = modelReasons.filter((r) => !r.startsWith("model_check_error"));
  if (blockingReasons.length > 0) {
    return { ok: false, replacement: FRIENDLY_BLOCK, reasons: modelReasons };
  }

  return { ok: true, replacement: text, reasons: modelReasons };
}
