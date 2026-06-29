import "server-only";

import type { ControlCenterDataSource } from "@/lib/data-source/config";
import type {
  AuditLogEntry,
  PlatformSummary,
  Tenant,
  TenantDomain,
  TenantOperation,
  TenantOperationRun,
} from "@/types";

/** Metadata about which data source was actually used for a request. */
export interface DataSourceMeta {
  configuredSource: ControlCenterDataSource;
  effectiveSource: ControlCenterDataSource;
  usedFallback: boolean;
  apiConfigured: boolean;
  warning?: string;
}

export interface DataSourceResult<T> {
  data: T;
  meta: DataSourceMeta;
}

export interface PlatformDataSource {
  listTenants(): Promise<Tenant[]>;
  getTenant(code: string): Promise<Tenant | null>;
  listDomains(): Promise<TenantDomain[]>;
  listOperations(): Promise<TenantOperation[]>;
  listOperationRuns(): Promise<TenantOperationRun[]>;
  listAuditLogs(): Promise<AuditLogEntry[]>;
  getPlatformSummary(): Promise<PlatformSummary>;
}
