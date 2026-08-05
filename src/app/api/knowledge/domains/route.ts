import type { NextRequest } from "next/server";

import {
  createRequestId,
  jsonError,
  jsonOk,
} from "@/lib/knowledge-auth/envelope";
import { KnowledgeOdooReadClient } from "@/lib/knowledge-read/client";
import {
  clearKnowledgeSessionCookie,
  mapReadErrorToHttp,
  requireReadyKnowledgeSession,
} from "@/lib/knowledge-read/session-gate";

export async function GET(request: NextRequest) {
  const requestId = createRequestId(request.headers.get("x-request-id"));
  try {
    const session = await requireReadyKnowledgeSession();
    const client = new KnowledgeOdooReadClient();
    const data = await client.listDomains({
      upstreamSessionMaterial: session.upstream_session_material,
      requestId,
    });
    return jsonOk(data, requestId);
  } catch (error) {
    const mapped = mapReadErrorToHttp(error);
    const response = jsonError(mapped.code, requestId, {
      status: mapped.status,
    });
    if (mapped.clearSession) clearKnowledgeSessionCookie(response.cookies);
    return response;
  }
}
