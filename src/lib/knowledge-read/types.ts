export type KnowledgePersonRef = {
  user_id: number | null;
  login: string;
  display_name: string;
};

export type KnowledgeDomainRef = {
  id: number | null;
  code: string;
  name: string;
};

export type KnowledgePackageSummary = {
  id: number | null;
  version: string | null;
  state: string | null;
  hash: string | null;
  verified: boolean | null;
  published_at: string | null;
};

export type KnowledgeAllowedActions = Record<string, boolean>;

export type KnowledgeItemSummary = {
  public_uuid: string;
  slug: string;
  title: string;
  question: string;
  short_answer: string;
  item_type: string;
  intent: string;
  language: string;
  state: string;
  primary_domain: KnowledgeDomainRef | null;
  domains: KnowledgeDomainRef[];
  owner: KnowledgePersonRef | null;
  reviewer: KnowledgePersonRef | null;
  publisher: KnowledgePersonRef | null;
  needs_review: boolean;
  review_status: string | null;
  created_at: string | null;
  updated_at: string | null;
  published_at: string | null;
  package_count: number;
  relation_count: number;
  asset_count: number;
  latest_package: KnowledgePackageSummary | null;
  allowed_actions: KnowledgeAllowedActions;
  version_token: string | null;
};

export type KnowledgeItemDetail = KnowledgeItemSummary & {
  body: string;
  approver: KnowledgePersonRef | null;
  validity: {
    valid_from: string | null;
    valid_until: string | null;
    review_interval_days: number | null;
    last_review_date: string | null;
    next_review_date: string | null;
  };
  source_references: string;
  public_url: string | null;
  translation_group_uuid: string | null;
  internal_notes: string;
};

export type KnowledgeDashboardCounts = {
  my_drafts: number;
  assigned_reviews: number;
  approved_without_package: number;
  packages_to_verify: number;
  published_recently: number;
  expired: number;
  needs_review: number;
};

export type KnowledgeActivityEvent = {
  event_type: string;
  action: string;
  result: string;
  occurred_at: string | null;
  actor_login: string | null;
  resource_type: string | null;
  resource_key: string | null;
  title: string | null;
  state: string | null;
};

export type KnowledgeDashboard = {
  counts: KnowledgeDashboardCounts;
  my_drafts: KnowledgeItemSummary[];
  assigned_reviews: KnowledgeItemSummary[];
  approved_without_package: KnowledgeItemSummary[];
  packages_to_verify: KnowledgeItemSummary[];
  published_recently: KnowledgeItemSummary[];
  expired: KnowledgeItemSummary[];
  needs_review: KnowledgeItemSummary[];
  recent_activity: KnowledgeActivityEvent[];
};

export type KnowledgeDomain = {
  id: number;
  code: string;
  name: string;
  description: string;
  parent_id: number | null;
  sequence: number;
  active: boolean;
};

export type KnowledgeOption = {
  value: string;
  label: string;
};

export type KnowledgePaginationMeta = {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
};

export type KnowledgeItemsPage = {
  items: KnowledgeItemSummary[];
  meta: KnowledgePaginationMeta;
};

export type KnowledgeItemsQuery = Partial<{
  page: number;
  page_size: number;
  search: string;
  state: string;
  intent: string;
  item_type: string;
  language: string;
  domain: string;
  owner: string;
  reviewer: string;
  publisher: string;
  needs_review: string;
  review_status: string;
  sort: string;
  order: string;
}>;
