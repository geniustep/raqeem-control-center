import type { NextRequest } from "next/server";

import {
  intakeErrorResponse,
  intakeJsonError,
  intakeJsonOk,
  requireIntakeSession,
} from "@/lib/knowledge-intake/bff";
import { KnowledgeOdooIntakeClient } from "@/lib/knowledge-intake/client";
import { INTAKE_OPTION_KINDS } from "@/lib/knowledge-intake/constants";

const KINDS = new Set<string>(INTAKE_OPTION_KINDS);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ kind: string }> },
) {
  const auth = await requireIntakeSession(request);
  if (auth instanceof Response) return auth;
  const { kind } = await context.params;
  if (!KINDS.has(kind)) {
    return intakeJsonError("validation_failed", auth.requestId, { status: 400 });
  }
  try {
    const client = new KnowledgeOdooIntakeClient();
    const options = await client.listOptions({
      upstreamSessionMaterial: auth.session.upstream_session_material,
      requestId: auth.requestId,
      kind,
    });
    return intakeJsonOk(options, auth.requestId);
  } catch (error) {
    return intakeErrorResponse(error, auth.requestId);
  }
}
