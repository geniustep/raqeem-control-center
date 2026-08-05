import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

import { knowledgeErrorMessage } from "@/lib/knowledge-auth/errors";
import type {
  KnowledgeAuthErrorCode,
  KnowledgeBffEnvelope,
} from "@/lib/knowledge-auth/types";

export function createRequestId(incoming?: string | null): string {
  const value = incoming?.trim();
  if (value && /^[\w.-]{8,128}$/.test(value)) return value;
  return randomUUID();
}

export function okEnvelope<T>(
  data: T,
  requestId: string,
  meta: Record<string, unknown> = {},
): KnowledgeBffEnvelope<T> {
  return {
    ok: true,
    data,
    meta,
    request_id: requestId,
    error: null,
  };
}

export function errorEnvelope(
  code: KnowledgeAuthErrorCode,
  requestId: string,
  meta: Record<string, unknown> = {},
): KnowledgeBffEnvelope<null> {
  return {
    ok: false,
    data: null,
    meta,
    request_id: requestId,
    error: {
      code,
      message: knowledgeErrorMessage(code),
    },
  };
}

export function jsonOk<T>(
  data: T,
  requestId: string,
  init?: { status?: number; meta?: Record<string, unknown>; headers?: HeadersInit },
) {
  const response = NextResponse.json(
    okEnvelope(data, requestId, init?.meta ?? {}),
    { status: init?.status ?? 200 },
  );
  response.headers.set("X-Request-ID", requestId);
  if (init?.headers) {
    const extra = new Headers(init.headers);
    extra.forEach((value, key) => response.headers.set(key, value));
  }
  return response;
}

export function jsonError(
  code: KnowledgeAuthErrorCode,
  requestId: string,
  init?: { status?: number; meta?: Record<string, unknown>; headers?: HeadersInit },
) {
  const status =
    init?.status ??
    (code === "invalid_credentials" || code === "authentication_required"
      ? 401
      : code === "rate_limited"
        ? 429
        : code === "origin_rejected" || code === "permission_denied"
          ? 403
          : code === "validation_error"
            ? 400
            : code === "item_not_found"
              ? 404
              : code === "misconfigured" || code === "upstream_unavailable"
                ? 503
                : code === "mfa_required"
                  ? 403
                  : 400);

  const response = NextResponse.json(
    errorEnvelope(code, requestId, init?.meta ?? {}),
    { status },
  );
  response.headers.set("X-Request-ID", requestId);
  if (init?.headers) {
    const extra = new Headers(init.headers);
    extra.forEach((value, key) => response.headers.set(key, value));
  }
  return response;
}
