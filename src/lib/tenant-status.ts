/**
 * Tenant status logic.
 *
 * Status is *derived* from tenant data rather than hard-coded in the UI, so the
 * dashboard, tables and detail pages all agree. These functions are pure and
 * unit-tested in `tenant-status.test.ts`.
 */

import type {
  OperationStatus,
  OperationType,
  PlatformSummary,
  Tenant,
  TenantLifecycleStage,
  TenantOverallStatus,
} from "@/types";
import { LIFECYCLE_ORDER } from "@/lib/i18n";

// ---------------------------------------------------------------------------
// Lifecycle helpers
// ---------------------------------------------------------------------------

/** Read the render status of a given lifecycle stage for a tenant. */
export function getStageStatus(tenant: Tenant, stage: TenantLifecycleStage) {
  return tenant.lifecycle.find((s) => s.stage === stage)?.status ?? "pending";
}

/** True when a stage is fully done. */
export function isStageDone(tenant: Tenant, stage: TenantLifecycleStage): boolean {
  return getStageStatus(tenant, stage) === "done";
}

/** Progress across the lifecycle (done stages / total stages). */
export function getLifecycleProgress(tenant: Tenant): {
  done: number;
  total: number;
  percent: number;
} {
  const total = tenant.lifecycle.length || LIFECYCLE_ORDER.length;
  const done = tenant.lifecycle.filter((s) => s.status === "done").length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { done, total, percent };
}

// ---------------------------------------------------------------------------
// Warnings
// ---------------------------------------------------------------------------

/**
 * Human-readable warnings derived from tenant state. The UI shows these; seed
 * `tenant.warnings` is treated as a baseline and merged in (deduped).
 */
export function getTenantWarnings(tenant: Tenant): string[] {
  const warnings: string[] = [];

  if (tenant.identity.brandingStatus === "missing") {
    warnings.push("بيانات هوية المدرسة (الشعار/الألوان) غير مكتملة بعد");
  }
  if (tenant.frontend.opens && tenant.frontend.brandingStatus === "missing") {
    warnings.push("الواجهة تفتح لكنها لا تزال تعرض هوية افتراضية (fallback)");
  }
  if (!tenant.odoo.active || !tenant.odoo.enabled) {
    warnings.push("خدمة Odoo غير نشطة");
  }
  if (!tenant.nginx.active) {
    warnings.push("خدمة Nginx غير نشطة");
  }
  if (tenant.ssl.ready === false) {
    warnings.push("شهادة SSL غير جاهزة");
  }
  if (tenant.cloudflare.proxyEnabled && !tenant.cloudflare.smokePassed) {
    warnings.push("Cloudflare proxy مفعّل لكن فحص HTTPS فشل");
  }
  if (
    tenant.cloudflare.proxyEnabled &&
    tenant.apiHealth.httpsStatus >= 400
  ) {
    warnings.push(`الـ API يعيد حالة HTTPS ${tenant.apiHealth.httpsStatus}`);
  }
  if (tenant.database.reachable === false) {
    warnings.push("قاعدة البيانات غير قابلة للوصول");
  }

  // Merge any seed warnings that the engine didn't already produce.
  for (const seed of tenant.warnings) {
    if (!warnings.includes(seed)) warnings.push(seed);
  }

  return warnings;
}

// ---------------------------------------------------------------------------
// Overall status
// ---------------------------------------------------------------------------

/**
 * Derive the aggregated tenant status.
 *
 * Rules (highest priority first):
 *  - Odoo service inactive                       -> blocked
 *  - DB unreachable                              -> blocked
 *  - Proxy enabled but HTTPS smoke failed        -> blocked
 *  - SSL not ready                               -> provisioning
 *  - Backend live + frontend opens + warnings    -> live_with_warnings
 *  - Backend live + frontend opens + no warnings -> live
 *  - Otherwise (incomplete lifecycle)            -> provisioning / draft
 */
export function deriveTenantOverallStatus(tenant: Tenant): TenantOverallStatus {
  const { odoo, ssl, cloudflare, apiHealth, frontend, database } = tenant;

  // Hard blockers ----------------------------------------------------------
  if (!odoo.active || !odoo.enabled) return "blocked";
  if (database.reachable === false) return "blocked";
  if (cloudflare.proxyEnabled && !cloudflare.smokePassed) return "blocked";
  if (cloudflare.proxyEnabled && apiHealth.httpsStatus >= 400) return "blocked";

  // Still provisioning -----------------------------------------------------
  if (!ssl.ready) return "provisioning";

  const backendLive =
    ssl.ready &&
    cloudflare.proxyEnabled &&
    cloudflare.smokePassed &&
    apiHealth.httpsStatus === 200;

  const warnings = getTenantWarnings(tenant);

  if (backendLive && frontend.opens) {
    return warnings.length > 0 ? "live_with_warnings" : "live";
  }

  // Some progress but not live yet.
  const progress = getLifecycleProgress(tenant);
  if (progress.done === 0) return "draft";
  return warnings.length > 0 ? "live_with_warnings" : "provisioning";
}

/** A tenant is production-ready only when fully live with zero warnings. */
export function isTenantProductionReady(tenant: Tenant): boolean {
  return (
    deriveTenantOverallStatus(tenant) === "live" &&
    getTenantWarnings(tenant).length === 0 &&
    isStageDone(tenant, "live")
  );
}

// ---------------------------------------------------------------------------
// Operations gating
// ---------------------------------------------------------------------------

/**
 * Decide whether an operation can be run for a tenant.
 *
 * Phase 1 note: this only computes *eligibility*; nothing is ever executed.
 * `open_branding_settings` is always `manual_required` (external link), and
 * `enable_cloudflare_proxy` is `blocked` until SSL is ready (then available
 * early — right after the SSL smoke).
 */
export function canRunOperation(
  tenant: Tenant,
  operationType: OperationType,
): OperationStatus {
  switch (operationType) {
    case "prepare_database":
      return isStageDone(tenant, "database_ready") ? "completed" : "available";

    case "install_odoo_base":
      if (!isStageDone(tenant, "database_ready")) return "blocked";
      return isStageDone(tenant, "odoo_base_ready") ? "completed" : "available";

    case "install_smart_school_connect":
      if (!isStageDone(tenant, "odoo_base_ready")) return "blocked";
      return isStageDone(tenant, "module_installed") ? "completed" : "available";

    case "create_odoo_service":
      if (!isStageDone(tenant, "module_installed")) return "blocked";
      return isStageDone(tenant, "service_active") ? "completed" : "available";

    case "setup_nginx_ssl":
      if (!isStageDone(tenant, "service_active")) return "blocked";
      return isStageDone(tenant, "ssl_ready") ? "completed" : "available";

    case "enable_cloudflare_proxy":
      // Intentionally early: available as soon as SSL is ready.
      if (!isStageDone(tenant, "ssl_ready")) return "blocked";
      return isStageDone(tenant, "proxy_ready") ? "completed" : "available";

    case "run_backend_smoke":
      // Smoke can be re-run any time the service exists.
      return isStageDone(tenant, "service_active") ? "available" : "blocked";

    case "run_frontend_smoke":
      return isStageDone(tenant, "proxy_ready") ? "available" : "blocked";

    case "bootstrap_school_profile":
      if (!isStageDone(tenant, "frontend_ready") &&
          getStageStatus(tenant, "frontend_ready") !== "warning") {
        return "blocked";
      }
      return isStageDone(tenant, "school_data_ready") ? "completed" : "available";

    case "open_branding_settings":
      // Always an external manual action into the school app.
      return "manual_required";

    default:
      return "disabled";
  }
}

/**
 * Recommend the next operations to focus on: the operation owning the first
 * non-done lifecycle stage, plus any "available" follow-ups.
 */
export function getNextRecommendedActions(tenant: Tenant): OperationType[] {
  const stageToOp: Partial<Record<TenantLifecycleStage, OperationType>> = {
    database_ready: "prepare_database",
    odoo_base_ready: "install_odoo_base",
    module_installed: "install_smart_school_connect",
    service_active: "create_odoo_service",
    ssl_ready: "setup_nginx_ssl",
    proxy_ready: "enable_cloudflare_proxy",
    frontend_ready: "run_frontend_smoke",
    school_data_ready: "bootstrap_school_profile",
  };

  const recommendations: OperationType[] = [];

  for (const stage of LIFECYCLE_ORDER) {
    const status = getStageStatus(tenant, stage);
    if (status === "done") continue;
    const op = stageToOp[stage];
    if (op && !recommendations.includes(op)) recommendations.push(op);
    // Branding warning -> recommend opening branding settings.
    if (
      stage === "school_data_ready" &&
      tenant.identity.brandingStatus === "missing"
    ) {
      recommendations.push("open_branding_settings");
    }
    if (recommendations.length >= 3) break;
  }

  return recommendations;
}

// ---------------------------------------------------------------------------
// Platform aggregate
// ---------------------------------------------------------------------------

/** Aggregate dashboard metrics across all tenants (local fallback). */
export function getPlatformSummary(tenants: Tenant[]): PlatformSummary {
  return {
    totalTenants: tenants.length,
    tenantsWithWarnings: tenants.filter(
      (tn) => getTenantWarnings(tn).length > 0,
    ).length,
    criticalCount: tenants.filter(
      (tn) => deriveTenantOverallStatus(tn) === "blocked",
    ).length,
    sslReady: tenants.filter((tn) => tn.ssl.ready).length,
    proxyReady: tenants.filter((tn) => tn.cloudflare.proxyEnabled).length,
    servicesActive: tenants.filter((tn) => tn.odoo.active && tn.odoo.enabled)
      .length,
    frontendReady: tenants.filter((tn) => tn.frontend.opens).length,
    backendDbHealthy: tenants.filter((tn) => tn.database.reachable === true).length,
  };
}

/** Tenants that currently have one or more warnings (for the dashboard list). */
export function getTenantsNeedingAttention(tenants: Tenant[]): Tenant[] {
  return tenants.filter((tn) => {
    const status = deriveTenantOverallStatus(tn);
    return (
      getTenantWarnings(tn).length > 0 ||
      status === "blocked" ||
      status === "provisioning" ||
      status === "maintenance"
    );
  });
}
