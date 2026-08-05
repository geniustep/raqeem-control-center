import { INTAKE_QUERY_KEYS, INTAKE_SORT_VALUES } from "@/lib/knowledge-intake/constants";
import type { KnowledgeIntakeQuery } from "@/lib/knowledge-intake/types";

const KEY_SET = new Set<string>(INTAKE_QUERY_KEYS);
const SORT_SET = new Set<string>(INTAKE_SORT_VALUES);

export function parseIntakeQuery(params: URLSearchParams):
  | { ok: true; query: KnowledgeIntakeQuery }
  | { ok: false; field?: string; message: string } {
  for (const key of params.keys()) {
    if (!KEY_SET.has(key)) {
      return { ok: false, field: key, message: "unsupported_query_parameter" };
    }
  }

  const pageRaw = params.get("page");
  const sizeRaw = params.get("page_size");
  const page = pageRaw ? Number.parseInt(pageRaw, 10) : 1;
  const pageSize = sizeRaw ? Number.parseInt(sizeRaw, 10) : 20;
  if (!Number.isInteger(page) || page < 1) {
    return { ok: false, field: "page", message: "invalid_page" };
  }
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    return { ok: false, field: "page_size", message: "invalid_page_size" };
  }

  const sort = params.get("sort") ?? "received_at";
  if (!SORT_SET.has(sort)) {
    return { ok: false, field: "sort", message: "invalid_sort" };
  }
  const orderRaw = params.get("order") ?? "desc";
  if (orderRaw !== "asc" && orderRaw !== "desc") {
    return { ok: false, field: "order", message: "invalid_order" };
  }

  const query: KnowledgeIntakeQuery = {
    page,
    page_size: pageSize,
    sort,
    order: orderRaw,
  };
  for (const key of INTAKE_QUERY_KEYS) {
    if (["page", "page_size", "sort", "order"].includes(key)) continue;
    const value = params.get(key)?.trim();
    if (value) (query as Record<string, unknown>)[key] = value;
  }
  return { ok: true, query };
}

export function intakeQueryToSearchParams(query: KnowledgeIntakeQuery): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of INTAKE_QUERY_KEYS) {
    const value = query[key as keyof KnowledgeIntakeQuery];
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  return params;
}
