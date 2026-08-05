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

type OptionKind = "states" | "item-types" | "intents" | "languages";

const KIND_MAP: Record<string, OptionKind> = {
  states: "states",
  "item-types": "item-types",
  intents: "intents",
  languages: "languages",
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ kind: string }> },
) {
  const requestId = createRequestId(request.headers.get("x-request-id"));
  const { kind: rawKind } = await context.params;
  const kind = KIND_MAP[rawKind];
  if (!kind) {
    return jsonError("validation_error", requestId, { status: 400 });
  }

  try {
    const session = await requireReadyKnowledgeSession();
    const client = new KnowledgeOdooReadClient();
    const data = await client.listOptions(kind, {
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
