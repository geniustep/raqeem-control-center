export type KnowledgeIntakeSourceType =
  | "human_ui"
  | "gpt"
  | "import"
  | "api"
  | "internal";

export type KnowledgeIntakeActorType = "human" | "ai" | "importer" | "system";
export type KnowledgeIntakeRiskLevel = "low" | "medium" | "high" | "prohibited";
export type KnowledgeIntakeState =
  | "received"
  | "validated"
  | "draft_created"
  | "needs_review"
  | "rejected"
  | "cancelled"
  | "failed";

export interface KnowledgeIntakeUserRef {
  id: number | null;
  display_name: string;
  login: string | null;
}

export interface KnowledgeIntakeDomainRef {
  id: number;
  code: string;
  name: string;
}

export interface KnowledgeIntakeItemRef {
  public_uuid: string | null;
  title: string;
  state: string | null;
}

export interface KnowledgeIntakeAllowedActions {
  validate: boolean;
  submit_for_human_review: boolean;
  accept_as_draft: boolean;
  reject: boolean;
  cancel: boolean;
  retry_validation: boolean;
}

export interface KnowledgeIntakeSummary {
  intake_uuid: string;
  source_type: string;
  source_key: string | null;
  source_request_id: string | null;
  actor_type: string;
  requested_by: KnowledgeIntakeUserRef | null;
  requested_by_external_actor: string | null;
  proposed_title: string;
  proposed_question: string;
  proposed_short_answer: string;
  proposed_item_type: string;
  proposed_intent: string;
  proposed_language: string;
  proposed_primary_domain: KnowledgeIntakeDomainRef | null;
  risk_level: string;
  policy_decision: string;
  duplicate_score: number | null;
  duplicate_classification: string;
  proposed_action: string;
  state: string;
  received_at: string | null;
  updated_at: string | null;
  active: boolean;
  allowed_actions: KnowledgeIntakeAllowedActions;
  version_token: string;
}

export interface KnowledgeIntakeDetail extends KnowledgeIntakeSummary {
  proposed_body: string;
  proposed_domains: KnowledgeIntakeDomainRef[];
  proposed_references: string;
  proposed_review_interval_days: number | null;
  proposed_valid_until: string | null;
  source_url: string | null;
  source_hash: string | null;
  source_snapshot_hash: string | null;
  source_license_or_permission: string | null;
  source_confidentiality: string | null;
  ai_metadata: Record<string, unknown>;
  confidence_score: number | null;
  hallucination_risk: string | null;
  policy_reasons: string | null;
  matched_item: KnowledgeIntakeItemRef | null;
  created_item: KnowledgeIntakeItemRef | null;
  failure_code: string | null;
  failure_message_safe: string | null;
  validated_at: string | null;
  decided_at: string | null;
  completed_at: string | null;
  processed_by: KnowledgeIntakeUserRef | null;
}

export interface KnowledgeIntakePaginationMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface KnowledgeIntakesPage {
  intakes: KnowledgeIntakeSummary[];
  meta: KnowledgeIntakePaginationMeta;
}

export interface KnowledgeIntakeQuery {
  page?: number;
  page_size?: number;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
  source_type?: string;
  actor_type?: string;
  state?: string;
  risk_level?: string;
  policy_decision?: string;
  proposed_action?: string;
  duplicate_classification?: string;
  proposed_item_type?: string;
  proposed_intent?: string;
  proposed_language?: string;
  requested_by?: string;
  matched_item?: string;
  active?: string;
  received_from?: string;
  received_to?: string;
}

export interface KnowledgeIntakeOption {
  value: string;
  label: string;
}

export interface CreateKnowledgeIntakePayload {
  source_type: KnowledgeIntakeSourceType;
  source_key?: string;
  source_request_id?: string;
  idempotency_key: string;
  actor_type: KnowledgeIntakeActorType;
  requested_by_external_actor?: string;
  proposed_title: string;
  proposed_question: string;
  proposed_short_answer: string;
  proposed_body?: string;
  proposed_item_type: string;
  proposed_intent: string;
  proposed_language: string;
  proposed_domain_ids?: number[];
  proposed_primary_domain_id?: number;
  proposed_references?: string;
  proposed_review_interval_days?: number;
  proposed_valid_until?: string | null;
  source_url?: string;
  source_hash?: string;
  source_snapshot_hash?: string;
  source_license_or_permission?: string;
  source_confidentiality?: string;
  ai_provider?: string;
  ai_model?: string;
  ai_run_id?: string;
  ai_prompt_fingerprint?: string;
  ai_response_fingerprint?: string;
  confidence_score?: number;
  hallucination_risk?: string;
  generated_at?: string;
  risk_level: KnowledgeIntakeRiskLevel;
}

export interface KnowledgeIntakeActionInput {
  reason?: string;
  version_token?: string;
  idempotency_key: string;
}
