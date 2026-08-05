export const ODOO_KNOWLEDGE_INTAKE = {
  base: "/api/v1/control-center/knowledge/intake",
  intakes: "/api/v1/control-center/knowledge/intake/intakes",
  intake: (intakeUuid: string) =>
    `/api/v1/control-center/knowledge/intake/intakes/${encodeURIComponent(intakeUuid)}`,
  action: (intakeUuid: string, action: string) =>
    `/api/v1/control-center/knowledge/intake/intakes/${encodeURIComponent(intakeUuid)}/${action}`,
  option: (kind: string) =>
    `/api/v1/control-center/knowledge/intake/options/${encodeURIComponent(kind)}`,
} as const;

export const KNOWLEDGE_INTAKE_UI_PATHS = {
  inbox: "/knowledge/intake",
  create: "/knowledge/intake/new",
  detail: (intakeUuid: string) => `/knowledge/intake/${intakeUuid}`,
} as const;

export const KNOWLEDGE_INTAKE_BFF_PATHS = {
  intakes: "/api/knowledge/intake",
  intake: (intakeUuid: string) => `/api/knowledge/intake/${intakeUuid}`,
  action: (intakeUuid: string, action: string) =>
    `/api/knowledge/intake/${intakeUuid}/${action}`,
  option: (kind: string) => `/api/knowledge/intake/options/${kind}`,
} as const;

export const INTAKE_QUERY_KEYS = [
  "page",
  "page_size",
  "search",
  "sort",
  "order",
  "source_type",
  "actor_type",
  "state",
  "risk_level",
  "policy_decision",
  "proposed_action",
  "duplicate_classification",
  "proposed_item_type",
  "proposed_intent",
  "proposed_language",
  "requested_by",
  "matched_item",
  "active",
  "received_from",
  "received_to",
] as const;

export const INTAKE_SORT_VALUES = [
  "received_at",
  "write_date",
  "state",
  "risk_level",
  "source_type",
] as const;

export const INTAKE_OPTION_KINDS = [
  "source-types",
  "actor-types",
  "risk-levels",
  "states",
  "proposed-actions",
  "policy-decisions",
] as const;

export const INTAKE_ACTIONS = [
  "validate",
  "submit-for-human-review",
  "accept-as-draft",
  "reject",
  "cancel",
  "retry-validation",
] as const;
