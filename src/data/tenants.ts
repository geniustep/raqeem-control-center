/**
 * Seed / mock tenant data.
 *
 * Reflects the *current, real* state of the Raqeem project as known today,
 * with `alwah` as the richest example. NO secrets are included anywhere — any
 * sensitive value is replaced by a status flag or the literal placeholder
 * "configured outside control center".
 */

import type {
  LifecycleState,
  Tenant,
  TenantLifecycleStage,
  TenantOperationRun,
} from "@/types";
import { LIFECYCLE_ORDER } from "@/lib/i18n";

/** Build a full ordered lifecycle array from a partial status map. */
function lifecycle(
  map: Partial<Record<TenantLifecycleStage, LifecycleState["status"]>>,
): LifecycleState[] {
  return LIFECYCLE_ORDER.map((stage) => ({
    stage,
    status: map[stage] ?? "pending",
  }));
}

// ---------------------------------------------------------------------------
// alwah — real, in-progress example (live with school-data pending)
// ---------------------------------------------------------------------------

type RawRun = Pick<
  TenantOperationRun,
  "id" | "operationType" | "title" | "riskLevel" | "startedAt" | "finishedAt" | "notes"
>;

const alwahRuns: TenantOperationRun[] = ([
  {
    id: "RAQEEM_ALWAH_DATA_SERVER_BASELINE_COMPLETED",
    operationType: "prepare_database",
    title: "تهيئة خط الأساس لخادم البيانات",
    riskLevel: "medium",
    startedAt: "2026-06-20T08:10:00Z",
    finishedAt: "2026-06-20T08:24:00Z",
  },
  {
    id: "RAQEEM_ALWAH_DATA_SERVER_POSTGRES_LISTENING_FOR_RAQEEM_APP_PG_HBA_DEFERRED",
    operationType: "prepare_database",
    title: "PostgreSQL يستمع لخادم التطبيق (pg_hba مؤجّل)",
    riskLevel: "medium",
    startedAt: "2026-06-20T09:02:00Z",
    finishedAt: "2026-06-20T09:09:00Z",
  },
  {
    id: "RAQEEM_APP_SERVER_TO_ALWAH_POSTGRES_TCP_REACHABLE",
    operationType: "run_backend_smoke",
    title: "اتصال TCP من خادم التطبيق إلى PostgreSQL ناجح",
    riskLevel: "low",
    startedAt: "2026-06-20T09:20:00Z",
    finishedAt: "2026-06-20T09:21:00Z",
  },
  {
    id: "RAQEEM_ALWAH_POSTGRES_DB_USER_AND_PG_HBA_READY",
    operationType: "prepare_database",
    title: "مستخدم قاعدة البيانات وقواعد pg_hba جاهزة",
    riskLevel: "medium",
    startedAt: "2026-06-20T10:05:00Z",
    finishedAt: "2026-06-20T10:18:00Z",
  },
  {
    id: "RAQEEM_APP_SERVER_TO_ALWAH_POSTGRES_LOGIN_SMOKE_PASSED",
    operationType: "run_backend_smoke",
    title: "فحص تسجيل الدخول إلى PostgreSQL ناجح",
    riskLevel: "low",
    startedAt: "2026-06-20T10:30:00Z",
    finishedAt: "2026-06-20T10:31:00Z",
  },
  {
    id: "RAQEEM_APP_SERVER_ALWAH_DB_SECRET_PERMISSIONS_FIXED",
    operationType: "prepare_database",
    title: "ضبط صلاحيات ملف سر قاعدة البيانات",
    riskLevel: "medium",
    startedAt: "2026-06-21T07:45:00Z",
    finishedAt: "2026-06-21T07:50:00Z",
    notes: "configured outside control center",
  },
  {
    id: "RAQEEM_APP_SERVER_ALWAH_ODOO_CONFIG_PREPARED",
    operationType: "install_odoo_base",
    title: "تجهيز إعداد Odoo",
    riskLevel: "medium",
    startedAt: "2026-06-21T08:30:00Z",
    finishedAt: "2026-06-21T08:42:00Z",
  },
  {
    id: "RAQEEM_APP_SERVER_ALWAH_ODOO_CONFIG_READINESS_SMOKE_PASSED",
    operationType: "run_backend_smoke",
    title: "فحص جاهزية إعداد Odoo ناجح",
    riskLevel: "low",
    startedAt: "2026-06-21T08:55:00Z",
    finishedAt: "2026-06-21T08:56:00Z",
  },
  {
    id: "RAQEEM_APP_SERVER_ALWAH_ODOO_BASE_INIT_COMPLETED",
    operationType: "install_odoo_base",
    title: "اكتمال التهيئة الأساسية لـ Odoo",
    riskLevel: "medium",
    startedAt: "2026-06-21T09:20:00Z",
    finishedAt: "2026-06-21T09:58:00Z",
  },
  {
    id: "RAQEEM_APP_SERVER_SMART_SCHOOL_CONNECT_UPDATED_TO_LATEST",
    operationType: "install_smart_school_connect",
    title: "تحديث smart_school_connect إلى أحدث إصدار",
    riskLevel: "medium",
    startedAt: "2026-06-22T07:30:00Z",
    finishedAt: "2026-06-22T07:38:00Z",
  },
  {
    id: "RAQEEM_APP_SERVER_ALWAH_SMART_SCHOOL_CONNECT_INSTALLED",
    operationType: "install_smart_school_connect",
    title: "تثبيت smart_school_connect",
    riskLevel: "medium",
    startedAt: "2026-06-22T08:05:00Z",
    finishedAt: "2026-06-22T08:31:00Z",
  },
  {
    id: "RAQEEM_ALWAH_POSTGRES_ODOO_SERVICE_COMPAT_PG_HBA_READY",
    operationType: "create_odoo_service",
    title: "توافق pg_hba مع خدمة Odoo جاهز",
    riskLevel: "medium",
    startedAt: "2026-06-22T09:10:00Z",
    finishedAt: "2026-06-22T09:17:00Z",
  },
  {
    id: "RAQEEM_APP_SERVER_ALWAH_AND_POSTGRES_LOGIN_SMOKE_PASSED",
    operationType: "run_backend_smoke",
    title: "فحص تسجيل الدخول (التطبيق + PostgreSQL) ناجح",
    riskLevel: "low",
    startedAt: "2026-06-22T09:30:00Z",
    finishedAt: "2026-06-22T09:31:00Z",
  },
  {
    id: "RAQEEM_APP_SERVER_ALWAH_ODOO_SYSTEMD_SERVICE_ACTIVE_LOCAL_ONLY",
    operationType: "create_odoo_service",
    title: "خدمة systemd لـ Odoo نشطة (محلي فقط)",
    riskLevel: "medium",
    startedAt: "2026-06-23T07:40:00Z",
    finishedAt: "2026-06-23T07:49:00Z",
  },
  {
    id: "RAQEEM_APP_SERVER_ALWAH_NGINX_SSL_READY",
    operationType: "setup_nginx_ssl",
    title: "Nginx وSSL جاهزان لنطاق الـ API",
    riskLevel: "medium",
    startedAt: "2026-06-23T08:20:00Z",
    finishedAt: "2026-06-23T08:46:00Z",
  },
  {
    id: "RAQEEM_ALWAH_CLOUDFLARE_PROXY_ENABLED_AND_SMOKE_PASSED",
    operationType: "enable_cloudflare_proxy",
    title: "تفعيل Cloudflare Proxy ونجاح الفحص",
    riskLevel: "high",
    startedAt: "2026-06-23T09:15:00Z",
    finishedAt: "2026-06-23T09:22:00Z",
  },
] satisfies RawRun[]).map((r) => ({
  ...r,
  tenantCode: "alwah",
  actor: "platform-operator",
  result: "passed" as const,
  simulated: false,
}));

const alwah: Tenant = {
  code: "alwah",
  name: "مدارس ألواح",
  frontendDomain: "alwah.raqeem.ma",
  apiDomain: "api-alwah.raqeem.ma",
  overallStatus: "live_with_warnings",
  identity: {
    schoolName: "مدارس ألواح",
    tenantCode: "alwah",
    academicYear: "2025-2026",
    language: "ar",
    timezone: "Africa/Casablanca",
    currency: "MAD",
    brandingStatus: "missing",
    brandingUrl: "https://alwah.raqeem.ma/admin/settings/school-branding",
  },
  infrastructure: {
    appServer: "raqeem-prod-app-1",
    appServerPrivateIp: "10.114.0.8",
    appServerPublicIp: "164.92.199.180",
    dataServer: "raqeem-alwah",
    dataServerPrivateIp: "10.114.0.4",
    dbHost: "10.114.0.4",
    dbName: "alwah",
    dbUser: "odoo_alwah",
    odooLocalPort: "8079",
    serviceName: "odoo-alwah.service",
  },
  database: {
    reachable: true,
    host: "10.114.0.4",
    port: "5432",
    dbName: "alwah",
    dbUser: "odoo_alwah",
    pgHbaRules: [
      "host alwah odoo_alwah 10.114.0.8/32 scram-sha-256",
      "host postgres odoo_alwah 10.114.0.8/32 scram-sha-256",
    ],
    pgHbaStatus: "passed",
    tableCount: 557,
    schoolTables: 199,
    modulesInstalled: true,
    lastSmokeResult: "passed",
  },
  odoo: {
    serviceName: "odoo-alwah.service",
    active: true,
    enabled: true,
    localUrl: "http://127.0.0.1:8079",
    localPort: "8079",
    localOnly: true,
    baseInstalled: true,
    backendDomain: "api-alwah.raqeem.ma",
    smartSchoolConnectInstalled: true,
    smartSchoolConnectVersion: "18.0.1.0.151",
    smartSchoolConnectCommit: "980ab1f66ca58165f88580bc380cb186e5151d50",
    modulesState: "passed",
  },
  nginx: {
    active: true,
    sitePath: "/etc/nginx/sites-available/api-alwah.raqeem.ma",
    proxyTarget: "127.0.0.1:8079",
  },
  ssl: {
    provider: "Let's Encrypt",
    ready: true,
    domain: "api-alwah.raqeem.ma",
  },
  cloudflare: {
    proxyEnabled: true,
    smokePassed: true,
    sslModeExpected: "Full (strict)",
  },
  apiHealth: {
    httpsStatus: 200,
    serverHeader: "cloudflare",
    httpRedirect: true,
    noCloudflareErrors: true,
  },
  frontend: {
    domain: "alwah.raqeem.ma",
    opens: true,
    loginVisible: true,
    brandingStatus: "missing",
    note: 'الواجهة تفتح لكنها تعرض هوية افتراضية مثل "مدرستكم" و"2025-2026"',
  },
  healthChecks: [
    { id: "api_https", label: "فحص HTTPS للـ API", status: "passed", detail: "HTTP 200 عبر Cloudflare" },
    { id: "http_redirect", label: "إعادة توجيه HTTP→HTTPS", status: "passed" },
    { id: "frontend_opens", label: "الواجهة تفتح", status: "passed", detail: "شاشة الدخول ظاهرة" },
    { id: "tenant_resolver", label: "محلّل الـ Tenant", status: "passed" },
    { id: "db_login", label: "تسجيل الدخول لقاعدة البيانات", status: "passed" },
    { id: "odoo_local_only", label: "منفذ Odoo غير عام", status: "passed", detail: "مرتبط بـ 127.0.0.1 فقط" },
    { id: "nginx_active", label: "Nginx نشط", status: "passed" },
    { id: "service_active", label: "خدمة Odoo نشطة", status: "passed" },
    { id: "branding", label: "هوية المدرسة", status: "warning", detail: "هوية افتراضية (fallback) — لم تُكمل بعد" },
  ],
  lifecycle: lifecycle({
    draft: "done",
    dns_ready: "done",
    database_ready: "done",
    odoo_base_ready: "done",
    module_installed: "done",
    service_active: "done",
    ssl_ready: "done",
    proxy_ready: "done",
    frontend_ready: "warning",
    school_data_ready: "pending",
    live: "warning",
  }),
  // Warnings are derived at runtime in getTenantWarnings() (Arabic, branding-only).
  warnings: [],
  operationRuns: alwahRuns,
};

// ---------------------------------------------------------------------------
// nibras — pre-existing, separate backend, branding worked
// ---------------------------------------------------------------------------

const nibras: Tenant = {
  code: "nibras",
  name: "مدارس النبراس",
  frontendDomain: "nibras.raqeem.ma",
  apiDomain: "api-nibras.raqeem.ma",
  overallStatus: "live",
  identity: {
    schoolName: "مدارس النبراس",
    tenantCode: "nibras",
    academicYear: "2025-2026",
    language: "ar",
    timezone: "Africa/Casablanca",
    currency: "MAD",
    brandingStatus: "configured",
    brandingUrl: "https://nibras.raqeem.ma/admin/settings/school-branding",
  },
  infrastructure: {
    appServer: "raqeem-prod-app-1",
    appServerPrivateIp: "10.114.0.8",
    appServerPublicIp: "164.92.199.180",
    dataServer: "raqeem-nibras",
    dataServerPrivateIp: "configured outside control center",
    dbHost: "configured outside control center",
    dbName: "nibras",
    dbUser: "odoo_nibras",
    odooLocalPort: "8078",
    serviceName: "odoo-nibras.service",
  },
  database: {
    reachable: true,
    host: "configured outside control center",
    port: "5432",
    dbName: "nibras",
    dbUser: "odoo_nibras",
    pgHbaRules: ["configured outside control center"],
    pgHbaStatus: "passed",
    tableCount: 560,
    schoolTables: 201,
    modulesInstalled: true,
    lastSmokeResult: "passed",
  },
  odoo: {
    serviceName: "odoo-nibras.service",
    active: true,
    enabled: true,
    localUrl: "http://127.0.0.1:8078",
    localPort: "8078",
    localOnly: true,
    baseInstalled: true,
    backendDomain: "api-nibras.raqeem.ma",
    smartSchoolConnectInstalled: true,
    smartSchoolConnectVersion: "18.0.1.0.151",
    smartSchoolConnectCommit: "configured outside control center",
    modulesState: "passed",
  },
  nginx: {
    active: true,
    sitePath: "/etc/nginx/sites-available/api-nibras.raqeem.ma",
    proxyTarget: "127.0.0.1:8078",
  },
  ssl: { provider: "Let's Encrypt", ready: true, domain: "api-nibras.raqeem.ma" },
  cloudflare: { proxyEnabled: true, smokePassed: true, sslModeExpected: "Full (strict)" },
  apiHealth: { httpsStatus: 200, serverHeader: "cloudflare", httpRedirect: true, noCloudflareErrors: true },
  frontend: {
    domain: "nibras.raqeem.ma",
    opens: true,
    loginVisible: true,
    brandingStatus: "configured",
  },
  healthChecks: [
    { id: "api_https", label: "فحص HTTPS للـ API", status: "passed" },
    { id: "http_redirect", label: "إعادة توجيه HTTP→HTTPS", status: "passed" },
    { id: "frontend_opens", label: "الواجهة تفتح", status: "passed" },
    { id: "tenant_resolver", label: "محلّل الـ Tenant", status: "passed" },
    { id: "db_login", label: "تسجيل الدخول لقاعدة البيانات", status: "passed" },
    { id: "odoo_local_only", label: "منفذ Odoo غير عام", status: "passed" },
    { id: "nginx_active", label: "Nginx نشط", status: "passed" },
    { id: "service_active", label: "خدمة Odoo نشطة", status: "passed" },
    { id: "branding", label: "هوية المدرسة", status: "passed" },
  ],
  lifecycle: lifecycle({
    draft: "done",
    dns_ready: "done",
    database_ready: "done",
    odoo_base_ready: "done",
    module_installed: "done",
    service_active: "done",
    ssl_ready: "done",
    proxy_ready: "done",
    frontend_ready: "done",
    school_data_ready: "done",
    live: "done",
  }),
  warnings: [],
  operationRuns: [
    {
      id: "RAQEEM_NIBRAS_PLATFORM_LIVE_BASELINE",
      tenantCode: "nibras",
      operationType: "run_frontend_smoke",
      title: "فحص شامل: المدرسة مباشرة وتعمل",
      riskLevel: "low",
      startedAt: "2026-05-10T09:00:00Z",
      finishedAt: "2026-05-10T09:03:00Z",
      actor: "platform-operator",
      result: "passed",
      simulated: false,
      notes: "موجود سابقًا — backend منفصل، الهوية تعمل",
    },
  ],
};

// ---------------------------------------------------------------------------
// school — primary production tenant (do not confuse with alwah)
// ---------------------------------------------------------------------------

const school: Tenant = {
  code: "school",
  name: "Raqeem School / Production School",
  frontendDomain: "school.raqeem.ma",
  apiDomain: "api-school.raqeem.ma",
  overallStatus: "live",
  identity: {
    schoolName: "Raqeem School / Production School",
    tenantCode: "school",
    academicYear: "2025-2026",
    language: "ar",
    timezone: "Africa/Casablanca",
    currency: "MAD",
    brandingStatus: "configured",
    brandingUrl: "https://school.raqeem.ma/admin/settings/school-branding",
  },
  infrastructure: {
    appServer: "raqeem-prod-app-1",
    appServerPrivateIp: "10.114.0.8",
    appServerPublicIp: "164.92.199.180",
    dataServer: "raqeem-school",
    dataServerPrivateIp: "configured outside control center",
    dbHost: "configured outside control center",
    dbName: "school",
    dbUser: "odoo_school",
    odooLocalPort: "8077",
    serviceName: "odoo-school.service",
  },
  database: {
    reachable: true,
    host: "configured outside control center",
    port: "5432",
    dbName: "school",
    dbUser: "odoo_school",
    pgHbaRules: ["configured outside control center"],
    pgHbaStatus: "passed",
    tableCount: 562,
    schoolTables: 203,
    modulesInstalled: true,
    lastSmokeResult: "passed",
  },
  odoo: {
    serviceName: "odoo-school.service",
    active: true,
    enabled: true,
    localUrl: "http://127.0.0.1:8077",
    localPort: "8077",
    localOnly: true,
    baseInstalled: true,
    backendDomain: "api-school.raqeem.ma",
    smartSchoolConnectInstalled: true,
    smartSchoolConnectVersion: "18.0.1.0.151",
    smartSchoolConnectCommit: "configured outside control center",
    modulesState: "passed",
  },
  nginx: {
    active: true,
    sitePath: "/etc/nginx/sites-available/api-school.raqeem.ma",
    proxyTarget: "127.0.0.1:8077",
  },
  ssl: { provider: "Let's Encrypt", ready: true, domain: "api-school.raqeem.ma" },
  cloudflare: { proxyEnabled: true, smokePassed: true, sslModeExpected: "Full (strict)" },
  apiHealth: { httpsStatus: 200, serverHeader: "cloudflare", httpRedirect: true, noCloudflareErrors: true },
  frontend: {
    domain: "school.raqeem.ma",
    opens: true,
    loginVisible: true,
    brandingStatus: "configured",
  },
  healthChecks: [
    { id: "api_https", label: "فحص HTTPS للـ API", status: "passed" },
    { id: "http_redirect", label: "إعادة توجيه HTTP→HTTPS", status: "passed" },
    { id: "frontend_opens", label: "الواجهة تفتح", status: "passed" },
    { id: "tenant_resolver", label: "محلّل الـ Tenant", status: "passed" },
    { id: "db_login", label: "تسجيل الدخول لقاعدة البيانات", status: "passed" },
    { id: "odoo_local_only", label: "منفذ Odoo غير عام", status: "passed" },
    { id: "nginx_active", label: "Nginx نشط", status: "passed" },
    { id: "service_active", label: "خدمة Odoo نشطة", status: "passed" },
    { id: "branding", label: "هوية المدرسة", status: "passed" },
  ],
  lifecycle: lifecycle({
    draft: "done",
    dns_ready: "done",
    database_ready: "done",
    odoo_base_ready: "done",
    module_installed: "done",
    service_active: "done",
    ssl_ready: "done",
    proxy_ready: "done",
    frontend_ready: "done",
    school_data_ready: "done",
    live: "done",
  }),
  warnings: [],
  operationRuns: [
    {
      id: "RAQEEM_SCHOOL_PRODUCTION_LIVE_BASELINE",
      tenantCode: "school",
      operationType: "run_frontend_smoke",
      title: "فحص شامل: مدرسة الإنتاج الأساسية مباشرة",
      riskLevel: "low",
      startedAt: "2026-04-02T09:00:00Z",
      finishedAt: "2026-04-02T09:04:00Z",
      actor: "platform-operator",
      result: "passed",
      simulated: false,
      notes: "tenant الإنتاج الأساسي — لا يُخلط مع alwah",
    },
  ],
};

// ---------------------------------------------------------------------------
// Exports + selectors
// ---------------------------------------------------------------------------

export const tenants: Tenant[] = [alwah, nibras, school];

export function getTenantByCode(code: string): Tenant | undefined {
  return tenants.find((tn) => tn.code === code);
}

export function getAllTenantCodes(): string[] {
  return tenants.map((tn) => tn.code);
}
