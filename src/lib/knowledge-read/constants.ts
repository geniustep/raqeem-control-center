/** Upstream Odoo Knowledge read routes (relative to base URL). */
export const ODOO_KNOWLEDGE_READ = {
  dashboard: "/api/v1/control-center/knowledge/dashboard",
  items: "/api/v1/control-center/knowledge/items",
  item: (publicUuid: string) =>
    `/api/v1/control-center/knowledge/items/${encodeURIComponent(publicUuid)}`,
  domains: "/api/v1/control-center/knowledge/domains",
  optionsStates: "/api/v1/control-center/knowledge/options/states",
  optionsItemTypes: "/api/v1/control-center/knowledge/options/item-types",
  optionsIntents: "/api/v1/control-center/knowledge/options/intents",
  optionsLanguages: "/api/v1/control-center/knowledge/options/languages",
} as const;

export const KNOWLEDGE_UI_PATHS = {
  root: "/knowledge",
  dashboard: "/knowledge/dashboard",
  items: "/knowledge/items",
  item: (publicUuid: string) => `/knowledge/items/${publicUuid}`,
  domains: "/knowledge/domains",
  activity: "/knowledge/activity",
} as const;

export const KNOWLEDGE_BFF_PATHS = {
  dashboard: "/api/knowledge/dashboard",
  items: "/api/knowledge/items",
  item: (publicUuid: string) => `/api/knowledge/items/${publicUuid}`,
  domains: "/api/knowledge/domains",
  optionsStates: "/api/knowledge/options/states",
  optionsItemTypes: "/api/knowledge/options/item-types",
  optionsIntents: "/api/knowledge/options/intents",
  optionsLanguages: "/api/knowledge/options/languages",
} as const;

/** Allowlisted query params for items list (must match Odoo contract). */
export const KNOWLEDGE_ITEMS_QUERY_KEYS = [
  "page",
  "page_size",
  "search",
  "state",
  "intent",
  "item_type",
  "language",
  "domain",
  "owner",
  "reviewer",
  "publisher",
  "needs_review",
  "review_status",
  "sort",
  "order",
] as const;

export const KNOWLEDGE_REVIEW_STATUS_VALUES = [
  "current",
  "overdue",
  "expired",
  "due_soon",
] as const;

export const KNOWLEDGE_SORT_VALUES = [
  "title",
  "slug",
  "state",
  "created_at",
  "updated_at",
  "published_at",
] as const;
