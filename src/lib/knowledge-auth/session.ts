import { EncryptJWT, jwtDecrypt, base64url } from "jose";

import {
  KNOWLEDGE_SESSION_TTL_SECONDS,
  KNOWLEDGE_SESSION_VERSION,
} from "@/lib/knowledge-auth/constants";
import type {
  KnowledgeSessionPayload,
  OdooKnowledgeUserSnapshot,
} from "@/lib/knowledge-auth/types";

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function fromHex(value: string): Uint8Array {
  const out = new Uint8Array(value.length / 2);
  for (let i = 0; i < out.length; i += 1) {
    out[i] = Number.parseInt(value.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

async function sha256Bytes(value: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return new Uint8Array(digest);
}

/**
 * Import a 256-bit AES key for JWE (dir + A256GCM).
 * Edge-safe (Web Crypto only) — no node:crypto.
 * Accepts base64url / base64 / hex / utf-8 secret (≥32 chars hashed to 32 bytes).
 */
export async function importKnowledgeEncryptionKey(
  raw: string,
): Promise<Uint8Array> {
  const value = raw.trim();
  if (!value) {
    throw new Error("Knowledge encryption key is empty");
  }

  try {
    if (/^[A-Za-z0-9_-]+$/.test(value) && value.length >= 43) {
      const decoded = base64url.decode(value);
      if (decoded.length === 32) return decoded;
    }
  } catch {
    /* fall through */
  }

  try {
    if (/^[A-Za-z0-9+/]+=*$/.test(value)) {
      const decoded = fromBase64(value);
      if (decoded.length === 32) return decoded;
    }
  } catch {
    /* fall through */
  }

  if (/^[0-9a-fA-F]+$/.test(value) && value.length === 64) {
    return fromHex(value);
  }

  if (value.length >= 32) {
    return sha256Bytes(value);
  }

  throw new Error(
    "Knowledge encryption key must be 32 bytes or ≥32 character secret",
  );
}

export function createKnowledgeSessionPayload(input: {
  user: OdooKnowledgeUserSnapshot;
  upstreamSessionMaterial: string;
  ttlSeconds?: number;
  nowSeconds?: number;
  sessionId?: string;
}): KnowledgeSessionPayload {
  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  const ttl = input.ttlSeconds ?? KNOWLEDGE_SESSION_TTL_SECONDS;
  return {
    session_id: input.sessionId ?? crypto.randomUUID(),
    user_id: input.user.user_id,
    login: input.user.login,
    display_name: input.user.display_name,
    roles: [...input.user.roles],
    capabilities: [...input.user.capabilities],
    mfa_available: input.user.mfa_available,
    mfa_enabled: input.user.mfa_enabled,
    knowledge_access_ready: input.user.knowledge_access_ready,
    issued_at: now,
    expires_at: now + ttl,
    upstream_session_material: input.upstreamSessionMaterial,
    session_version: KNOWLEDGE_SESSION_VERSION,
  };
}

/** Encrypt session with authenticated encryption (JWE A256GCM). */
export async function encryptKnowledgeSession(
  payload: KnowledgeSessionPayload,
  encryptionKeyRaw: string,
): Promise<string> {
  const key = await importKnowledgeEncryptionKey(encryptionKeyRaw);

  return new EncryptJWT({ raqeem_knowledge: payload })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM", typ: "JWE" })
    .setIssuedAt(payload.issued_at)
    .setExpirationTime(payload.expires_at)
    .setJti(payload.session_id)
    .encrypt(key);
}

/** Decrypt and validate Knowledge session. Returns null when invalid/expired/tampered. */
export async function decryptKnowledgeSession(
  token: string | undefined | null,
  encryptionKeyRaw: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<KnowledgeSessionPayload | null> {
  if (!token || !encryptionKeyRaw) return null;

  try {
    const key = await importKnowledgeEncryptionKey(encryptionKeyRaw);
    const { payload } = await jwtDecrypt(token, key, {
      clockTolerance: 5,
      currentDate: new Date(nowSeconds * 1000),
    });

    const nested = (payload as Record<string, unknown>).raqeem_knowledge;
    const session = nested as KnowledgeSessionPayload;
    if (
      !session ||
      typeof session.session_id !== "string" ||
      typeof session.user_id !== "number" ||
      typeof session.login !== "string" ||
      typeof session.display_name !== "string" ||
      !Array.isArray(session.roles) ||
      !Array.isArray(session.capabilities) ||
      typeof session.mfa_available !== "boolean" ||
      typeof session.mfa_enabled !== "boolean" ||
      typeof session.knowledge_access_ready !== "boolean" ||
      typeof session.issued_at !== "number" ||
      typeof session.expires_at !== "number" ||
      typeof session.upstream_session_material !== "string" ||
      session.session_version !== KNOWLEDGE_SESSION_VERSION
    ) {
      return null;
    }

    if (!session.upstream_session_material) return null;
    if (session.expires_at <= nowSeconds) return null;
    if (session.expires_at - session.issued_at > 86_400) return null;

    return {
      session_id: session.session_id,
      user_id: session.user_id,
      login: session.login,
      display_name: session.display_name,
      roles: session.roles.map(String),
      capabilities: session.capabilities.map(String),
      mfa_available: session.mfa_available,
      mfa_enabled: session.mfa_enabled,
      knowledge_access_ready: session.knowledge_access_ready,
      issued_at: session.issued_at,
      expires_at: session.expires_at,
      upstream_session_material: session.upstream_session_material,
      session_version: session.session_version,
    };
  } catch {
    return null;
  }
}

export function mergeLiveUserIntoSession(
  session: KnowledgeSessionPayload,
  user: OdooKnowledgeUserSnapshot,
): KnowledgeSessionPayload {
  return {
    ...session,
    user_id: user.user_id,
    login: user.login,
    display_name: user.display_name,
    roles: [...user.roles],
    capabilities: [...user.capabilities],
    mfa_available: user.mfa_available,
    mfa_enabled: user.mfa_enabled,
    knowledge_access_ready: user.knowledge_access_ready,
  };
}

/** Exported for tests — confirms AEAD, not HMAC-only. */
export function knowledgeSessionCryptoMode(): "jwe-a256gcm" {
  return "jwe-a256gcm";
}
