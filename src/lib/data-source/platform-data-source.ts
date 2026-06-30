import "server-only";

import { unstable_noStore as noStore } from "next/cache";
import { getDataSourceConfig, isProductionStrictOdoo } from "@/lib/data-source/config";
import {
  odooMisconfiguredError,
  toPublicDataSourceError,
} from "@/lib/data-source/errors";
import {
  getMockTenantCodes,
  MockPlatformDataSource,
} from "@/lib/data-source/mock-platform-data-source";
import { OdooPlatformDataSource } from "@/lib/data-source/odoo-platform-data-source";
import type {
  DataSourceMeta,
  DataSourceResult,
  PlatformDataSource,
} from "@/lib/data-source/types";

const FALLBACK_WARNING =
  "تعذّر الاتصال بمصدر بيانات Odoo — يتم عرض آخر بيانات متاحة (mock fallback)";

function buildMeta(
  effectiveSource: DataSourceMeta["effectiveSource"],
  usedFallback: boolean,
): DataSourceMeta {
  const config = getDataSourceConfig();
  return {
    configuredSource: config.source,
    effectiveSource,
    usedFallback,
    apiConfigured: config.isApiConfigured,
    warning: usedFallback ? FALLBACK_WARNING : undefined,
  };
}

export function createPlatformDataSource(): PlatformDataSource {
  const config = getDataSourceConfig();
  if (config.source === "odoo" && config.isApiConfigured) {
    return new OdooPlatformDataSource(config);
  }
  return new MockPlatformDataSource();
}

async function withFallback<T>(
  loader: (source: PlatformDataSource) => Promise<T>,
): Promise<DataSourceResult<T>> {
  const config = getDataSourceConfig();

  if (config.source === "odoo") {
    noStore();
  }

  if (config.source === "mock") {
    const mock = new MockPlatformDataSource();
    return { data: await loader(mock), meta: buildMeta("mock", false) };
  }

  if (!config.isApiConfigured) {
    if (isProductionStrictOdoo()) {
      return {
        data: null,
        meta: buildMeta("odoo", false),
        error: odooMisconfiguredError(),
      };
    }

    const mock = new MockPlatformDataSource();
    return {
      data: await loader(mock),
      meta: {
        ...buildMeta("mock", true),
        warning:
          "مصدر البيانات مضبوط على Odoo لكن RAQEEM_PLATFORM_API_BASE_URL غير مُعد — يتم استخدام mock",
      },
    };
  }

  const odoo = new OdooPlatformDataSource(config);
  try {
    return { data: await loader(odoo), meta: buildMeta("odoo", false) };
  } catch {
    if (isProductionStrictOdoo()) {
      return {
        data: null,
        meta: buildMeta("odoo", false),
        error: toPublicDataSourceError(),
      };
    }

    const mock = new MockPlatformDataSource();
    return { data: await loader(mock), meta: buildMeta("mock", true) };
  }
}

export async function loadTenants() {
  return withFallback((source) => source.listTenants());
}

export async function loadTenant(code: string) {
  return withFallback((source) => source.getTenant(code));
}

export async function loadDomains() {
  return withFallback((source) => source.listDomains());
}

export async function loadOperationsPageData() {
  return withFallback(async (source) => ({
    catalog: await source.listOperations(),
    runs: await source.listOperationRuns(),
  }));
}

export async function loadAuditLogs() {
  return withFallback((source) => source.listAuditLogs());
}

export async function loadInfrastructure() {
  return withFallback((source) => source.listInfrastructureServers());
}

export async function loadPlatformSummary() {
  return withFallback((source) => source.getPlatformSummary());
}

export async function loadDashboardData() {
  return withFallback(async (source) => {
    const { getPlatformSummary, getTenantsNeedingAttention } = await import(
      "@/lib/tenant-status"
    );
    const { getRecentOperationRuns } = await import("@/lib/selectors");

    let tenants;
    let summary;

    if (source.fetchTenantsWithDashboard) {
      const result = await source.fetchTenantsWithDashboard();
      tenants = result.tenants;
      summary = result.dashboard ?? getPlatformSummary(tenants);
    } else {
      tenants = await source.listTenants();
      summary = getPlatformSummary(tenants);
    }

    return {
      tenants,
      summary,
      needsAttention: getTenantsNeedingAttention(tenants),
      recentRuns: getRecentOperationRuns(6, tenants),
    };
  });
}

/** Tenant codes for SSG — mock mode only. */
export function getStaticTenantCodes(): string[] {
  if (getDataSourceConfig().source !== "mock") {
    return [];
  }
  return getMockTenantCodes();
}

export { FALLBACK_WARNING };
