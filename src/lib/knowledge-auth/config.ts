import "server-only";

import {
  KNOWLEDGE_SESSION_TTL_SECONDS,
} from "@/lib/knowledge-auth/constants";

export interface KnowledgeAuthConfig {
  odooBaseUrl: string;
  sessionSecret: string;
  encryptionKey: string;
  ttlSeconds: number;
  isConfigured: boolean;
}

function readTtlSeconds(): number {
  const raw = process.env.RAQEEM_KNOWLEDGE_SESSION_TTL_SECONDS?.trim();
  if (!raw) return KNOWLEDGE_SESSION_TTL_SECONDS;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 60 || parsed > 86_400) {
    return KNOWLEDGE_SESSION_TTL_SECONDS;
  }
  return parsed;
}

/** Server-only Knowledge auth env. Never expose via NEXT_PUBLIC_*. */
export function getKnowledgeAuthConfig(): KnowledgeAuthConfig {
  const odooBaseUrl =
    process.env.RAQEEM_CONTROL_ODOO_BASE_URL?.trim() ||
    process.env.RAQEEM_PLATFORM_API_BASE_URL?.trim() ||
    "";
  const sessionSecret =
    process.env.RAQEEM_KNOWLEDGE_SESSION_SECRET?.trim() ?? "";
  const encryptionKey =
    process.env.RAQEEM_KNOWLEDGE_SESSION_ENCRYPTION_KEY?.trim() ?? "";
  const ttlSeconds = readTtlSeconds();

  return {
    odooBaseUrl,
    sessionSecret,
    encryptionKey,
    ttlSeconds,
    isConfigured:
      odooBaseUrl.length > 0 &&
      sessionSecret.length >= 32 &&
      encryptionKey.length >= 32,
  };
}

export function getKnowledgeSessionCookieOptions(
  isProduction: boolean,
  maxAge = KNOWLEDGE_SESSION_TTL_SECONDS,
) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
