import type { NextRequest } from "next/server";

import {
  KnowledgeOdooAuthClient,
  KnowledgeUpstreamError,
} from "@/lib/knowledge-auth/client";
import { getKnowledgeAuthConfig } from "@/lib/knowledge-auth/config";
import {
  clearKnowledgeSessionCookie,
  readKnowledgeSessionFromCookies,
  setKnowledgeSessionCookie,
} from "@/lib/knowledge-auth/cookie-store";
import {
  createRequestId,
  jsonError,
  jsonOk,
} from "@/lib/knowledge-auth/envelope";
import { shouldClearSessionOnError } from "@/lib/knowledge-auth/errors";
import { toPublicUser } from "@/lib/knowledge-auth/public-user";
import { mergeLiveUserIntoSession } from "@/lib/knowledge-auth/session";

export async function GET(request: NextRequest) {
  const requestId = createRequestId(request.headers.get("x-request-id"));
  const config = getKnowledgeAuthConfig();

  if (!config.isConfigured) {
    return jsonError("misconfigured", requestId, { status: 503 });
  }

  const session = await readKnowledgeSessionFromCookies();
  if (!session) {
    return jsonError("authentication_required", requestId, { status: 401 });
  }

  try {
    const client = new KnowledgeOdooAuthClient({
      baseUrl: config.odooBaseUrl,
    });
    const liveUser = await client.me({
      upstreamSessionMaterial: session.upstream_session_material,
      requestId,
    });

    const refreshed = mergeLiveUserIntoSession(session, liveUser);
    const response = jsonOk({ user: toPublicUser(refreshed) }, requestId);
    await setKnowledgeSessionCookie(response.cookies, refreshed);
    return response;
  } catch (error) {
    if (error instanceof KnowledgeUpstreamError) {
      const response = jsonError(error.code, requestId, {
        status:
          error.code === "rate_limited"
            ? 429
            : error.code === "upstream_unavailable"
              ? 503
              : 401,
      });
      if (shouldClearSessionOnError(error.code)) {
        clearKnowledgeSessionCookie(response.cookies);
      }
      return response;
    }

    const response = jsonError("server_error", requestId, { status: 500 });
    clearKnowledgeSessionCookie(response.cookies);
    return response;
  }
}
