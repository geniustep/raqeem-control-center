import type { NextRequest } from "next/server";

import {
  intakeErrorResponse,
  intakeJsonError,
  intakeJsonOk,
  readJsonObject,
  requireIntakeSession,
} from "@/lib/knowledge-intake/bff";
import { KnowledgeOdooIntakeClient } from "@/lib/knowledge-intake/client";
import { parseIntakeQuery } from "@/lib/knowledge-intake/query";
import type {
  CreateKnowledgeIntakePayload,
  KnowledgeIntakeActorType,
  KnowledgeIntakeRiskLevel,
  KnowledgeIntakeSourceType,
} from "@/lib/knowledge-intake/types";

const ALLOWED_CREATE_FIELDS = new Set([
  "source_type",
  "source_key",
  "source_request_id",
  "idempotency_key",
  "actor_type",
  "requested_by_external_actor",
  "proposed_title",
  "proposed_question",
  "proposed_short_answer",
  "proposed_body",
  "proposed_item_type",
  "proposed_intent",
  "proposed_language",
  "proposed_domain_ids",
  "proposed_primary_domain_id",
  "proposed_references",
  "proposed_review_interval_days",
  "proposed_valid_until",
  "source_url",
  "source_hash",
  "source_snapshot_hash",
  "source_license_or_permission",
  "source_confidentiality",
  "ai_provider",
  "ai_model",
  "ai_run_id",
  "ai_prompt_fingerprint",
  "ai_response_fingerprint",
  "confidence_score",
  "hallucination_risk",
  "generated_at",
  "risk_level",
]);

const SOURCE_TYPES = new Set<KnowledgeIntakeSourceType>([
  "human_ui",
  "gpt",
  "import",
  "api",
  "internal",
]);
const ACTOR_TYPES = new Set<KnowledgeIntakeActorType>([
  "human",
  "ai",
  "importer",
  "system",
]);
const RISK_LEVELS = new Set<KnowledgeIntakeRiskLevel>([
  "low",
  "medium",
  "high",
  "prohibited",
]);

function stringValue(body: Record<string, unknown>, key: string): string {
  return typeof body[key] === "string" ? body[key].trim() : "";
}

function optionalString(
  body: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = stringValue(body, key);
  return value || undefined;
}

function createPayload(
  body: Record<string, unknown>,
): CreateKnowledgeIntakePayload | null {
  for (const key of Object.keys(body)) {
    if (!ALLOWED_CREATE_FIELDS.has(key)) return null;
  }
  const sourceType = stringValue(
    body,
    "source_type",
  ) as KnowledgeIntakeSourceType;
  const actorType = stringValue(
    body,
    "actor_type",
  ) as KnowledgeIntakeActorType;
  const riskLevel = stringValue(
    body,
    "risk_level",
  ) as KnowledgeIntakeRiskLevel;
  const idempotencyKey = stringValue(body, "idempotency_key");
  const title = stringValue(body, "proposed_title");
  const question = stringValue(body, "proposed_question");
  const shortAnswer = stringValue(body, "proposed_short_answer");
  const itemType = stringValue(body, "proposed_item_type");
  const intent = stringValue(body, "proposed_intent");
  const language = stringValue(body, "proposed_language");
  if (
    !SOURCE_TYPES.has(sourceType) ||
    !ACTOR_TYPES.has(actorType) ||
    !RISK_LEVELS.has(riskLevel) ||
    !idempotencyKey ||
    !title ||
    !question ||
    !shortAnswer ||
    !itemType ||
    !intent ||
    !language
  ) {
    return null;
  }
  if (sourceType === "human_ui" && actorType !== "human") return null;
  if (sourceType === "gpt" && actorType !== "ai") return null;
  if (
    sourceType === "gpt" &&
    !optionalString(body, "requested_by_external_actor")
  ) {
    return null;
  }
  if (sourceType === "import" && actorType !== "importer") return null;

  const domainIds = Array.isArray(body.proposed_domain_ids)
    ? body.proposed_domain_ids
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0)
    : undefined;
  const primaryDomainId = Number(body.proposed_primary_domain_id);
  const reviewInterval = Number(body.proposed_review_interval_days);
  const confidenceScore = Number(body.confidence_score);

  return {
    source_type: sourceType,
    source_key: optionalString(body, "source_key"),
    source_request_id: optionalString(body, "source_request_id"),
    idempotency_key: idempotencyKey,
    actor_type: actorType,
    requested_by_external_actor: optionalString(
      body,
      "requested_by_external_actor",
    ),
    proposed_title: title,
    proposed_question: question,
    proposed_short_answer: shortAnswer,
    proposed_body: optionalString(body, "proposed_body"),
    proposed_item_type: itemType,
    proposed_intent: intent,
    proposed_language: language,
    proposed_domain_ids: domainIds,
    proposed_primary_domain_id:
      Number.isInteger(primaryDomainId) && primaryDomainId > 0
        ? primaryDomainId
        : undefined,
    proposed_references: optionalString(body, "proposed_references"),
    proposed_review_interval_days:
      Number.isInteger(reviewInterval) && reviewInterval > 0
        ? reviewInterval
        : undefined,
    proposed_valid_until:
      body.proposed_valid_until === null
        ? null
        : optionalString(body, "proposed_valid_until"),
    source_url: optionalString(body, "source_url"),
    source_hash: optionalString(body, "source_hash"),
    source_snapshot_hash: optionalString(body, "source_snapshot_hash"),
    source_license_or_permission: optionalString(
      body,
      "source_license_or_permission",
    ),
    source_confidentiality: optionalString(body, "source_confidentiality"),
    ai_provider: optionalString(body, "ai_provider"),
    ai_model: optionalString(body, "ai_model"),
    ai_run_id: optionalString(body, "ai_run_id"),
    ai_prompt_fingerprint: optionalString(body, "ai_prompt_fingerprint"),
    ai_response_fingerprint: optionalString(
      body,
      "ai_response_fingerprint",
    ),
    confidence_score: Number.isFinite(confidenceScore)
      ? confidenceScore
      : undefined,
    hallucination_risk: optionalString(body, "hallucination_risk"),
    generated_at: optionalString(body, "generated_at"),
    risk_level: riskLevel,
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireIntakeSession(request);
  if (auth instanceof Response) return auth;
  const parsed = parseIntakeQuery(request.nextUrl.searchParams);
  if (!parsed.ok) {
    return intakeJsonError("validation_failed", auth.requestId, {
      status: 400,
      meta: { field: parsed.field ?? null, detail: parsed.message },
    });
  }
  try {
    const client = new KnowledgeOdooIntakeClient();
    const page = await client.listIntakes({
      upstreamSessionMaterial: auth.session.upstream_session_material,
      requestId: auth.requestId,
      query: parsed.query,
    });
    return intakeJsonOk(page.intakes, auth.requestId, {
      meta: {
        page: page.meta.page,
        page_size: page.meta.page_size,
        total: page.meta.total,
        total_pages: page.meta.total_pages,
        has_next: page.meta.has_next,
        has_previous: page.meta.has_previous,
      },
    });
  } catch (error) {
    return intakeErrorResponse(error, auth.requestId);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireIntakeSession(request, true);
  if (auth instanceof Response) return auth;
  const body = await readJsonObject(request);
  const payload = body ? createPayload(body) : null;
  if (!payload) {
    return intakeJsonError("validation_failed", auth.requestId, {
      status: 400,
    });
  }
  try {
    const client = new KnowledgeOdooIntakeClient();
    const intake = await client.createIntake({
      upstreamSessionMaterial: auth.session.upstream_session_material,
      requestId: auth.requestId,
      payload,
    });
    return intakeJsonOk(intake, auth.requestId, { status: 201 });
  } catch (error) {
    return intakeErrorResponse(error, auth.requestId);
  }
}
