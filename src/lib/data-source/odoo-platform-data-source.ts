import "server-only";

import {
  type DataSourceConfig,
  isProductionStrictOdoo,
} from "@/lib/data-source/config";
import { OdooApiError, OdooConnectionError } from "@/lib/data-source/errors";
import {
  mapOdooAuditLogs,
  mapOdooDomains,
  mapOdooOperationRuns,
  mapOdooOperations,
  mapOdooTenant,
  mapOdooTenants,
} from "@/lib/data-source/mappers";
import type { PlatformDataSource } from "@/lib/data-source/types";
import { listOperations } from "@/lib/operation-catalog";
import { getAllDomains, getAllOperationRuns, getAuditLog } from "@/lib/selectors";
import { getPlatformSummary } from "@/lib/tenant-status";

const ALLOWED_METHOD = "GET" as const;

type FetchInit = RequestInit & { next?: { revalidate?: number } };

/**
 * Read-only Odoo platform API client.
 * All requests are GET-only — no mutations.
 */
export class OdooPlatformDataSource implements PlatformDataSource {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(config: Pick<DataSourceConfig, "apiBaseUrl" | "apiToken">) {
    this.baseUrl = config.apiBaseUrl.replace(/\/+$/, "");
    this.token = config.apiToken;
  }

  /** Exposed for tests — ensures only GET is ever used. */
  static allowedHttpMethod(): typeof ALLOWED_METHOD {
    return ALLOWED_METHOD;
  }

  private headers(): HeadersInit {
    const headers: HeadersInit = {
      Accept: "application/json",
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    return headers;
  }

  private async getJson(path: string): Promise<unknown> {
    const url = `${this.baseUrl}${path}`;
    let response: Response;

    try {
      response = await fetch(url, {
        method: ALLOWED_METHOD,
        headers: this.headers(),
        cache: "no-store",
      } satisfies FetchInit);
    } catch (error) {
      throw new OdooConnectionError(path, error);
    }

    if (!response.ok) {
      throw new OdooApiError(path, response.status);
    }

    return response.json();
  }

  async listTenants() {
    const body = await this.getJson("/api/v1/platform/tenants");
    return mapOdooTenants(body);
  }

  async getTenant(code: string) {
    try {
      const body = await this.getJson(
        `/api/v1/platform/tenants/${encodeURIComponent(code)}`,
      );
      if (body && typeof body === "object" && !Array.isArray(body)) {
        const record = body as Record<string, unknown>;
        const nested = record.data ?? record.tenant;
        if (nested) return mapOdooTenant(nested);
      }
      return mapOdooTenant(body);
    } catch (error) {
      if (error instanceof OdooApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async listDomains() {
    const body = await this.getJson("/api/v1/platform/domains");
    const mapped = mapOdooDomains(body);
    if (mapped.length > 0) return mapped;
    const tenantList = await this.listTenants();
    return getAllDomains(tenantList);
  }

  async listOperations() {
    const strict = isProductionStrictOdoo();

    try {
      const body = await this.getJson("/api/v1/platform/operations");
      const catalog = mapOdooOperations(body);
      if (catalog.length > 0) return catalog;
      if (strict) return [];

      const runs = mapOdooOperationRuns(body);
      if (runs.length > 0) {
        return listOperations();
      }
    } catch (error) {
      if (strict) throw error;
    }

    return listOperations();
  }

  async listOperationRuns() {
    const strict = isProductionStrictOdoo();

    try {
      const body = await this.getJson("/api/v1/platform/operations");
      const runs = mapOdooOperationRuns(body);
      if (runs.length > 0) return runs;
      if (strict) return [];
    } catch (error) {
      if (strict) throw error;
    }

    const tenantList = await this.listTenants();
    return getAllOperationRuns(tenantList);
  }

  async listAuditLogs() {
    const strict = isProductionStrictOdoo();

    try {
      const body = await this.getJson("/api/v1/platform/audit");
      const mapped = mapOdooAuditLogs(body);
      if (mapped.length > 0) return mapped;
      if (strict) return [];
    } catch (error) {
      if (strict) throw error;
    }

    const tenantList = await this.listTenants();
    return getAuditLog(tenantList);
  }

  async getPlatformSummary() {
    const tenantList = await this.listTenants();
    return getPlatformSummary(tenantList);
  }
}
