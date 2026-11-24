import { createHash, randomBytes } from "node:crypto";

// "mrd_" plus 32 random bytes in base64url (43 characters). The prefix is what the dashboard shows
// to tell keys apart; the full key is shown once at creation and only its SHA-256 is stored.
export const API_KEY_PREFIX_LENGTH = 12;

export function hashApiKey(key: string) {
  return createHash("sha256").update(key).digest("hex");
}

export function generateApiKey() {
  const key = `mrd_${randomBytes(32).toString("base64url")}`;
  return { key, prefix: key.slice(0, API_KEY_PREFIX_LENGTH), keyHash: hashApiKey(key) };
}

// The token of an "Authorization: Bearer <key>" header, or null when the header is missing or
// malformed. The token is then looked up by its hash, never compared in plain text.
export function bearerToken(header: string | null) {
  const match = header?.trim().match(/^Bearer\s+(\S+)$/i);
  return match ? match[1] : null;
}
