import "server-only";

import type {
  AuditLogEntry,
  BrandingStatus,
  CheckStatus,
  LifecycleState,
  OperationType,
  RiskLevel,
  Tenant,
  TenantCloudflare,
  TenantDatabase,
  TenantDomain,
  TenantFrontend,
  TenantHealthCheck,
  TenantIdentity,
  TenantInfrastructure,
  TenantLifecycleStage,
  TenantNginx,
  TenantOdoo,
  TenantOperation,
  TenantOperationRun,
  TenantOverallStatus,
  TenantSsl,
  TenantApiHealth,
  PlatformSummary,
} from "@/types";
import { LIFECYCLE_ORDER } from "@/lib/i18n";

type JsonRecord = Record<string, unknown>;

const CHECK_STATUSES: CheckStatus[] = [
  "passed",
  "warning",
  "failed",
  "pending",
  "recorded",
  "unknown",
  "not_configured",
];
const OVERALL_STATUSES: TenantOverallStatus[] = [
  "draft",
  "provisioning",
  "live",
  "live_with_warnings",
  "blocked",
  "maintenance",
];
const RISK_LEVELS: RiskLevel[] = ["low", "medium", "high"];

/** Unwrap common Odoo API envelope shapes. */
export function unwrapPayload<T = unknown>(body: unknown): T[] {
  if (Array.isArray(body)) return body as T[];
  if (body && typeof body === "object") {
    const record = body as JsonRecord;
    for (const key of ["data", "items", "results", "records"]) {
      if (Array.isArray(record[key])) return record[key] as T[];
    }
    for (const key of ["tenants", "domains", "operations", "audit", "logs"]) {
      if (Array.isArray(record[key])) return record[key] as T[];
    }
  }
  return [];
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function pickString(record: JsonRecord, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return undefined;
}

function pickBoolean(record: JsonRecord, ...keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") return value;
  }
  return undefined;
}

function pickNumber(record: JsonRecord, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return undefined;
}

function asCheckStatus(value: unknown, fallback: CheckStatus = "unknown"): CheckStatus {
  if (typeof value === "string" && CHECK_STATUSES.includes(value as CheckStatus)) {
    return value as CheckStatus;
  }
  return fallback;
}

function asOverallStatus(
  value: unknown,
  fallback: TenantOverallStatus = "provisioning",
): TenantOverallStatus {
  if (typeof value === "string" && OVERALL_STATUSES.includes(value as TenantOverallStatus)) {
    return value as TenantOverallStatus;
  }
  return fallback;
}

function asRiskLevel(value: unknown, fallback: RiskLevel = "medium"): RiskLevel {
  if (typeof value === "string" && RISK_LEVELS.includes(value as RiskLevel)) {
    return value as RiskLevel;
  }
  return fallback;
}

function asBrandingStatus(value: unknown): BrandingStatus {
  return value === "configured" ? "configured" : "missing";
}

/** True only for an explicit failure — unknown/not_configured are neutral. */
export function isCheckExplicitFailure(status: CheckStatus | string): boolean {
  return status === "failed";
}

type DashboardCountField = Exclude<keyof PlatformSummary, "fromOdoo">;

const DASHBOARD_COUNT_KEYS: Array<[DashboardCountField, string[]]> = [
  ["totalTenants", ["tenant_count", "tenantCount", "total_tenants", "totalTenants"]],
  [
    "tenantsWithWarnings",
    ["warning_count", "warningCount", "tenants_with_warnings", "tenantsWithWarnings"],
  ],
  ["criticalCount", ["critical_count", "criticalCount"]],
  ["sslReady", ["ssl_ready_count", "sslReadyCount", "ssl_ready", "sslReady"]],
  ["proxyReady", ["proxy_ready_count", "proxyReadyCount", "proxy_ready", "proxyReady"]],
  [
    "servicesActive",
    ["services_active_count", "servicesActiveCount", "services_active", "servicesActive"],
  ],
  [
    "frontendReady",
    ["frontend_ready_count", "frontendReadyCount", "frontend_ready", "frontendReady"],
  ],
  [
    "backendDbHealthy",
    [
      "backend_db_healthy_count",
      "backendDbHealthyCount",
      "backend_db_healthy",
      "backendDbHealthy",
    ],
  ],
];

function hasDashboardAggregateFields(record: JsonRecord): boolean {
  return DASHBOARD_COUNT_KEYS.some(([, keys]) => pickNumber(record, ...keys) !== undefined);
}

function extractDashboardRecord(body: unknown): JsonRecord | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const root = body as JsonRecord;
  for (const key of ["dashboard", "summary", "aggregate", "metrics"]) {
    const nested = asRecord(root[key]);
    if (hasDashboardAggregateFields(nested)) return nested;
  }
  return hasDashboardAggregateFields(root) ? root : null;
}

/** Map Odoo dashboard aggregate counts from a /tenants (or /health) envelope. */
export function mapOdooDashboardAggregate(body: unknown): PlatformSummary | null {
  const record = extractDashboardRecord(body);
  if (!record) return null;

  const summary = {} as Record<DashboardCountField, number>;
  for (const [field, keys] of DASHBOARD_COUNT_KEYS) {
    summary[field] = pickNumber(record, ...keys) ?? 0;
  }

  return { ...summary, fromOdoo: true };
}

export function mapOdooTenantsResponse(body: unknown): {
  tenants: Tenant[];
  dashboard: PlatformSummary | null;
} {
  return {
    tenants: mapOdooTenants(body),
    dashboard: mapOdooDashboardAggregate(body),
  };
}

function defaultLifecycle(): LifecycleState[] {
  return LIFECYCLE_ORDER.map((stage) => ({ stage, status: "pending" as const }));
}

function mapLifecycle(raw: unknown): LifecycleState[] {
  if (!Array.isArray(raw) || raw.length === 0) return defaultLifecycle();
  const stageStatuses: LifecycleState["status"][] = [
    "done",
    "current",
    "warning",
    "blocked",
    "pending",
  ];
  return raw.map((item) => {
    const record = asRecord(item);
    const stage =
      (pickString(record, "stage", "name") as TenantLifecycleStage | undefined) ??
      "draft";
    const lifecycleStatusRaw = pickString(
      record,
      "lifecycle_status",
      "lifecycleStatus",
      "status",
    );
    if (
      lifecycleStatusRaw &&
      stageStatuses.includes(lifecycleStatusRaw as LifecycleState["status"])
    ) {
      return { stage, status: lifecycleStatusRaw as LifecycleState["status"] };
    }
    const checkStatus = asCheckStatus(record.status, "pending");
    const lifecycleStatus: LifecycleState["status"] =
      checkStatus === "passed"
        ? "done"
        : checkStatus === "warning"
          ? "warning"
          : checkStatus === "failed"
            ? "blocked"
            : "pending";
    return { stage, status: lifecycleStatus };
  });
}

function mapIdentity(record: JsonRecord, code: string, name: string): TenantIdentity {
  const identity = asRecord(record.identity);
  return {
    schoolName: pickString(identity, "school_name", "schoolName") ?? name,
    tenantCode: pickString(identity, "tenant_code", "tenantCode") ?? code,
    academicYear:
      pickString(identity, "academic_year", "academicYear") ?? "—",
    language: pickString(identity, "language") ?? "ar",
    timezone: pickString(identity, "timezone") ?? "Africa/Casablanca",
    currency: pickString(identity, "currency") ?? "MAD",
    brandingStatus: asBrandingStatus(
      pickString(identity, "branding_status", "brandingStatus"),
    ),
    brandingUrl:
      pickString(identity, "branding_url", "brandingUrl") ??
      `https://${code}.raqeem.ma/admin/settings/school-branding`,
  };
}

function mapInfrastructure(record: JsonRecord): TenantInfrastructure {
  const infra = asRecord(record.infrastructure);
  return {
    appServer: pickString(infra, "app_server", "appServer") ?? "—",
    appServerPrivateIp:
      pickString(infra, "app_server_private_ip", "appServerPrivateIp") ??
      "configured outside control center",
    appServerPublicIp:
      pickString(infra, "app_server_public_ip", "appServerPublicIp") ??
      "configured outside control center",
    dataServer: pickString(infra, "data_server", "dataServer") ?? "—",
    dataServerPrivateIp:
      pickString(infra, "data_server_private_ip", "dataServerPrivateIp") ??
      "configured outside control center",
    dbHost: pickString(infra, "db_host", "dbHost") ?? "configured outside control center",
    dbName: pickString(infra, "db_name", "dbName") ?? "—",
    dbUser: pickString(infra, "db_user", "dbUser") ?? "—",
    odooLocalPort:
      pickString(infra, "odoo_local_port", "odooLocalPort") ?? "—",
    serviceName: pickString(infra, "service_name", "serviceName") ?? "—",
  };
}

function mapDatabase(record: JsonRecord): TenantDatabase {
  const db = asRecord(record.database);
  const pgHbaRules = db.pg_hba_rules ?? db.pgHbaRules;
  return {
    reachable: pickBoolean(db, "reachable") ?? false,
    host: pickString(db, "host") ?? "configured outside control center",
    port: pickString(db, "port") ?? "5432",
    dbName: pickString(db, "db_name", "dbName") ?? "—",
    dbUser: pickString(db, "db_user", "dbUser") ?? "—",
    pgHbaRules: Array.isArray(pgHbaRules)
      ? pgHbaRules.filter((line): line is string => typeof line === "string")
      : [],
    pgHbaStatus: asCheckStatus(db.pg_hba_status ?? db.pgHbaStatus, "unknown"),
    tableCount: pickNumber(db, "table_count", "tableCount") ?? 0,
    schoolTables: pickNumber(db, "school_tables", "schoolTables") ?? 0,
    modulesInstalled: pickBoolean(db, "modules_installed", "modulesInstalled") ?? false,
    lastSmokeResult: asCheckStatus(
      db.last_smoke_result ?? db.lastSmokeResult,
      "unknown",
    ),
  };
}

function mapOdoo(record: JsonRecord, apiDomain: string): TenantOdoo {
  const odoo = asRecord(record.odoo);
  return {
    serviceName: pickString(odoo, "service_name", "serviceName") ?? "—",
    active: pickBoolean(odoo, "active") ?? false,
    enabled: pickBoolean(odoo, "enabled") ?? false,
    localUrl: pickString(odoo, "local_url", "localUrl") ?? "http://127.0.0.1",
    localPort: pickString(odoo, "local_port", "localPort") ?? "—",
    localOnly: pickBoolean(odoo, "local_only", "localOnly") ?? true,
    baseInstalled: pickBoolean(odoo, "base_installed", "baseInstalled") ?? false,
    backendDomain:
      pickString(odoo, "backend_domain", "backendDomain") ?? apiDomain,
    smartSchoolConnectInstalled:
      pickBoolean(odoo, "smart_school_connect_installed", "smartSchoolConnectInstalled") ??
      false,
    smartSchoolConnectVersion:
      pickString(odoo, "smart_school_connect_version", "smartSchoolConnectVersion") ??
      "—",
    smartSchoolConnectCommit:
      pickString(odoo, "smart_school_connect_commit", "smartSchoolConnectCommit") ??
      "—",
    modulesState: asCheckStatus(odoo.modules_state ?? odoo.modulesState, "unknown"),
  };
}

function mapNginx(record: JsonRecord): TenantNginx {
  const nginx = asRecord(record.nginx);
  return {
    active: pickBoolean(nginx, "active") ?? false,
    sitePath: pickString(nginx, "site_path", "sitePath") ?? "—",
    proxyTarget: pickString(nginx, "proxy_target", "proxyTarget") ?? "—",
  };
}

function mapSsl(record: JsonRecord, apiDomain: string): TenantSsl {
  const ssl = asRecord(record.ssl);
  return {
    provider: pickString(ssl, "provider") ?? "—",
    ready: pickBoolean(ssl, "ready") ?? false,
    domain: pickString(ssl, "domain") ?? apiDomain,
  };
}

function mapCloudflare(record: JsonRecord): TenantCloudflare {
  const cf = asRecord(record.cloudflare);
  return {
    proxyEnabled: pickBoolean(cf, "proxy_enabled", "proxyEnabled") ?? false,
    smokePassed: pickBoolean(cf, "smoke_passed", "smokePassed") ?? false,
    sslModeExpected:
      pickString(cf, "ssl_mode_expected", "sslModeExpected") ?? "full",
  };
}

function mapApiHealth(record: JsonRecord): TenantApiHealth {
  const health = asRecord(record.api_health ?? record.apiHealth);
  return {
    httpsStatus: pickNumber(health, "https_status", "httpsStatus") ?? 0,
    serverHeader: pickString(health, "server_header", "serverHeader") ?? "—",
    httpRedirect: pickBoolean(health, "http_redirect", "httpRedirect") ?? false,
    noCloudflareErrors:
      pickBoolean(health, "no_cloudflare_errors", "noCloudflareErrors") ?? false,
  };
}

function mapFrontend(record: JsonRecord, frontendDomain: string): TenantFrontend {
  const frontend = asRecord(record.frontend);
  return {
    domain: pickString(frontend, "domain") ?? frontendDomain,
    opens: pickBoolean(frontend, "opens") ?? false,
    loginVisible: pickBoolean(frontend, "login_visible", "loginVisible") ?? false,
    brandingStatus: asBrandingStatus(
      pickString(frontend, "branding_status", "brandingStatus"),
    ),
    note: pickString(frontend, "note"),
  };
}

function mapHealthChecks(raw: unknown): TenantHealthCheck[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => {
    const record = asRecord(item);
    return {
      id: pickString(record, "id") ?? `check-${index}`,
      label: pickString(record, "label") ?? "—",
      status: asCheckStatus(record.status, "unknown"),
      detail: pickString(record, "detail"),
    };
  });
}

function mapOperationRun(record: JsonRecord, tenantCodeFallback?: string): TenantOperationRun {
  const tenantCode =
    pickString(record, "tenant_code", "tenantCode") ?? tenantCodeFallback ?? "—";
  return {
    id: pickString(record, "id") ?? `run-${tenantCode}-${Date.now()}`,
    tenantCode,
    operationType:
      (pickString(record, "operation_type", "operationType") as OperationType | string) ??
      "run_backend_smoke",
    title: pickString(record, "title", "action", "name") ?? "—",
    result: asCheckStatus(record.result ?? record.status, "unknown"),
    startedAt: pickString(record, "started_at", "startedAt", "date"),
    finishedAt: pickString(record, "finished_at", "finishedAt"),
    actor: pickString(record, "actor") ?? "platform-operator",
    riskLevel: asRiskLevel(record.risk_level ?? record.risk ?? record.riskLevel),
    simulated: pickBoolean(record, "simulated") ?? true,
    notes: pickString(record, "notes"),
  };
}

/** Map a single Odoo tenant payload into the internal Tenant aggregate. */
export function mapOdooTenant(raw: unknown): Tenant | null {
  const record = asRecord(raw);
  const code = pickString(record, "code", "tenant_code", "tenantCode");
  if (!code) return null;

  const name = pickString(record, "name", "school_name", "schoolName") ?? code;
  const frontendDomain =
    pickString(record, "frontend_domain", "frontendDomain") ?? `${code}.raqeem.ma`;
  const apiDomain =
    pickString(record, "api_domain", "apiDomain") ?? `api-${code}.raqeem.ma`;

  const operationRunsRaw = record.operation_runs ?? record.operationRuns;
  const warningsRaw = record.warnings;

  return {
    code,
    name,
    frontendDomain,
    apiDomain,
    overallStatus: asOverallStatus(
      record.overall_status ?? record.overallStatus,
      "provisioning",
    ),
    identity: mapIdentity(record, code, name),
    infrastructure: mapInfrastructure(record),
    database: mapDatabase(record),
    odoo: mapOdoo(record, apiDomain),
    nginx: mapNginx(record),
    ssl: mapSsl(record, apiDomain),
    cloudflare: mapCloudflare(record),
    apiHealth: mapApiHealth(record),
    frontend: mapFrontend(record, frontendDomain),
    healthChecks: mapHealthChecks(record.health_checks ?? record.healthChecks),
    lifecycle: mapLifecycle(record.lifecycle),
    warnings: Array.isArray(warningsRaw)
      ? warningsRaw.filter((w): w is string => typeof w === "string")
      : [],
    operationRuns: Array.isArray(operationRunsRaw)
      ? operationRunsRaw
          .map((run) => mapOperationRun(asRecord(run), code))
      : [],
  };
}

export function mapOdooTenants(body: unknown): Tenant[] {
  return unwrapPayload(body)
    .map((item) => mapOdooTenant(item))
    .filter((tenant): tenant is Tenant => tenant !== null);
}

export function mapOdooDomain(raw: unknown): TenantDomain | null {
  const record = asRecord(raw);
  const domain = pickString(record, "domain");
  const tenantCode = pickString(record, "tenant_code", "tenantCode");
  if (!domain || !tenantCode) return null;

  const typeRaw = pickString(record, "type");
  const type: TenantDomain["type"] = typeRaw === "frontend" ? "frontend" : "api";

  return {
    domain,
    tenantCode,
    type,
    target: pickString(record, "target") ?? "—",
    dnsStatus: asCheckStatus(record.dns_status ?? record.dnsStatus, "unknown"),
    sslStatus: asCheckStatus(record.ssl_status ?? record.sslStatus, "unknown"),
    proxyStatus: asCheckStatus(record.proxy_status ?? record.proxyStatus, "unknown"),
    lastSmoke: asCheckStatus(record.last_smoke ?? record.lastSmoke, "unknown"),
  };
}

export function mapOdooDomains(body: unknown): TenantDomain[] {
  return unwrapPayload(body)
    .map((item) => mapOdooDomain(item))
    .filter((domain): domain is TenantDomain => domain !== null);
}

export function mapOdooOperation(raw: unknown): TenantOperation | null {
  const record = asRecord(raw);
  const type = pickString(record, "type", "operation_type", "operationType") as
    | OperationType
    | undefined;
  if (!type) return null;

  const preconditions = record.preconditions;
  const manualSteps = record.manual_steps ?? record.manualSteps;
  const forbiddenActions = record.forbidden_actions ?? record.forbiddenActions;

  return {
    type,
    title: pickString(record, "title", "name") ?? type,
    description: pickString(record, "description") ?? "—",
    riskLevel: asRiskLevel(record.risk_level ?? record.riskLevel),
    preconditions: Array.isArray(preconditions)
      ? preconditions.filter((p): p is string => typeof p === "string")
      : [],
    expectedResult:
      pickString(record, "expected_result", "expectedResult") ?? "—",
    manualSteps: Array.isArray(manualSteps)
      ? manualSteps.filter((s): s is string => typeof s === "string")
      : [],
    forbiddenActions: Array.isArray(forbiddenActions)
      ? forbiddenActions.filter((a): a is string => typeof a === "string")
      : [],
    isDryRunOnly: pickBoolean(record, "is_dry_run_only", "isDryRunOnly") ?? true,
    advancesStage: pickString(record, "advances_stage", "advancesStage") as
      | TenantLifecycleStage
      | undefined,
    isExternalLink: pickBoolean(record, "is_external_link", "isExternalLink"),
  };
}

export function mapOdooOperations(body: unknown): TenantOperation[] {
  return unwrapPayload(body)
    .map((item) => mapOdooOperation(item))
    .filter((op): op is TenantOperation => op !== null);
}

export function mapOdooOperationRuns(body: unknown): TenantOperationRun[] {
  return unwrapPayload(body).map((item) => mapOperationRun(asRecord(item)));
}

export function mapOdooAuditEntry(raw: unknown): AuditLogEntry | null {
  const record = asRecord(raw);
  const id = pickString(record, "id");
  const tenantCode = pickString(record, "tenant_code", "tenantCode");
  if (!id || !tenantCode) return null;

  return {
    id,
    date: pickString(record, "date", "started_at", "startedAt", "finished_at", "finishedAt"),
    tenantCode,
    actor: pickString(record, "actor") ?? "platform-operator",
    action: pickString(record, "action", "title", "name") ?? "—",
    result: asCheckStatus(record.result ?? record.status, "unknown"),
    risk: asRiskLevel(record.risk ?? record.risk_level ?? record.riskLevel),
    notes: pickString(record, "notes"),
  };
}

export function mapOdooAuditLogs(body: unknown): AuditLogEntry[] {
  return unwrapPayload(body)
    .map((item) => mapOdooAuditEntry(item))
    .filter((entry): entry is AuditLogEntry => entry !== null);
}
