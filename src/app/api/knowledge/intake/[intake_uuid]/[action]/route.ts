import type { NextRequest } from "next/server";

import {
  intakeErrorResponse,
  intakeJsonError,
  intakeJsonOk,
  readJsonObject,
  requireIntakeSession,
} from "@/lib/knowledge-intake/bff";
import { KnowledgeOdooIntakeClient } from "@/lib/knowledge-intake/client";

const ACTION_MAP: Record<string, string> = {
  validate: "validate",
  "submit-for-human-review": "submit-for-human-review",
  reject: "reject",
  cancel: "cancel",
  "retry-validation": "retry-validation",
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ intake_uuid: string; action: string }> },
) {
  const auth = await requireIntakeSession(request, true);
  if (auth instanceof Response) return auth;
  const { intake_uuid: intakeUuid, action: rawAction } = await context.params;
  const action = ACTION_MAP[rawAction];
  if (!intakeUuid?.trim() || !action) {
    return intakeJsonError("validation_failed", auth.requestId, { status: 400 });
  }
  const body = (await readJsonObject(request, 8_000)) ?? {};
  const allowed = new Set(["reason", "version_token", "idempotency_key"]);
  if (Object.keys(body).some((key) => !allowed.has(key))) {
    return intakeJsonError("validation_failed", auth.requestId, { status: 400 });
  }
  const reason = typeof body.reason === "string" ? body.reason.trim() : undefined;
  const versionToken =
    typeof body.version_token === "string" ? body.version_token.trim() : undefined;
  const idempotencyKey =
    (typeof body.idempotency_key === "string" && body.idempotency_key.trim()) ||
    request.headers.get("idempotency-key")?.trim() ||
    "";
  if (!idempotencyKey || !versionToken) {
    return intakeJsonError("validation_failed", auth.requestId, {
      status: 400,
      meta: { required: ["idempotency_key", "version_token"] },
    });
  }
  if ((action === "reject" || action === "submit-for-human-review") && !reason) {
    return intakeJsonError("validation_failed", auth.requestId, {
      status: 400,
      meta: { required: ["reason"] },
    });
  }

  try {
    const client = new KnowledgeOdooIntakeClient();
    const intake = await client.runAction({
      upstreamSessionMaterial: auth.session.upstream_session_material,
      requestId: auth.requestId,
      intakeUuid: intakeUuid.trim(),
      action,
      payload: {
        reason,
        version_token: versionToken,
        idempotency_key: idempotencyKey,
      },
    });
    return intakeJsonOk(intake, auth.requestId);
  } catch (error) {
    return intakeErrorResponse(error, auth.requestId);
  }
}
