import "server-only";

import {
  KnowledgeUpstreamError,
  normalizeCookieHeader,
} from "@/lib/knowledge-auth/client";
import { getKnowledgeAuthConfig } from "@/lib/knowledge-auth/config";
import { KNOWLEDGE_UPSTREAM_TIMEOUT_MS } from "@/lib/knowledge-auth/constants";
import { ODOO_KNOWLEDGE_INTAKE } from "@/lib/knowledge-intake/constants";
import {
  mapIntakeDetail,
  mapIntakeOptions,
  mapIntakePaginationMeta,
  mapIntakeSummary,
  unwrapIntakeData,
  unwrapIntakeMeta,
} from "@/lib/knowledge-intake/mappers";
import { intakeQueryToSearchParams } from "@/lib/knowledge-intake/query";
import type {
  CreateKnowledgeIntakePayload,
  KnowledgeIntakeActionInput,
  KnowledgeIntakeDetail,
  KnowledgeIntakeOption,
  KnowledgeIntakeQuery,
  KnowledgeIntakesPage,
} from "@/lib/knowledge-intake/types";

export type KnowledgeIntakeErrorCode =
  | "authentication_required"
  | "session_expired"
  | "permission_denied"
  | "intake_not_found"
  | "validation_failed"
  | "invalid_transition"
  | "duplicate_detected"
  | "possible_update_requires_review"
  | "prohibited_content"
  | "mutation_gate_closed"
  | "idempotency_conflict"
  | "stale_write"
  | "version_conflict"
  | "rate_limited"
  | "upstream_unavailable"
  | "server_error";

export class KnowledgeIntakeUpstreamError extends Error {
  readonly code: KnowledgeIntakeErrorCode;
  readonly status: number;
  readonly retryAfterSeconds?: number;

  constructor(
    code: KnowledgeIntakeErrorCode,
    status = 500,
    options?: { retryAfterSeconds?: number },
  ) {
    super(code);
    this.name = "KnowledgeIntakeUpstreamError";
    this.code = code;
    this.status = status;
    this.retryAfterSeconds = options?.retryAfterSeconds;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function retryAfter(response: Response): number | undefined {
  const raw = response.headers.get("retry-after");
  if (!raw) return undefined;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function mapError(response: Response, body: unknown): KnowledgeIntakeUpstreamError {
  const root = asRecord(body);
  const error = asRecord(root?.error);
  const raw = String(error?.code ?? root?.code ?? "").trim() as KnowledgeIntakeErrorCode;
  const known = new Set<KnowledgeIntakeErrorCode>([
    "authentication_required",
    "session_expired",
    "permission_denied",
    "intake_not_found",
    "validation_failed",
    "invalid_transition",
    "duplicate_detected",
    "possible_update_requires_review",
    "prohibited_content",
    "mutation_gate_closed",
    "idempotency_conflict",
    "stale_write",
    "version_conflict",
    "rate_limited",
    "upstream_unavailable",
    "server_error",
  ]);
  const code = known.has(raw)
    ? raw
    : response.status === 401
      ? "authentication_required"
      : response.status === 403
        ? "permission_denied"
        : response.status === 404
          ? "intake_not_found"
          : response.status === 429
            ? "rate_limited"
            : response.status >= 500
              ? "upstream_unavailable"
              : "validation_failed";
  return new KnowledgeIntakeUpstreamError(code, response.status, {
    retryAfterSeconds: retryAfter(response),
  });
}

export class KnowledgeOdooIntakeClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options?: {
    baseUrl?: string;
    timeoutMs?: number;
    fetchImpl?: typeof fetch;
  }) {
    const config = getKnowledgeAuthConfig();
    this.baseUrl = (options?.baseUrl ?? config.odooBaseUrl).replace(/\/+$/, "");
    this.timeoutMs = options?.timeoutMs ?? KNOWLEDGE_UPSTREAM_TIMEOUT_MS;
    this.fetchImpl = options?.fetchImpl ?? fetch;
  }

  private async request(input: {
    method: "GET" | "POST";
    path: string;
    requestId: string;
    upstreamSessionMaterial: string;
    search?: URLSearchParams;
    payload?: unknown;
    idempotencyKey?: string;
    versionToken?: string;
  }): Promise<{ response: Response; body: unknown }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    const query = input.search?.toString();
    const url = `${this.baseUrl}${input.path}${query ? `?${query}` : ""}`;
    const headers: Record<string, string> = {
      Accept: "application/json",
      "X-Request-ID": input.requestId,
      Cookie: normalizeCookieHeader(input.upstreamSessionMaterial),
    };
    if (input.method === "POST") headers["Content-Type"] = "application/json";
    if (input.idempotencyKey) headers["Idempotency-Key"] = input.idempotencyKey;
    if (input.versionToken) headers["If-Match"] = input.versionToken;

    try {
      const response = await this.fetchImpl(url, {
        method: input.method,
        headers,
        body: input.method === "POST" ? JSON.stringify(input.payload ?? {}) : undefined,
        cache: "no-store",
        redirect: "manual",
        signal: controller.signal,
      });
      const raw = await response.text();
      let body: unknown = null;
      if (raw) {
        try {
          body = JSON.parse(raw) as unknown;
        } catch {
          body = null;
        }
      }
      if (!response.ok) throw mapError(response, body);
      return { response, body };
    } catch (error) {
      if (error instanceof KnowledgeIntakeUpstreamError) throw error;
      if (error instanceof KnowledgeUpstreamError) throw error;
      throw new KnowledgeIntakeUpstreamError("upstream_unavailable", 503);
    } finally {
      clearTimeout(timer);
    }
  }

  async listIntakes(input: {
    upstreamSessionMaterial: string;
    requestId: string;
    query?: KnowledgeIntakeQuery;
  }): Promise<KnowledgeIntakesPage> {
    const { body } = await this.request({
      method: "GET",
      path: ODOO_KNOWLEDGE_INTAKE.intakes,
      requestId: input.requestId,
      upstreamSessionMaterial: input.upstreamSessionMaterial,
      search: intakeQueryToSearchParams(input.query ?? {}),
    });
    const data = unwrapIntakeData(body);
    const intakes = Array.isArray(data)
      ? data.map(mapIntakeSummary).filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      : [];
    return { intakes, meta: mapIntakePaginationMeta(unwrapIntakeMeta(body)) };
  }

  async getIntake(input: {
    upstreamSessionMaterial: string;
    requestId: string;
    intakeUuid: string;
  }): Promise<KnowledgeIntakeDetail> {
    const { body } = await this.request({
      method: "GET",
      path: ODOO_KNOWLEDGE_INTAKE.intake(input.intakeUuid),
      requestId: input.requestId,
      upstreamSessionMaterial: input.upstreamSessionMaterial,
    });
    const mapped = mapIntakeDetail(unwrapIntakeData(body));
    if (!mapped) throw new KnowledgeIntakeUpstreamError("intake_not_found", 404);
    return mapped;
  }

  async createIntake(input: {
    upstreamSessionMaterial: string;
    requestId: string;
    payload: CreateKnowledgeIntakePayload;
  }): Promise<KnowledgeIntakeDetail> {
    const { body } = await this.request({
      method: "POST",
      path: ODOO_KNOWLEDGE_INTAKE.intakes,
      requestId: input.requestId,
      upstreamSessionMaterial: input.upstreamSessionMaterial,
      payload: input.payload,
      idempotencyKey: input.payload.idempotency_key,
    });
    const mapped = mapIntakeDetail(unwrapIntakeData(body));
    if (!mapped) throw new KnowledgeIntakeUpstreamError("server_error", 502);
    return mapped;
  }

  async runAction(input: {
    upstreamSessionMaterial: string;
    requestId: string;
    intakeUuid: string;
    action: string;
    payload: KnowledgeIntakeActionInput;
  }): Promise<KnowledgeIntakeDetail> {
    const { body } = await this.request({
      method: "POST",
      path: ODOO_KNOWLEDGE_INTAKE.action(input.intakeUuid, input.action),
      requestId: input.requestId,
      upstreamSessionMaterial: input.upstreamSessionMaterial,
      payload: {
        reason: input.payload.reason,
        version_token: input.payload.version_token,
      },
      idempotencyKey: input.payload.idempotency_key,
      versionToken: input.payload.version_token,
    });
    const mapped = mapIntakeDetail(unwrapIntakeData(body));
    if (!mapped) throw new KnowledgeIntakeUpstreamError("server_error", 502);
    return mapped;
  }

  async listOptions(input: {
    upstreamSessionMaterial: string;
    requestId: string;
    kind: string;
  }): Promise<KnowledgeIntakeOption[]> {
    const { body } = await this.request({
      method: "GET",
      path: ODOO_KNOWLEDGE_INTAKE.option(input.kind),
      requestId: input.requestId,
      upstreamSessionMaterial: input.upstreamSessionMaterial,
    });
    return mapIntakeOptions(body);
  }
}
