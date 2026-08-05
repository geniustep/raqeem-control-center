import "server-only";

import { cookies } from "next/headers";

import {
  getKnowledgeAuthConfig,
  getKnowledgeSessionCookieOptions,
} from "@/lib/knowledge-auth/config";
import { KNOWLEDGE_SESSION_COOKIE_NAME } from "@/lib/knowledge-auth/constants";
import {
  decryptKnowledgeSession,
  encryptKnowledgeSession,
} from "@/lib/knowledge-auth/session";
import type { KnowledgeSessionPayload } from "@/lib/knowledge-auth/types";

export async function readKnowledgeSessionFromCookies(): Promise<KnowledgeSessionPayload | null> {
  const config = getKnowledgeAuthConfig();
  if (!config.isConfigured) return null;
  const jar = await cookies();
  const token = jar.get(KNOWLEDGE_SESSION_COOKIE_NAME)?.value;
  return decryptKnowledgeSession(token, config.encryptionKey);
}

export async function setKnowledgeSessionCookie(
  responseCookies: {
    set: (
      name: string,
      value: string,
      options: Record<string, unknown>,
    ) => void;
  },
  payload: KnowledgeSessionPayload,
): Promise<void> {
  const config = getKnowledgeAuthConfig();
  if (!config.isConfigured) {
    throw new Error("Knowledge auth is not configured");
  }
  const token = await encryptKnowledgeSession(payload, config.encryptionKey);
  const isProduction = process.env.NODE_ENV === "production";
  const maxAge = Math.max(1, payload.expires_at - payload.issued_at);
  responseCookies.set(
    KNOWLEDGE_SESSION_COOKIE_NAME,
    token,
    getKnowledgeSessionCookieOptions(isProduction, maxAge),
  );
}

export function clearKnowledgeSessionCookie(responseCookies: {
  set: (
    name: string,
    value: string,
    options: Record<string, unknown>,
  ) => void;
}): void {
  const isProduction = process.env.NODE_ENV === "production";
  responseCookies.set(KNOWLEDGE_SESSION_COOKIE_NAME, "", {
    ...getKnowledgeSessionCookieOptions(isProduction, 0),
    maxAge: 0,
  });
}
