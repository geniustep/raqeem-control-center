import type {
  KnowledgeIntakeAllowedActions,
  KnowledgeIntakeDetail,
  KnowledgeIntakeDomainRef,
  KnowledgeIntakeItemRef,
  KnowledgeIntakeOption,
  KnowledgeIntakePaginationMeta,
  KnowledgeIntakeSummary,
  KnowledgeIntakeUserRef,
} from "@/lib/knowledge-intake/types";

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : value == null ? fallback : String(value);
}

function nullableText(value: unknown): string | null {
  const valueText = text(value).trim();
  return valueText ? valueText : null;
}

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function bool(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function userRef(value: unknown): KnowledgeIntakeUserRef | null {
  const node = record(value);
  if (!node) return null;
  const id = num(node.id ?? node.user_id);
  const displayName = text(node.display_name ?? node.name ?? node.login).trim();
  if (!displayName && id === null) return null;
  return {
    id,
    display_name: displayName || "—",
    login: nullableText(node.login),
  };
}

function domainRef(value: unknown): KnowledgeIntakeDomainRef | null {
  const node = record(value);
  if (!node) return null;
  const id = num(node.id);
  if (id === null) return null;
  return {
    id,
    code: text(node.code),
    name: text(node.name ?? node.display_name ?? node.code, "—"),
  };
}

function itemRef(value: unknown): KnowledgeIntakeItemRef | null {
  const node = record(value);
  if (!node) return null;
  const title = text(node.title ?? node.name ?? node.question).trim();
  const publicUuid = nullableText(node.public_uuid ?? node.uuid);
  if (!title && !publicUuid) return null;
  return {
    public_uuid: publicUuid,
    title: title || publicUuid || "—",
    state: nullableText(node.state),
  };
}

function actions(value: unknown): KnowledgeIntakeAllowedActions {
  const node = record(value) ?? {};
  return {
    validate: bool(node.validate),
    submit_for_human_review: bool(
      node.submit_for_human_review ?? node.submitForHumanReview,
    ),
    accept_as_draft: bool(node.accept_as_draft ?? node.acceptAsDraft),
    reject: bool(node.reject),
    cancel: bool(node.cancel),
    retry_validation: bool(node.retry_validation ?? node.retryValidation),
  };
}

export function unwrapIntakeData(value: unknown): unknown {
  const root = record(value);
  return root && "data" in root ? root.data : value;
}

export function unwrapIntakeMeta(value: unknown): Record<string, unknown> {
  return record(record(value)?.meta) ?? {};
}

export function mapIntakeSummary(value: unknown): KnowledgeIntakeSummary | null {
  const node = record(value);
  if (!node) return null;
  const intakeUuid = text(node.intake_uuid ?? node.uuid).trim();
  if (!intakeUuid) return null;
  return {
    intake_uuid: intakeUuid,
    source_type: text(node.source_type),
    source_key: nullableText(node.source_key),
    source_request_id: nullableText(node.source_request_id),
    actor_type: text(node.actor_type),
    requested_by: userRef(node.requested_by ?? node.requested_by_user),
    requested_by_external_actor: nullableText(node.requested_by_external_actor),
    proposed_title: text(node.proposed_title ?? node.title),
    proposed_question: text(node.proposed_question ?? node.question),
    proposed_short_answer: text(node.proposed_short_answer ?? node.short_answer),
    proposed_item_type: text(node.proposed_item_type ?? node.item_type),
    proposed_intent: text(node.proposed_intent ?? node.intent),
    proposed_language: text(node.proposed_language ?? node.language),
    proposed_primary_domain: domainRef(
      node.proposed_primary_domain ?? node.primary_domain,
    ),
    risk_level: text(node.risk_level),
    policy_decision: text(node.policy_decision),
    duplicate_score: num(node.duplicate_score),
    duplicate_classification: text(node.duplicate_classification),
    proposed_action: text(node.proposed_action),
    state: text(node.state),
    received_at: nullableText(node.received_at ?? node.create_date),
    updated_at: nullableText(node.updated_at ?? node.write_date),
    active: bool(node.active, true),
    allowed_actions: actions(node.allowed_actions),
    version_token: text(node.version_token ?? node.write_date),
  };
}

export function mapIntakeDetail(value: unknown): KnowledgeIntakeDetail | null {
  const node = record(value);
  const summary = mapIntakeSummary(value);
  if (!node || !summary) return null;
  const domainsRaw = Array.isArray(node.proposed_domains)
    ? node.proposed_domains
    : Array.isArray(node.domains)
      ? node.domains
      : [];
  return {
    ...summary,
    proposed_body: text(node.proposed_body ?? node.body),
    proposed_domains: domainsRaw
      .map(domainRef)
      .filter((entry): entry is KnowledgeIntakeDomainRef => entry !== null),
    proposed_references: text(node.proposed_references ?? node.references),
    proposed_review_interval_days: num(node.proposed_review_interval_days),
    proposed_valid_until: nullableText(node.proposed_valid_until),
    source_url: nullableText(node.source_url),
    source_hash: nullableText(node.source_hash),
    source_snapshot_hash: nullableText(node.source_snapshot_hash),
    source_license_or_permission: nullableText(node.source_license_or_permission),
    source_confidentiality: nullableText(node.source_confidentiality),
    ai_metadata: record(node.ai_metadata) ?? {},
    confidence_score: num(node.confidence_score),
    hallucination_risk: nullableText(node.hallucination_risk),
    policy_reasons: nullableText(node.policy_reasons),
    matched_item: itemRef(node.matched_item),
    created_item: itemRef(node.created_item),
    failure_code: nullableText(node.failure_code),
    failure_message_safe: nullableText(node.failure_message_safe),
    validated_at: nullableText(node.validated_at),
    decided_at: nullableText(node.decided_at),
    completed_at: nullableText(node.completed_at),
    processed_by: userRef(node.processed_by),
  };
}

export function mapIntakePaginationMeta(value: unknown): KnowledgeIntakePaginationMeta {
  const node = record(value) ?? {};
  const page = num(node.page) ?? 1;
  const pageSize = num(node.page_size) ?? 20;
  const total = num(node.total) ?? 0;
  const totalPages = num(node.total_pages) ?? Math.ceil(total / Math.max(pageSize, 1));
  return {
    page,
    page_size: pageSize,
    total,
    total_pages: totalPages,
    has_next: bool(node.has_next, page < totalPages),
    has_previous: bool(node.has_previous, page > 1),
  };
}

export function mapIntakeOptions(value: unknown): KnowledgeIntakeOption[] {
  const data = unwrapIntakeData(value);
  const dataNode = record(data);
  const values = Array.isArray(data)
    ? data
    : Array.isArray(dataNode?.options)
      ? dataNode.options
      : [];

  return values
    .map((entry) => {
      const node = record(entry);
      if (node) {
        const optionValue = text(node.value ?? node.code ?? node.id).trim();
        if (!optionValue) return null;
        return {
          value: optionValue,
          label: text(node.label ?? node.name ?? optionValue),
        };
      }
      const optionValue = text(entry).trim();
      return optionValue ? { value: optionValue, label: optionValue } : null;
    })
    .filter((entry): entry is KnowledgeIntakeOption => entry !== null);
}
