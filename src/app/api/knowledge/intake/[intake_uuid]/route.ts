import type { NextRequest } from "next/server";

import {
  intakeErrorResponse,
  intakeJsonError,
  intakeJsonOk,
  requireIntakeSession,
} from "@/lib/knowledge-intake/bff";
import { KnowledgeOdooIntakeClient } from "@/lib/knowledge-intake/client";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ intake_uuid: string }> },
) {
  const auth = await requireIntakeSession(request);
  if (auth instanceof Response) return auth;
  const { intake_uuid: intakeUuid } = await context.params;
  if (!intakeUuid?.trim()) {
    return intakeJsonError("validation_failed", auth.requestId, { status: 400 });
  }
  try {
    const client = new KnowledgeOdooIntakeClient();
    const intake = await client.getIntake({
      upstreamSessionMaterial: auth.session.upstream_session_material,
      requestId: auth.requestId,
      intakeUuid: intakeUuid.trim(),
    });
    return intakeJsonOk(intake, auth.requestId);
  } catch (error) {
    return intakeErrorResponse(error, auth.requestId);
  }
}
