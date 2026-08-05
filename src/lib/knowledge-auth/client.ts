import "server-only";

import {
  KNOWLEDGE_UPSTREAM_TIMEOUT_MS,
  ODOO_KNOWLEDGE_AUTH,
} from "@/lib/knowledge-auth/constants";
import { mapUpstreamAuthError } from "@/lib/knowledge-auth/errors";
import type {
  KnowledgeAuthErrorCode,
  OdooKnowledgeUserSnapshot,
} from "@/lib/knowledge-auth/types";

export class KnowledgeUpstreamError extends Error {
  readonly code: KnowledgeAuthErrorCode;
  readonly status?: number;
  readonly retryAfterSeconds?: number;

  constructor(
    code: KnowledgeAuthErrorCode,
    message?: string,
    options?: { status?: number; retryAfterSeconds?: number },
  ) {
    super(message ?? code);
    this.name = "KnowledgeUpstreamError";
    this.code = code;
    this.status = options?.status;
    this.retryAfterSeconds = options?.retryAfterSeconds;
  }
}

export interface KnowledgeLoginUpstreamResult {
  user: OdooKnowledgeUserSnapshot;
  upstreamSessionMaterial: string;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String).filter((item) => item.length > 0);
}

function readBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  return fallback;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function unwrapData(body: unknown): Record<string, unknown> | null {
  const root = asRecord(body);
  if (!root) return null;
  const nested = asRecord(root.data);
  return nested ?? root;
}

/**
 * Derive knowledge_access_ready when upstream omits it.
 * Ready requires MFA enabled + at least one role/capability.
 */
export function deriveKnowledgeAccessReady(input: {
  mfa_enabled: boolean;
  roles: string[];
  capabilities: string[];
  knowledge_access_ready?: boolean;
}): boolean {
  if (typeof input.knowledge_access_ready === "boolean") {
    return input.knowledge_access_ready;
  }
  const hasRole = input.roles.length > 0 || input.capabilities.length > 0;
  return Boolean(input.mfa_enabled && hasRole);
}

export function parseOdooKnowledgeUser(
  raw: unknown,
): OdooKnowledgeUserSnapshot {
  const record = asRecord(raw) ?? {};
  const userNode = asRecord(record.user) ?? asRecord(record.partner) ?? record;
  const mfaNode = asRecord(userNode.mfa) ?? asRecord(record.mfa);
  const onboardingNode =
    asRecord(userNode.onboarding) ?? asRecord(record.onboarding);

  const userId =
    readNumber(userNode.user_id) ??
    readNumber(userNode.id) ??
    readNumber(userNode.uid);
  const login = String(userNode.login ?? userNode.email ?? "").trim();
  const displayName = String(
    userNode.display_name ?? userNode.name ?? login,
  ).trim();

  if (userId === null || !login) {
    throw new KnowledgeUpstreamError(
      "server_error",
      "Upstream user payload incomplete",
    );
  }

  const roles = asStringArray(
    userNode.roles ?? userNode.knowledge_roles ?? record.roles,
  );
  const capabilities = asStringArray(
    userNode.capabilities ??
      userNode.knowledge_capabilities ??
      record.capabilities,
  );
  const mfaAvailable = readBoolean(
    userNode.mfa_available ??
      mfaNode?.available ??
      record.mfa_available,
    true,
  );
  const mfaEnabled = readBoolean(
    userNode.mfa_enabled ??
      mfaNode?.enabled ??
      record.mfa_enabled,
    false,
  );
  const active = readBoolean(userNode.active ?? record.active, true);
  const isInternalUser = readBoolean(
    userNode.is_internal_user ??
      userNode.internal_user ??
      record.is_internal_user,
    true,
  );

  const readyRaw =
    userNode.knowledge_access_ready ??
    onboardingNode?.knowledge_access_ready ??
    record.knowledge_access_ready;
  const knowledgeAccessReady = deriveKnowledgeAccessReady({
    mfa_enabled: mfaEnabled,
    roles,
    capabilities,
    knowledge_access_ready:
      typeof readyRaw === "boolean" ? readyRaw : undefined,
  });

  return {
    user_id: userId,
    login,
    display_name: displayName || login,
    roles,
    capabilities,
    mfa_available: mfaAvailable,
    mfa_enabled: mfaEnabled,
    knowledge_access_ready: knowledgeAccessReady,
    active,
    is_internal_user: isInternalUser,
  };
}

function extractUpstreamSessionMaterial(
  response: Response,
  body: unknown,
): string | null {
  const data = unwrapData(body);
  const candidates = [
    data?.upstream_session_material,
    data?.session_id,
    asRecord(data?.session)?.session_id,
    asRecord(data?.session)?.id,
    data?.odoo_session,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  const setCookie = response.headers.getSetCookie?.() ?? [];
  if (setCookie.length > 0) {
    return setCookie.join("; ");
  }

  const single = response.headers.get("set-cookie");
  if (single?.trim()) return single.trim();

  return null;
}

function parseRetryAfter(response: Response): number | undefined {
  const raw = response.headers.get("retry-after");
  if (!raw) return undefined;
  const seconds = Number.parseInt(raw, 10);
  return Number.isFinite(seconds) ? seconds : undefined;
}

function throwMappedUpstream(status: number, body: unknown): never {
  const root = asRecord(body);
  const errNode = asRecord(root?.error);
  const code = mapUpstreamAuthError({
    status,
    code:
      (typeof errNode?.code === "string" && errNode.code) ||
      (typeof root?.error_code === "string" && root.error_code) ||
      (typeof root?.code === "string" && root.code) ||
      null,
  });
  throw new KnowledgeUpstreamError(code, undefined, {
    status,
    retryAfterSeconds: undefined,
  });
}

function validateUserAccess(user: OdooKnowledgeUserSnapshot): void {
  if (!user.active) {
    throw new KnowledgeUpstreamError("user_inactive");
  }
  if (!user.is_internal_user) {
    throw new KnowledgeUpstreamError("internal_user_required");
  }
  if (user.roles.length === 0 && user.capabilities.length === 0) {
    throw new KnowledgeUpstreamError("knowledge_role_required");
  }
}

export interface KnowledgeOdooAuthClientOptions {
  baseUrl: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export class KnowledgeOdooAuthClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: KnowledgeOdooAuthClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.timeoutMs = options.timeoutMs ?? KNOWLEDGE_UPSTREAM_TIMEOUT_MS;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private buildUrl(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  private async requestJson(input: {
    path: string;
    method: "GET" | "POST";
    requestId: string;
    body?: unknown;
    upstreamSessionMaterial?: string;
  }): Promise<{ response: Response; body: unknown }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    const headers: Record<string, string> = {
      Accept: "application/json",
      "X-Request-ID": input.requestId,
    };

    if (input.body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    if (input.upstreamSessionMaterial) {
      if (
        input.upstreamSessionMaterial.includes("=") ||
        input.upstreamSessionMaterial.toLowerCase().includes("session")
      ) {
        headers.Cookie = normalizeCookieHeader(input.upstreamSessionMaterial);
      } else {
        headers["X-Openerp-Session-Id"] = input.upstreamSessionMaterial;
        headers.Cookie = `session_id=${input.upstreamSessionMaterial}`;
      }
    }

    try {
      const response = await this.fetchImpl(this.buildUrl(input.path), {
        method: input.method,
        headers,
        body: input.body !== undefined ? JSON.stringify(input.body) : undefined,
        cache: "no-store",
        redirect: "manual",
        signal: controller.signal,
      });

      let body: unknown = null;
      const text = await response.text();
      if (text) {
        try {
          body = JSON.parse(text) as unknown;
        } catch {
          body = null;
        }
      }

      return { response, body };
    } catch {
      throw new KnowledgeUpstreamError("upstream_unavailable");
    } finally {
      clearTimeout(timer);
    }
  }

  async login(input: {
    login: string;
    password: string;
    totp?: string;
    requestId: string;
  }): Promise<KnowledgeLoginUpstreamResult> {
    const payload: Record<string, string> = {
      login: input.login,
      password: input.password,
    };
    if (input.totp) payload.totp = input.totp;

    const { response, body } = await this.requestJson({
      path: ODOO_KNOWLEDGE_AUTH.login,
      method: "POST",
      requestId: input.requestId,
      body: payload,
    });

    if (response.status === 429) {
      throw new KnowledgeUpstreamError("rate_limited", undefined, {
        status: 429,
        retryAfterSeconds: parseRetryAfter(response),
      });
    }

    if (!response.ok) {
      throwMappedUpstream(response.status, body);
    }

    const data = unwrapData(body);
    const user = parseOdooKnowledgeUser(data);
    validateUserAccess(user);

    const upstreamSessionMaterial = extractUpstreamSessionMaterial(response, body);
    if (!upstreamSessionMaterial) {
      throw new KnowledgeUpstreamError(
        "server_error",
        "Upstream session material missing",
      );
    }

    return { user, upstreamSessionMaterial };
  }

  async me(input: {
    upstreamSessionMaterial: string;
    requestId: string;
  }): Promise<OdooKnowledgeUserSnapshot> {
    const { response, body } = await this.requestJson({
      path: ODOO_KNOWLEDGE_AUTH.me,
      method: "GET",
      requestId: input.requestId,
      upstreamSessionMaterial: input.upstreamSessionMaterial,
    });

    if (response.status === 429) {
      throw new KnowledgeUpstreamError("rate_limited", undefined, {
        status: 429,
        retryAfterSeconds: parseRetryAfter(response),
      });
    }

    if (!response.ok) {
      throwMappedUpstream(response.status, body);
    }

    const data = unwrapData(body);
    const user = parseOdooKnowledgeUser(data);
    validateUserAccess(user);
    return user;
  }

  async logout(input: {
    upstreamSessionMaterial: string;
    requestId: string;
  }): Promise<void> {
    try {
      await this.requestJson({
        path: ODOO_KNOWLEDGE_AUTH.logout,
        method: "POST",
        requestId: input.requestId,
        body: {},
        upstreamSessionMaterial: input.upstreamSessionMaterial,
      });
    } catch {
      // Logout is best-effort and idempotent locally.
    }
  }
}

export function normalizeCookieHeader(material: string): string {
  const parts = material
    .split(/,(?=[^;]+?=)/)
    .flatMap((chunk) => chunk.split(";"))
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => {
      const lower = part.toLowerCase();
      return !(
        lower.startsWith("path=") ||
        lower.startsWith("domain=") ||
        lower.startsWith("expires=") ||
        lower.startsWith("max-age=") ||
        lower === "httponly" ||
        lower === "secure" ||
        lower.startsWith("samesite=")
      );
    });

  if (parts.length === 0) {
    if (!material.includes("=")) return `session_id=${material}`;
    return material;
  }

  return parts.join("; ");
}
