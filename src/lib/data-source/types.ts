import "server-only";

import type { ControlCenterDataSource } from "@/lib/data-source/config";
import type {
  AuditLogEntry,
  InfrastructureServer,
  PlatformSummary,
  Tenant,
  TenantDomain,
  TenantOperation,
  TenantOperationRun,
} from "@/types";

export type DataSourceErrorCode = "odoo_unavailable" | "odoo_misconfigured";

/** Operator-safe error — no secrets or internal URLs. */
export interface DataSourceErrorInfo {
  code: DataSourceErrorCode;
}

/** Metadata about which data source was actually used for a request. */
export interface DataSourceMeta {
  configuredSource: ControlCenterDataSource;
  effectiveSource: ControlCenterDataSource;
  usedFallback: boolean;
  apiConfigured: boolean;
  warning?: string;
}

export interface DataSourceResultSuccess<T> {
  data: T;
  meta: DataSourceMeta;
  error?: undefined;
}

export interface DataSourceResultFailure {
  data: null;
  meta: DataSourceMeta;
  error: DataSourceErrorInfo;
}

export type DataSourceResult<T> =
  | DataSourceResultSuccess<T>
  | DataSourceResultFailure;

export interface PlatformDataSource {
  listTenants(): Promise<Tenant[]>;
  getTenant(code: string): Promise<Tenant | null>;
  listDomains(): Promise<TenantDomain[]>;
  listOperations(): Promise<TenantOperation[]>;
  listOperationRuns(): Promise<TenantOperationRun[]>;
  listAuditLogs(): Promise<AuditLogEntry[]>;
  listInfrastructureServers(): Promise<InfrastructureServer[]>;
  getInfrastructureServer(code: string): Promise<InfrastructureServer | null>;
  getPlatformSummary(): Promise<PlatformSummary>;
  fetchTenantsWithDashboard?(): Promise<{
    tenants: Tenant[];
    dashboard: PlatformSummary | null;
  }>;
}
