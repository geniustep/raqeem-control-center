/**
 * Cross-tenant selectors.
 *
 * Pure functions that flatten / aggregate tenant data into the lists used by
 * the /domains, /operations and /audit pages. Keeping these here means the
 * pages stay thin and the derivations are testable.
 */

import type {
  AuditLogEntry,
  CheckStatus,
  Tenant,
  TenantDomain,
  TenantOperationRun,
} from "@/types";
import { tenants as allTenants } from "@/data/tenants";

/** Flatten every tenant into its api + frontend domain rows. */
export function getAllDomains(list: Tenant[] = allTenants): TenantDomain[] {
  const rows: TenantDomain[] = [];

  for (const tn of list) {
    // API domain (Cloudflare-proxied origin -> Nginx -> local Odoo).
    rows.push({
      domain: tn.apiDomain,
      tenantCode: tn.code,
      type: "api",
      target: tn.nginx.proxyTarget,
      dnsStatus: "passed",
      sslStatus: tn.ssl.ready ? "passed" : "pending",
      proxyStatus: tn.cloudflare.proxyEnabled ? "passed" : "pending",
      lastSmoke: tn.cloudflare.smokePassed
        ? "passed"
        : tn.ssl.ready
          ? "warning"
          : "pending",
    });

    // Frontend domain (school app).
    rows.push({
      domain: tn.frontendDomain,
      tenantCode: tn.code,
      type: "frontend",
      target: "frontend origin (configured outside control center)",
      dnsStatus: "passed",
      sslStatus: "passed",
      proxyStatus: "passed",
      lastSmoke: !tn.frontend.opens
        ? "pending"
        : tn.frontend.brandingStatus === "missing"
          ? "warning"
          : "passed",
    });
  }

  return rows;
}

/** All operation runs across tenants, newest first. */
export function getAllOperationRuns(
  list: Tenant[] = allTenants,
): TenantOperationRun[] {
  return list
    .flatMap((tn) => tn.operationRuns)
    .sort((a, b) => timeOf(b) - timeOf(a));
}

/** The N most recent operation runs (for the dashboard). */
export function getRecentOperationRuns(
  n = 6,
  list: Tenant[] = allTenants,
): TenantOperationRun[] {
  return getAllOperationRuns(list).slice(0, n);
}

/** Build the audit log timeline from operation runs, newest first. */
export function getAuditLog(list: Tenant[] = allTenants): AuditLogEntry[] {
  return getAllOperationRuns(list).map((run) => ({
    id: run.id,
    date: run.finishedAt ?? run.startedAt,
    tenantCode: run.tenantCode,
    actor: run.actor,
    action: run.title,
    result: run.result as CheckStatus,
    risk: run.riskLevel,
    notes: run.simulated ? "تقرير محاكاة (Dry-run)" : run.notes,
  }));
}

function timeOf(run: TenantOperationRun): number {
  return new Date(run.finishedAt ?? run.startedAt).getTime();
}
