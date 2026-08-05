import type { NextRequest } from "next/server";

import {
  createRequestId,
  jsonError,
  jsonOk,
} from "@/lib/knowledge-auth/envelope";
import { KnowledgeOdooReadClient } from "@/lib/knowledge-read/client";
import { parseItemsQuery } from "@/lib/knowledge-read/query";
import {
  clearKnowledgeSessionCookie,
  mapReadErrorToHttp,
  requireReadyKnowledgeSession,
} from "@/lib/knowledge-read/session-gate";

export async function GET(request: NextRequest) {
  const requestId = createRequestId(request.headers.get("x-request-id"));
  const parsed = parseItemsQuery(request.nextUrl.searchParams);
  if (!parsed.ok) {
    return jsonError("validation_error", requestId, {
      status: 400,
      meta: { field: parsed.field ?? null, detail: parsed.message },
    });
  }

  try {
    const session = await requireReadyKnowledgeSession();
    const client = new KnowledgeOdooReadClient();
    const page = await client.listItems({
      upstreamSessionMaterial: session.upstream_session_material,
      requestId,
      query: parsed.query,
    });
    return jsonOk(page.items, requestId, { meta: page.meta });
  } catch (error) {
    const mapped = mapReadErrorToHttp(error);
    const response = jsonError(mapped.code, requestId, {
      status: mapped.status,
    });
    if (mapped.clearSession) clearKnowledgeSessionCookie(response.cookies);
    return response;
  }
}
