import type { NextRequest } from "next/server";

import { KnowledgeOdooAuthClient } from "@/lib/knowledge-auth/client";
import { getKnowledgeAuthConfig } from "@/lib/knowledge-auth/config";
import {
  clearKnowledgeSessionCookie,
  readKnowledgeSessionFromCookies,
} from "@/lib/knowledge-auth/cookie-store";
import {
  createRequestId,
  jsonError,
  jsonOk,
} from "@/lib/knowledge-auth/envelope";
import { isAllowedKnowledgeMutationOrigin } from "@/lib/knowledge-auth/origin";

export async function POST(request: NextRequest) {
  const requestId = createRequestId(request.headers.get("x-request-id"));

  if (!isAllowedKnowledgeMutationOrigin(request)) {
    return jsonError("origin_rejected", requestId, { status: 403 });
  }

  const config = getKnowledgeAuthConfig();
  const session = await readKnowledgeSessionFromCookies();

  if (session && config.isConfigured) {
    const client = new KnowledgeOdooAuthClient({
      baseUrl: config.odooBaseUrl,
    });
    await client.logout({
      upstreamSessionMaterial: session.upstream_session_material,
      requestId,
    });
  }

  const response = jsonOk({ logged_out: true }, requestId);
  clearKnowledgeSessionCookie(response.cookies);
  return response;
}
