// Post-generation moderation. Starts as a simple keyword/pattern blocklist —
// structured so a model-based moderation call can slot in later.
//
// If any pattern matches, the output is replaced with a kid-friendly message
// and the run/turn is marked flagged.

export interface ModerationResult {
  ok: boolean;
  replacement: string;
  reasons: string[];
}

const FRIENDLY_BLOCK =
  "Your Worker said something it shouldn't — a grown-up can review it.";

// Word-boundaries so we don't false-positive on innocuous substrings.
const BLOCK_PATTERNS: { name: string; re: RegExp }[] = [
  { name: "profanity", re: /\b(fuck|shit|bitch|asshole|dick|cunt|piss|bastard)\b/i },
  { name: "self_harm", re: /\b(kill\s*yourself|suicide|self[- ]harm|hang\s*yourself)\b/i },
  { name: "violence", re: /\b(kill\s+(a|the|your|him|her|them)|shoot\s+(a|the|him|her|them)|stab|behead)\b/i },
  { name: "sexual", re: /\b(porn|nude|naked\s+(child|kid|boy|girl)|sexual)\b/i },
  // SSN: separators required — avoids flagging plain 9-digit numbers (e.g. zip+4)
  { name: "personal_info", re: /\b\d{3}[-.\s]\d{2}[-.\s]\d{4}\b/ },
  // Phone: separators/parens required — avoids flagging plain 10-digit numbers (e.g. "3141592653" in math output)
  // "5551234567" → OK  |  "555-123-4567" → flagged  |  "(555) 123-4567" → flagged
  { name: "contact", re: /\b(?:\+?\d{1,3}[-.\s])?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/ },
  { name: "external_link", re: /https?:\/\/\S+/i },
];

export function moderateOutput(text: string): ModerationResult {
  const reasons: string[] = [];
  for (const p of BLOCK_PATTERNS) {
    if (p.re.test(text)) reasons.push(p.name);
  }
  if (reasons.length === 0) {
    return { ok: true, replacement: text, reasons: [] };
  }
  return { ok: false, replacement: FRIENDLY_BLOCK, reasons };
}
