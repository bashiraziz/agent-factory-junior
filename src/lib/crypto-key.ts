import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKeyMaterial(): Buffer {
  const secret = process.env.KEY_ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error(
      'KEY_ENCRYPTION_SECRET is not set. Generate one with: openssl rand -base64 32'
    );
  }
  const buf = Buffer.from(secret, "base64");
  if (buf.length !== 32) {
    throw new Error(
      `KEY_ENCRYPTION_SECRET must be 32 bytes when base64-decoded (got ${buf.length}). ` +
      "Generate a new one with: openssl rand -base64 32"
    );
  }
  return buf;
}

/**
 * Encrypts an API key using AES-256-GCM.
 * Returns a colon-separated string: `iv:ciphertext:authTag` (all base64).
 * Never logs the plaintext key.
 */
export function encryptApiKey(plain: string): string {
  const key = getKeyMaterial();
  const iv = randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const ciphertext = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    ciphertext.toString("base64"),
    authTag.toString("base64"),
  ].join(":");
}

/**
 * Decrypts a blob produced by `encryptApiKey`.
 */
export function decryptApiKey(blob: string): string {
  const key = getKeyMaterial();
  const parts = blob.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted key format");
  }
  const [ivB64, ciphertextB64, authTagB64] = parts;
  const iv = Buffer.from(ivB64, "base64");
  const ciphertext = Buffer.from(ciphertextB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}
