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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ public_uuid: string }> },
) {
  const requestId = createRequestId(request.headers.get("x-request-id"));
  const { public_uuid: publicUuid } = await context.params;
  if (!publicUuid?.trim()) {
    return jsonError("validation_error", requestId, { status: 400 });
  }

  try {
    const session = await requireReadyKnowledgeSession();
    const client = new KnowledgeOdooReadClient();
    const item = await client.getItem({
      upstreamSessionMaterial: session.upstream_session_material,
      requestId,
      publicUuid: publicUuid.trim(),
    });
    return jsonOk(item, requestId);
  } catch (error) {
    const mapped = mapReadErrorToHttp(error);
    const response = jsonError(mapped.code, requestId, {
      status: mapped.status,
    });
    if (mapped.clearSession) clearKnowledgeSessionCookie(response.cookies);
    return response;
  }
}
