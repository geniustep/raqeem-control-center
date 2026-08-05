import type { NextRequest } from "next/server";

import { KnowledgeOdooAuthClient, KnowledgeUpstreamError } from "@/lib/knowledge-auth/client";
import { getKnowledgeAuthConfig } from "@/lib/knowledge-auth/config";
import {
  KNOWLEDGE_LOGIN_BODY_MAX_BYTES,
} from "@/lib/knowledge-auth/constants";
import { setKnowledgeSessionCookie } from "@/lib/knowledge-auth/cookie-store";
import {
  createRequestId,
  jsonError,
  jsonOk,
} from "@/lib/knowledge-auth/envelope";
import { isAllowedKnowledgeMutationOrigin } from "@/lib/knowledge-auth/origin";
import { toPublicUser } from "@/lib/knowledge-auth/public-user";
import { createKnowledgeSessionPayload } from "@/lib/knowledge-auth/session";

const ALLOWED_LOGIN_KEYS = new Set(["login", "password", "totp"]);

export async function POST(request: NextRequest) {
  const requestId = createRequestId(request.headers.get("x-request-id"));

  if (!isAllowedKnowledgeMutationOrigin(request)) {
    return jsonError("origin_rejected", requestId, { status: 403 });
  }

  const config = getKnowledgeAuthConfig();
  if (!config.isConfigured) {
    return jsonError("misconfigured", requestId, { status: 503 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > KNOWLEDGE_LOGIN_BODY_MAX_BYTES) {
    return jsonError("validation_error", requestId, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("validation_error", requestId, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return jsonError("validation_error", requestId, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (!ALLOWED_LOGIN_KEYS.has(key)) {
      return jsonError("validation_error", requestId, { status: 400 });
    }
  }

  const login = typeof record.login === "string" ? record.login.trim() : "";
  const password = typeof record.password === "string" ? record.password : "";
  const totp =
    typeof record.totp === "string" && record.totp.trim()
      ? record.totp.trim()
      : undefined;

  if (!login || !password) {
    return jsonError("validation_error", requestId, { status: 400 });
  }

  try {
    const client = new KnowledgeOdooAuthClient({
      baseUrl: config.odooBaseUrl,
    });
    const result = await client.login({
      login,
      password,
      totp,
      requestId,
    });

    const session = createKnowledgeSessionPayload({
      user: result.user,
      upstreamSessionMaterial: result.upstreamSessionMaterial,
      ttlSeconds: config.ttlSeconds,
    });

    const response = jsonOk(
      {
        user: toPublicUser(session),
        redirect_to: session.knowledge_access_ready
          ? "/knowledge/dashboard"
          : "/knowledge/onboarding/mfa",
      },
      requestId,
    );

    await setKnowledgeSessionCookie(response.cookies, session);
    return response;
  } catch (error) {
    if (error instanceof KnowledgeUpstreamError) {
      const meta: Record<string, unknown> = {};
      if (error.retryAfterSeconds !== undefined) {
        meta.retry_after_seconds = error.retryAfterSeconds;
      }
      return jsonError(error.code, requestId, {
        status:
          error.code === "rate_limited"
            ? 429
            : error.code === "invalid_credentials" ||
                error.code === "authentication_required"
              ? 401
              : error.code === "upstream_unavailable"
                ? 503
                : 403,
        meta,
      });
    }

    return jsonError("server_error", requestId, { status: 500 });
  }
}
