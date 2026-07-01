import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
// 64 chars → 6 bits per char → mask 0x3F is unbiased.

export function nanoid(size = 21): string {
  if (typeof crypto === "undefined" || !crypto.getRandomValues) {
    throw new Error("Secure randomness unavailable");
  }
  let result = "";
  while (result.length < size) {
    const bytes = new Uint8Array(size - result.length);
    crypto.getRandomValues(bytes);
    for (let i = 0; i < bytes.length && result.length < size; i++) {
      result += ALPHABET[bytes[i] & 0x3f];
    }
  }
  return result;
}

const WORDS = [
  "SUN", "MOON", "STAR", "RAIN", "TREE", "LEAF", "BIRD", "FISH", "FROG", "BEAR",
  "WOLF", "DEER", "OWL", "FOX", "DUCK", "CROW", "HAWK", "SEAL", "CRAB", "BEE",
  "OAK", "PINE", "ROSE", "FERN", "MOSS", "VINE", "REED", "LILY", "MINT", "SAGE",
];

function secureInt(maxExclusive: number): number {
  if (typeof crypto === "undefined" || !crypto.getRandomValues) {
    throw new Error("Secure randomness unavailable");
  }
  const range = 256 - (256 % maxExclusive);
  const buf = new Uint8Array(1);
  for (;;) {
    crypto.getRandomValues(buf);
    if (buf[0] < range) return buf[0] % maxExclusive;
  }
}

/**
 * Friendly join code like "MOON-STAR-42".
 * ~30 × 29 × 90 ≈ 78k combinations — combined with retryOnUnique at insert
 * sites this scales past thousands of active codes.
 */
export function generateCode(_length?: number): string {
  const w1 = WORDS[secureInt(WORDS.length)];
  let w2 = WORDS[secureInt(WORDS.length)];
  while (w2 === w1) w2 = WORDS[secureInt(WORDS.length)];
  const num = 10 + secureInt(90);
  return `${w1}-${w2}-${num}`;
}

export async function retryOnUnique<T>(
  build: () => Promise<T>,
  attempts = 3
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await build();
    } catch (err) {
      lastErr = err;
      if (!isUniqueViolation(err)) throw err;
    }
  }
  throw lastErr;
}

function isUniqueViolation(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = (err as { code?: string }).code;
  const cause = (err as { cause?: { code?: string } }).cause;
  return code === "23505" || cause?.code === "23505";
}
