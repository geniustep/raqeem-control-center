import type {
  KnowledgeActivityEvent,
  KnowledgeAllowedActions,
  KnowledgeDashboard,
  KnowledgeDashboardCounts,
  KnowledgeDomain,
  KnowledgeDomainRef,
  KnowledgeItemDetail,
  KnowledgeItemSummary,
  KnowledgeOption,
  KnowledgePackageSummary,
  KnowledgePaginationMeta,
  KnowledgePersonRef,
} from "@/lib/knowledge-read/types";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function str(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function strOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = str(value).trim();
  return text.length > 0 ? text : null;
}

function num(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function numOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = num(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : null;
}

function bool(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return fallback;
}

export function mapPerson(raw: unknown): KnowledgePersonRef | null {
  const record = asRecord(raw);
  if (!record) return null;
  const login = str(record.login);
  const display = str(record.display_name, login);
  if (!login && !display && record.user_id == null) return null;
  return {
    user_id: numOrNull(record.user_id),
    login,
    display_name: display || login || "—",
  };
}

export function mapDomainRef(raw: unknown): KnowledgeDomainRef | null {
  const record = asRecord(raw);
  if (!record) return null;
  return {
    id: numOrNull(record.id),
    code: str(record.code),
    name: str(record.name, str(record.code)),
  };
}

export function mapPackageSummary(raw: unknown): KnowledgePackageSummary | null {
  const record = asRecord(raw);
  if (!record) return null;
  return {
    id: numOrNull(record.id),
    version: strOrNull(record.version),
    state: strOrNull(record.state),
    hash: strOrNull(record.hash ?? record.content_hash),
    verified:
      typeof record.verified === "boolean"
        ? record.verified
        : record.verified == null
          ? null
          : bool(record.verified),
    published_at: strOrNull(record.published_at),
  };
}

export function mapAllowedActions(raw: unknown): KnowledgeAllowedActions {
  const record = asRecord(raw);
  if (!record) return {};
  const out: KnowledgeAllowedActions = {};
  for (const [key, value] of Object.entries(record)) {
    if (typeof value === "boolean") out[key] = value;
  }
  return out;
}

export function mapItemSummary(raw: unknown): KnowledgeItemSummary | null {
  const record = asRecord(raw);
  if (!record) return null;
  const publicUuid = str(record.public_uuid).trim();
  if (!publicUuid) return null;
  return {
    public_uuid: publicUuid,
    slug: str(record.slug),
    title: str(record.title || record.question),
    question: str(record.question || record.title),
    short_answer: str(record.short_answer),
    item_type: str(record.item_type),
    intent: str(record.intent),
    language: str(record.language),
    state: str(record.state),
    primary_domain: mapDomainRef(record.primary_domain),
    domains: asArray(record.domains)
      .map(mapDomainRef)
      .filter((d): d is KnowledgeDomainRef => d !== null),
    owner: mapPerson(record.owner),
    reviewer: mapPerson(record.reviewer),
    publisher: mapPerson(record.publisher),
    needs_review: bool(record.needs_review),
    review_status: strOrNull(record.review_status),
    created_at: strOrNull(record.created_at),
    updated_at: strOrNull(record.updated_at),
    published_at: strOrNull(record.published_at),
    package_count: num(record.package_count),
    relation_count: num(record.relation_count),
    asset_count: num(record.asset_count),
    latest_package: mapPackageSummary(record.latest_package),
    allowed_actions: mapAllowedActions(record.allowed_actions),
    version_token: strOrNull(record.version_token),
  };
}

export function mapItemDetail(raw: unknown): KnowledgeItemDetail | null {
  const summary = mapItemSummary(raw);
  if (!summary) return null;
  const record = asRecord(raw) ?? {};
  const validity = asRecord(record.validity) ?? {};
  return {
    ...summary,
    body: str(record.body),
    approver: mapPerson(record.approver),
    validity: {
      valid_from: strOrNull(validity.valid_from),
      valid_until: strOrNull(validity.valid_until),
      review_interval_days: numOrNull(validity.review_interval_days),
      last_review_date: strOrNull(validity.last_review_date),
      next_review_date: strOrNull(validity.next_review_date),
    },
    source_references: str(record.source_references),
    public_url: strOrNull(record.public_url),
    translation_group_uuid: strOrNull(record.translation_group_uuid),
    internal_notes: str(record.internal_notes),
  };
}

export function mapPaginationMeta(raw: unknown): KnowledgePaginationMeta {
  const record = asRecord(raw) ?? {};
  const page = Math.max(1, num(record.page, 1));
  const pageSize = Math.min(100, Math.max(1, num(record.page_size, 20)));
  const total = Math.max(0, num(record.total));
  const totalPages =
    typeof record.total_pages === "number"
      ? Math.max(0, num(record.total_pages))
      : pageSize > 0
        ? Math.ceil(total / pageSize)
        : 0;
  return {
    page,
    page_size: pageSize,
    total,
    total_pages: totalPages,
    has_next: bool(record.has_next, page < totalPages),
    has_previous: bool(record.has_previous, page > 1),
  };
}

function mapItemList(raw: unknown): KnowledgeItemSummary[] {
  return asArray(raw)
    .map(mapItemSummary)
    .filter((item): item is KnowledgeItemSummary => item !== null);
}

function mapActivity(raw: unknown): KnowledgeActivityEvent | null {
  const record = asRecord(raw);
  if (!record) return null;
  return {
    event_type: str(record.event_type),
    action: str(record.action),
    result: str(record.result),
    occurred_at: strOrNull(record.occurred_at),
    actor_login: strOrNull(record.actor_login),
    resource_type: strOrNull(record.resource_type),
    resource_key: strOrNull(record.resource_key),
    title: strOrNull(record.title),
    state: strOrNull(record.state),
  };
}

function mapCounts(raw: unknown): KnowledgeDashboardCounts {
  const record = asRecord(raw) ?? {};
  return {
    my_drafts: num(record.my_drafts),
    assigned_reviews: num(record.assigned_reviews),
    approved_without_package: num(record.approved_without_package),
    packages_to_verify: num(record.packages_to_verify),
    published_recently: num(record.published_recently),
    expired: num(record.expired),
    needs_review: num(record.needs_review),
  };
}

export function mapDashboard(raw: unknown): KnowledgeDashboard {
  const record = asRecord(raw) ?? {};
  return {
    counts: mapCounts(record.counts),
    my_drafts: mapItemList(record.my_drafts),
    assigned_reviews: mapItemList(record.assigned_reviews),
    approved_without_package: mapItemList(record.approved_without_package),
    packages_to_verify: mapItemList(record.packages_to_verify),
    published_recently: mapItemList(record.published_recently),
    expired: mapItemList(record.expired),
    needs_review: mapItemList(record.needs_review),
    recent_activity: asArray(record.recent_activity)
      .map(mapActivity)
      .filter((event): event is KnowledgeActivityEvent => event !== null),
  };
}

export function mapDomain(raw: unknown): KnowledgeDomain | null {
  const record = asRecord(raw);
  if (!record) return null;
  const id = numOrNull(record.id);
  if (id === null) return null;
  return {
    id,
    code: str(record.code),
    name: str(record.name),
    description: str(record.description),
    parent_id: numOrNull(record.parent_id),
    sequence: num(record.sequence),
    active: bool(record.active, true),
  };
}

export function mapDomains(raw: unknown): KnowledgeDomain[] {
  return asArray(raw)
    .map(mapDomain)
    .filter((d): d is KnowledgeDomain => d !== null)
    .sort((a, b) => a.sequence - b.sequence || a.name.localeCompare(b.name, "ar"));
}

export function mapOptions(raw: unknown): KnowledgeOption[] {
  return asArray(raw)
    .map((entry) => {
      const record = asRecord(entry);
      if (!record) return null;
      const value = str(record.value);
      if (!value) return null;
      return { value, label: str(record.label, value) };
    })
    .filter((o): o is KnowledgeOption => o !== null);
}

export function unwrapEnvelopeData(body: unknown): unknown {
  const root = asRecord(body);
  if (!root) return body;
  if ("data" in root) return root.data;
  return body;
}

export function unwrapEnvelopeMeta(body: unknown): unknown {
  const root = asRecord(body);
  return root?.meta ?? {};
}
