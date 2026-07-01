import type { InfrastructureServer, Tenant } from "@/types";
import { sanitizeHealthCheckMessage } from "@/lib/format";
import { isDigitalOceanServer } from "@/lib/infrastructure-sync-notice";
import { isInfraSyncExplicitFailure } from "@/lib/data-source/mappers";

const PLACEHOLDER_CODES = new Set(["—", "-", ""]);

/** True when the value looks like a real infrastructure server code. */
export function isRealServerCode(code: string | null | undefined): code is string {
  if (code == null) return false;
  const trimmed = code.trim();
  return trimmed.length > 0 && !PLACEHOLDER_CODES.has(trimmed);
}

function findServerByCode(
  servers: InfrastructureServer[],
  code: string,
): InfrastructureServer | undefined {
  return servers.find((server) => server.code === code);
}

function findServerByLinkedTenant(
  servers: InfrastructureServer[],
  tenantCode: string,
  role: "app" | "data",
): InfrastructureServer | undefined {
  const key = role === "app" ? "app" : "data";
  return servers.find((server) => server.linkedTenants[key].includes(tenantCode));
}

function resolveServer(
  tenant: Tenant,
  servers: InfrastructureServer[],
  role: "app" | "data",
): InfrastructureServer | null {
  const code =
    role === "app"
      ? tenant.infrastructure.appServer
      : tenant.infrastructure.dataServer;

  if (isRealServerCode(code)) {
    const byCode = findServerByCode(servers, code);
    if (byCode) return byCode;
  }

  return findServerByLinkedTenant(servers, tenant.code, role) ?? null;
}

export interface TenantInfrastructureSummary {
  appServer: InfrastructureServer | null;
  dataServer: InfrastructureServer | null;
  /** Both roles map to the same registry record. */
  sameServer: boolean;
  /** Fallback app server code from tenant record when registry lookup misses. */
  fallbackAppCode: string | null;
  /** Fallback data server code from tenant record when registry lookup misses. */
  fallbackDataCode: string | null;
}

/** Resolve app/data infrastructure servers for a tenant from registry + tenant hints. */
export function deriveTenantInfrastructureSummary(
  tenant: Tenant,
  servers: InfrastructureServer[],
): TenantInfrastructureSummary {
  const appServer = resolveServer(tenant, servers, "app");
  const dataServer = resolveServer(tenant, servers, "data");

  const fallbackAppCode = appServer
    ? null
    : isRealServerCode(tenant.infrastructure.appServer)
      ? tenant.infrastructure.appServer
      : null;
  const fallbackDataCode = dataServer
    ? null
    : isRealServerCode(tenant.infrastructure.dataServer)
      ? tenant.infrastructure.dataServer
      : null;

  const sameServer =
    appServer !== null && dataServer !== null && appServer.code === dataServer.code;

  return {
    appServer,
    dataServer,
    sameServer,
    fallbackAppCode,
    fallbackDataCode,
  };
}

/** Local or unlinked provider — not a failure state. */
export function isLocalOrUnlinkedProvider(provider: string): boolean {
  const trimmed = provider.trim();
  return (
    trimmed.length === 0 ||
    trimmed === "—" ||
    trimmed.toLowerCase() === "local"
  );
}

export function displayInfrastructureProviderLabel(provider: string): string {
  if (isLocalOrUnlinkedProvider(provider)) {
    return "محلي / غير مرتبط بـ DigitalOcean";
  }
  if (isDigitalOceanServer({ provider } as InfrastructureServer)) {
    return "DigitalOcean";
  }
  return provider;
}

export function displayMetric(
  value: number | null | undefined,
  suffix = "",
): string | null {
  if (value == null) return null;
  return `${value}${suffix}`;
}

const ERROR_SNIPPET_MAX = 120;

/** Short operator-safe sync error — never expose secrets or long raw output. */
export function displayInfraSyncError(
  error: string | null | undefined,
): string | null {
  if (!error || error.trim().length === 0) return null;
  const sanitized = sanitizeHealthCheckMessage(error.trim());
  if (sanitized.length === 0) return null;
  if (sanitized.length <= ERROR_SNIPPET_MAX) return sanitized;
  return `${sanitized.slice(0, ERROR_SNIPPET_MAX - 1)}…`;
}

export function shouldShowInfraSyncWarning(
  status: InfrastructureServer["infraSyncStatus"],
): boolean {
  return isInfraSyncExplicitFailure(status);
}
