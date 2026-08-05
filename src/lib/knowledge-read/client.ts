import "server-only";

import {
  KnowledgeUpstreamError,
  normalizeCookieHeader,
} from "@/lib/knowledge-auth/client";
import { getKnowledgeAuthConfig } from "@/lib/knowledge-auth/config";
import { KNOWLEDGE_UPSTREAM_TIMEOUT_MS } from "@/lib/knowledge-auth/constants";
import { mapUpstreamAuthError } from "@/lib/knowledge-auth/errors";
import { ODOO_KNOWLEDGE_READ } from "@/lib/knowledge-read/constants";
import {
  mapDashboard,
  mapDomains,
  mapItemDetail,
  mapItemSummary,
  mapOptions,
  mapPaginationMeta,
  unwrapEnvelopeData,
  unwrapEnvelopeMeta,
} from "@/lib/knowledge-read/mappers";
import { itemsQueryToSearchParams } from "@/lib/knowledge-read/query";
import type {
  KnowledgeDashboard,
  KnowledgeDomain,
  KnowledgeItemDetail,
  KnowledgeItemsPage,
  KnowledgeItemsQuery,
  KnowledgeOption,
} from "@/lib/knowledge-read/types";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function parseRetryAfter(response: Response): number | undefined {
  const raw = response.headers.get("retry-after");
  if (!raw) return undefined;
  const seconds = Number.parseInt(raw, 10);
  return Number.isFinite(seconds) ? seconds : undefined;
}

function throwMapped(status: number, body: unknown): never {
  const root = asRecord(body);
  const err = asRecord(root?.error);
  const code = mapUpstreamAuthError({
    status,
    code:
      (typeof err?.code === "string" && err.code) ||
      (typeof root?.code === "string" && root.code) ||
      null,
  });

  if (status === 404 || err?.code === "item_not_found") {
    throw new KnowledgeUpstreamError("permission_denied", "item_not_found", {
      status: 404,
    });
  }

  throw new KnowledgeUpstreamError(code, undefined, {
    status,
    retryAfterSeconds: status === 429 ? parseRetryAfter(new Response()) : undefined,
  });
}

export class KnowledgeItemNotFoundError extends KnowledgeUpstreamError {
  constructor() {
    super("permission_denied", "item_not_found", { status: 404 });
    this.name = "KnowledgeItemNotFoundError";
  }
}

/**
 * Server-only Knowledge read client.
 * Uses interactive upstream session from Knowledge cookie — never Bearer service tokens.
 */
export class KnowledgeOdooReadClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options?: {
    baseUrl?: string;
    timeoutMs?: number;
    fetchImpl?: typeof fetch;
  }) {
    const config = getKnowledgeAuthConfig();
    this.baseUrl = (options?.baseUrl ?? config.odooBaseUrl).replace(/\/+$/, "");
    this.timeoutMs = options?.timeoutMs ?? KNOWLEDGE_UPSTREAM_TIMEOUT_MS;
    this.fetchImpl = options?.fetchImpl ?? fetch;
  }

  private async getJson(input: {
    path: string;
    requestId: string;
    upstreamSessionMaterial: string;
    search?: URLSearchParams;
  }): Promise<{ response: Response; body: unknown }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    const qs = input.search?.toString();
    const url = `${this.baseUrl}${input.path}${qs ? `?${qs}` : ""}`;

    try {
      const response = await this.fetchImpl(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-Request-ID": input.requestId,
          Cookie: normalizeCookieHeader(input.upstreamSessionMaterial),
        },
        cache: "no-store",
        redirect: "manual",
        signal: controller.signal,
      });

      let body: unknown = null;
      const text = await response.text();
      if (text) {
        try {
          body = JSON.parse(text) as unknown;
        } catch {
          body = null;
        }
      }
      return { response, body };
    } catch {
      throw new KnowledgeUpstreamError("upstream_unavailable");
    } finally {
      clearTimeout(timer);
    }
  }

  private ensureOk(response: Response, body: unknown): void {
    if (response.status === 429) {
      throw new KnowledgeUpstreamError("rate_limited", undefined, {
        status: 429,
        retryAfterSeconds: parseRetryAfter(response),
      });
    }
    if (response.status === 404) {
      const root = asRecord(body);
      const err = asRecord(root?.error);
      if (err?.code === "item_not_found" || response.url.includes("/items/")) {
        throw new KnowledgeItemNotFoundError();
      }
    }
    if (!response.ok) {
      throwMapped(response.status, body);
    }
  }

  async getDashboard(input: {
    upstreamSessionMaterial: string;
    requestId: string;
  }): Promise<KnowledgeDashboard> {
    const { response, body } = await this.getJson({
      path: ODOO_KNOWLEDGE_READ.dashboard,
      requestId: input.requestId,
      upstreamSessionMaterial: input.upstreamSessionMaterial,
    });
    this.ensureOk(response, body);
    return mapDashboard(unwrapEnvelopeData(body));
  }

  async listItems(input: {
    upstreamSessionMaterial: string;
    requestId: string;
    query?: KnowledgeItemsQuery;
  }): Promise<KnowledgeItemsPage> {
    const search = itemsQueryToSearchParams(input.query ?? {});
    const { response, body } = await this.getJson({
      path: ODOO_KNOWLEDGE_READ.items,
      requestId: input.requestId,
      upstreamSessionMaterial: input.upstreamSessionMaterial,
      search,
    });
    this.ensureOk(response, body);
    const data = unwrapEnvelopeData(body);
    const items = Array.isArray(data)
      ? data
          .map(mapItemSummary)
          .filter((item): item is NonNullable<typeof item> => item !== null)
      : [];
    return {
      items,
      meta: mapPaginationMeta(unwrapEnvelopeMeta(body)),
    };
  }

  async getItem(input: {
    upstreamSessionMaterial: string;
    requestId: string;
    publicUuid: string;
  }): Promise<KnowledgeItemDetail> {
    const { response, body } = await this.getJson({
      path: ODOO_KNOWLEDGE_READ.item(input.publicUuid),
      requestId: input.requestId,
      upstreamSessionMaterial: input.upstreamSessionMaterial,
    });
    this.ensureOk(response, body);
    const mapped = mapItemDetail(unwrapEnvelopeData(body));
    if (!mapped) throw new KnowledgeItemNotFoundError();
    return mapped;
  }

  async listDomains(input: {
    upstreamSessionMaterial: string;
    requestId: string;
  }): Promise<KnowledgeDomain[]> {
    const { response, body } = await this.getJson({
      path: ODOO_KNOWLEDGE_READ.domains,
      requestId: input.requestId,
      upstreamSessionMaterial: input.upstreamSessionMaterial,
    });
    this.ensureOk(response, body);
    return mapDomains(unwrapEnvelopeData(body));
  }

  async listOptions(
    kind: "states" | "item-types" | "intents" | "languages",
    input: { upstreamSessionMaterial: string; requestId: string },
  ): Promise<KnowledgeOption[]> {
    const path =
      kind === "states"
        ? ODOO_KNOWLEDGE_READ.optionsStates
        : kind === "item-types"
          ? ODOO_KNOWLEDGE_READ.optionsItemTypes
          : kind === "intents"
            ? ODOO_KNOWLEDGE_READ.optionsIntents
            : ODOO_KNOWLEDGE_READ.optionsLanguages;
    const { response, body } = await this.getJson({
      path,
      requestId: input.requestId,
      upstreamSessionMaterial: input.upstreamSessionMaterial,
    });
    this.ensureOk(response, body);
    return mapOptions(unwrapEnvelopeData(body));
  }
}
