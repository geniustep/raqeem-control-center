import type {
  KnowledgePublicUser,
  KnowledgeSessionPayload,
  OdooKnowledgeUserSnapshot,
} from "@/lib/knowledge-auth/types";

export function toPublicUser(
  source: KnowledgeSessionPayload | OdooKnowledgeUserSnapshot,
): KnowledgePublicUser {
  return {
    user_id: source.user_id,
    login: source.login,
    display_name: source.display_name,
    roles: [...source.roles],
    capabilities: [...source.capabilities],
    mfa_available: source.mfa_available,
    mfa_enabled: source.mfa_enabled,
    knowledge_access_ready: source.knowledge_access_ready,
  };
}

/** Strip any accidental sensitive keys from an object before JSON responses. */
export function assertNoSensitiveClientFields(
  value: unknown,
): asserts value is Record<string, unknown> | null {
  if (value === null || typeof value !== "object") return;
  const forbidden = [
    "password",
    "totp",
    "totp_secret",
    "upstream_session_material",
    "upstream_session_ref",
    "session_id",
    "cookie",
    "set-cookie",
    "odoo_session",
    "session_token",
  ];
  const stack: unknown[] = [value];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || typeof current !== "object") continue;
    for (const [key, child] of Object.entries(current as Record<string, unknown>)) {
      if (forbidden.includes(key.toLowerCase())) {
        throw new Error(`Sensitive field leaked to client payload: ${key}`);
      }
      if (child && typeof child === "object") stack.push(child);
    }
  }
}
