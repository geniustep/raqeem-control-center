import {
  KNOWLEDGE_ITEMS_QUERY_KEYS,
  KNOWLEDGE_REVIEW_STATUS_VALUES,
  KNOWLEDGE_SORT_VALUES,
} from "@/lib/knowledge-read/constants";
import type { KnowledgeItemsQuery } from "@/lib/knowledge-read/types";

const ALLOWED = new Set<string>(KNOWLEDGE_ITEMS_QUERY_KEYS);
const REVIEW_STATUS = new Set<string>(KNOWLEDGE_REVIEW_STATUS_VALUES);
const SORTS = new Set<string>(KNOWLEDGE_SORT_VALUES);

export type ItemsQueryParseResult =
  | { ok: true; query: KnowledgeItemsQuery }
  | { ok: false; message: string; field?: string };

function single(
  params: URLSearchParams,
  key: string,
): string | undefined {
  const values = params.getAll(key);
  if (values.length === 0) return undefined;
  if (values.length > 1) return "__MULTI__";
  return values[0];
}

/** Allowlist and lightly validate items list query params. */
export function parseItemsQuery(
  params: URLSearchParams,
): ItemsQueryParseResult {
  for (const key of params.keys()) {
    if (!ALLOWED.has(key)) {
      return { ok: false, message: "Unknown query parameter", field: key };
    }
  }

  const query: KnowledgeItemsQuery = {};

  const pageRaw = single(params, "page");
  if (pageRaw === "__MULTI__") {
    return { ok: false, message: "Multiple values not allowed", field: "page" };
  }
  if (pageRaw !== undefined) {
    const page = Number.parseInt(pageRaw, 10);
    if (!Number.isFinite(page) || page < 1) {
      return { ok: false, message: "Invalid page", field: "page" };
    }
    query.page = page;
  }

  const sizeRaw = single(params, "page_size");
  if (sizeRaw === "__MULTI__") {
    return {
      ok: false,
      message: "Multiple values not allowed",
      field: "page_size",
    };
  }
  if (sizeRaw !== undefined) {
    const size = Number.parseInt(sizeRaw, 10);
    if (!Number.isFinite(size) || size < 1 || size > 100) {
      return { ok: false, message: "Invalid page_size", field: "page_size" };
    }
    query.page_size = size;
  }

  for (const key of [
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
  ] as const) {
    const value = single(params, key);
    if (value === "__MULTI__") {
      return {
        ok: false,
        message: "Multiple values not allowed",
        field: key,
      };
    }
    if (value !== undefined && value.trim() !== "") {
      if (value.includes(",")) {
        return {
          ok: false,
          message: "Comma-separated values are not allowed",
          field: key,
        };
      }
      query[key] = value.trim();
    }
  }

  const reviewStatus = single(params, "review_status");
  if (reviewStatus === "__MULTI__") {
    return {
      ok: false,
      message: "Multiple values not allowed",
      field: "review_status",
    };
  }
  if (reviewStatus) {
    if (!REVIEW_STATUS.has(reviewStatus)) {
      return {
        ok: false,
        message: "Invalid review_status",
        field: "review_status",
      };
    }
    query.review_status = reviewStatus;
  }

  const sort = single(params, "sort");
  if (sort === "__MULTI__") {
    return { ok: false, message: "Multiple values not allowed", field: "sort" };
  }
  if (sort) {
    if (sort.startsWith("-") || !SORTS.has(sort)) {
      return { ok: false, message: "Invalid sort", field: "sort" };
    }
    query.sort = sort;
  }

  const order = single(params, "order");
  if (order === "__MULTI__") {
    return { ok: false, message: "Multiple values not allowed", field: "order" };
  }
  if (order) {
    if (order !== "asc" && order !== "desc") {
      return { ok: false, message: "Invalid order", field: "order" };
    }
    query.order = order;
  }

  return { ok: true, query };
}

export function itemsQueryToSearchParams(
  query: KnowledgeItemsQuery,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of KNOWLEDGE_ITEMS_QUERY_KEYS) {
    const value = query[key];
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  return params;
}
