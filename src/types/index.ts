/**
 * Raqeem Control Center — domain types.
 *
 * These types model the *control plane* view of a hosted school (a "Tenant").
 * They intentionally describe state only. No secrets, passwords, tokens or
 * private keys are ever modelled here — anything sensitive is represented as
 * a status flag or the literal placeholder "configured outside control center".
 */

// ---------------------------------------------------------------------------
// Core enums / unions
// ---------------------------------------------------------------------------

/** Ordered lifecycle stages a tenant moves through, from draft to live. */
export type TenantLifecycleStage =
  | "draft"
  | "dns_ready"
  | "database_ready"
  | "odoo_base_ready"
  | "module_installed"
  | "service_active"
  | "ssl_ready"
  | "proxy_ready"
  | "frontend_ready"
  | "school_data_ready"
  | "live";

/** Per-stage rendering state on the lifecycle timeline. */
export type LifecycleStageStatus =
  | "done"
  | "current"
  | "warning"
  | "blocked"
  | "pending";

/** Result of a health check or a smoke test. */
export type CheckStatus =
  | "passed"
  | "warning"
  | "failed"
  | "pending"
  | "recorded"
  | "unknown"
  | "not_configured";

/** Whether an operation can be run from the control center (Phase 1: simulated). */
export type OperationStatus =
  | "available"
  | "blocked"
  | "completed"
  | "manual_required"
  | "disabled";

/** Aggregated, human-facing status of a tenant. */
export type TenantOverallStatus =
  | "draft"
  | "provisioning"
  | "live"
  | "live_with_warnings"
  | "blocked"
  | "maintenance";

/** Risk classification used by the operation catalog and audit logs. */
export type RiskLevel = "low" | "medium" | "high";

/** Branding (logo / colors / slogan) is managed inside the school app itself. */
export type BrandingStatus = "missing" | "configured";

/** Canonical operation identifiers handled by the control center. */
export type OperationType =
  | "prepare_database"
  | "install_odoo_base"
  | "install_smart_school_connect"
  | "create_odoo_service"
  | "setup_nginx_ssl"
  | "enable_cloudflare_proxy"
  | "run_backend_smoke"
  | "run_frontend_smoke"
  | "bootstrap_school_profile"
  | "open_branding_settings";

// ---------------------------------------------------------------------------
// Tenant sub-structures
// ---------------------------------------------------------------------------

export interface TenantIdentity {
  schoolName: string;
  tenantCode: string;
  academicYear: string;
  /** Default UI language for the school front-end, e.g. "ar". */
  language: string;
  timezone: string;
  currency: string;
  brandingStatus: BrandingStatus;
  /**
   * Deep link to the school's own branding settings page.
   * Branding is NOT edited here — only its status is surfaced.
   */
  brandingUrl: string;
}

export interface TenantInfrastructure {
  appServer: string;
  appServerPrivateIp: string;
  appServerPublicIp: string;
  dataServer: string;
  dataServerPrivateIp: string;
  dbHost: string;
  dbName: string;
  /** Database role/user. Never accompanied by a password. */
  dbUser: string;
  odooLocalPort: string;
  serviceName: string;
}

export interface TenantDatabase {
  reachable: boolean;
  host: string;
  port: string;
  dbName: string;
  dbUser: string;
  /** Sanitised pg_hba lines (no credentials). */
  pgHbaRules: string[];
  pgHbaStatus: CheckStatus;
  tableCount: number;
  schoolTables: number;
  modulesInstalled: boolean;
  lastSmokeResult: CheckStatus;
}

export interface TenantOdoo {
  serviceName: string;
  active: boolean;
  enabled: boolean;
  localUrl: string;
  localPort: string;
  /** True when the Odoo port is bound to localhost only (not publicly exposed). */
  localOnly: boolean;
  baseInstalled: boolean;
  backendDomain: string;
  smartSchoolConnectInstalled: boolean;
  smartSchoolConnectVersion: string;
  smartSchoolConnectCommit: string;
  modulesState: CheckStatus;
}

export interface TenantNginx {
  active: boolean;
  sitePath: string;
  proxyTarget: string;
}

export interface TenantSsl {
  provider: string;
  ready: boolean;
  domain: string;
}

export interface TenantCloudflare {
  proxyEnabled: boolean;
  smokePassed: boolean;
  sslModeExpected: string;
}

export interface TenantApiHealth {
  httpsStatus: number;
  serverHeader: string;
  httpRedirect: boolean;
  noCloudflareErrors: boolean;
}

export interface TenantFrontend {
  domain: string;
  opens: boolean;
  loginVisible: boolean;
  brandingStatus: BrandingStatus;
  note?: string;
}

/** A single named health/smoke check shown on the tenant detail page. */
export interface TenantHealthCheck {
  id: string;
  label: string;
  status: CheckStatus;
  detail?: string;
}

/** One lifecycle stage paired with its current render state. */
export interface LifecycleState {
  stage: TenantLifecycleStage;
  status: LifecycleStageStatus;
}

/** A domain row (frontend or api), used by both tenant detail and /domains. */
export interface TenantDomain {
  domain: string;
  tenantCode: string;
  type: "api" | "frontend";
  /** Origin / proxy target this domain points to. */
  target: string;
  dnsStatus: CheckStatus;
  sslStatus: CheckStatus;
  proxyStatus: CheckStatus;
  lastSmoke: CheckStatus;
}

// ---------------------------------------------------------------------------
// Operations & audit
// ---------------------------------------------------------------------------

/** Static catalog definition of an operation (what it does, its guardrails). */
export interface TenantOperation {
  type: OperationType;
  title: string;
  description: string;
  riskLevel: RiskLevel;
  preconditions: string[];
  expectedResult: string;
  manualSteps: string[];
  forbiddenActions: string[];
  /** Phase 1: every operation is dry-run only. */
  isDryRunOnly: boolean;
  /** Lifecycle stage this operation is responsible for advancing, if any. */
  advancesStage?: TenantLifecycleStage;
  /** When true the action opens an external page instead of executing here. */
  isExternalLink?: boolean;
}

/** A recorded (or simulated) execution of an operation against a tenant. */
export interface TenantOperationRun {
  id: string;
  tenantCode: string;
  operationType: OperationType | string;
  title: string;
  result: CheckStatus;
  startedAt?: string;
  finishedAt?: string;
  actor: string;
  riskLevel: RiskLevel;
  /** Whether this was a real run or a simulated/dry-run record. */
  simulated: boolean;
  notes?: string;
}

export interface AuditLogEntry {
  id: string;
  date?: string;
  tenantCode: string;
  actor: string;
  action: string;
  result: CheckStatus;
  risk: RiskLevel;
  notes?: string;
}

// ---------------------------------------------------------------------------
// The Tenant aggregate
// ---------------------------------------------------------------------------

export interface Tenant {
  code: string;
  name: string;
  frontendDomain: string;
  apiDomain: string;
  /**
   * Seed/declared overall status. The UI prefers the *derived* value from
   * `deriveTenantOverallStatus`, keeping this as a fallback/baseline.
   */
  overallStatus: TenantOverallStatus;
  identity: TenantIdentity;
  infrastructure: TenantInfrastructure;
  database: TenantDatabase;
  odoo: TenantOdoo;
  nginx: TenantNginx;
  ssl: TenantSsl;
  cloudflare: TenantCloudflare;
  apiHealth: TenantApiHealth;
  frontend: TenantFrontend;
  healthChecks: TenantHealthCheck[];
  lifecycle: LifecycleState[];
  /** Seed warnings. Derived warnings come from `getTenantWarnings`. */
  warnings: string[];
  operationRuns: TenantOperationRun[];
}

/** Summary metrics rendered on the dashboard. */
export interface PlatformSummary {
  totalTenants: number;
  tenantsWithWarnings: number;
  criticalCount: number;
  sslReady: number;
  proxyReady: number;
  servicesActive: number;
  frontendReady: number;
  backendDbHealthy: number;
  /** True when counts were supplied by Odoo dashboard aggregate. */
  fromOdoo?: boolean;
}
