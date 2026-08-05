import "server-only";

import { KnowledgeUpstreamError } from "@/lib/knowledge-auth/client";
import { getKnowledgeAuthConfig } from "@/lib/knowledge-auth/config";
import {
  clearKnowledgeSessionCookie,
  readKnowledgeSessionFromCookies,
} from "@/lib/knowledge-auth/cookie-store";
import type { KnowledgeSessionPayload } from "@/lib/knowledge-auth/types";

export class KnowledgeSessionGateError extends Error {
  readonly code:
    | "misconfigured"
    | "authentication_required"
    | "mfa_required";

  constructor(code: KnowledgeSessionGateError["code"]) {
    super(code);
    this.name = "KnowledgeSessionGateError";
    this.code = code;
  }
}

/** Require a ready Knowledge session for read UI/BFF (MFA gate preserved). */
export async function requireReadyKnowledgeSession(): Promise<KnowledgeSessionPayload> {
  const config = getKnowledgeAuthConfig();
  if (!config.isConfigured) {
    throw new KnowledgeSessionGateError("misconfigured");
  }
  const session = await readKnowledgeSessionFromCookies();
  if (!session) {
    throw new KnowledgeSessionGateError("authentication_required");
  }
  if (!session.knowledge_access_ready) {
    throw new KnowledgeSessionGateError("mfa_required");
  }
  return session;
}

export function mapReadErrorToHttp(error: unknown): {
  code:
    | "misconfigured"
    | "authentication_required"
    | "mfa_required"
    | "permission_denied"
    | "rate_limited"
    | "upstream_unavailable"
    | "server_error"
    | "validation_error"
    | "item_not_found";
  status: number;
  clearSession?: boolean;
} {
  if (error instanceof KnowledgeSessionGateError) {
    return {
      code: error.code,
      status:
        error.code === "misconfigured"
          ? 503
          : error.code === "mfa_required"
            ? 403
            : 401,
    };
  }
  if (error instanceof KnowledgeUpstreamError) {
    if (error.message === "item_not_found" || error.status === 404) {
      return { code: "item_not_found", status: 404 };
    }
    const clearSession =
      error.code === "authentication_required" ||
      error.code === "session_expired" ||
      error.code === "user_inactive" ||
      error.code === "knowledge_role_required" ||
      error.code === "internal_user_required";
    return {
      code:
        error.code === "rate_limited"
          ? "rate_limited"
          : error.code === "upstream_unavailable"
            ? "upstream_unavailable"
            : error.code === "permission_denied"
              ? "permission_denied"
              : error.code === "validation_error"
                ? "validation_error"
                : error.code === "authentication_required" ||
                    error.code === "session_expired"
                  ? "authentication_required"
                  : error.code === "mfa_required"
                    ? "mfa_required"
                    : "server_error",
      status:
        error.code === "rate_limited"
          ? 429
          : error.code === "upstream_unavailable"
            ? 503
            : error.code === "mfa_required"
              ? 403
              : error.status && error.status >= 400 && error.status < 600
                ? error.status
                : 502,
      clearSession,
    };
  }
  return { code: "server_error", status: 500 };
}

export { clearKnowledgeSessionCookie };
