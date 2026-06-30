import { describe, it, expect } from "vitest";
import type { Tenant } from "@/types";
import { tenants, getTenantByCode } from "@/data/tenants";
import {
  canRunOperation,
  deriveTenantOverallStatus,
  getLifecycleProgress,
  getNextRecommendedActions,
  getPlatformSummary,
  getStageStatus,
  getTenantWarnings,
  isTenantProductionReady,
} from "@/lib/tenant-status";

const alwah = getTenantByCode("alwah")!;
const nibras = getTenantByCode("nibras")!;
const school = getTenantByCode("school")!;

/** Deep clone a tenant so tests can mutate freely. */
function clone(tn: Tenant): Tenant {
  return structuredClone(tn);
}

describe("deriveTenantOverallStatus", () => {
  it("returns live_with_warnings for alwah (branding missing)", () => {
    expect(deriveTenantOverallStatus(alwah)).toBe("live_with_warnings");
  });

  it("returns live for fully configured tenants", () => {
    expect(deriveTenantOverallStatus(nibras)).toBe("live");
    expect(deriveTenantOverallStatus(school)).toBe("live");
  });

  it("blocks when the Odoo service is inactive", () => {
    const tn = clone(nibras);
    tn.odoo.active = false;
    expect(deriveTenantOverallStatus(tn)).toBe("blocked");
  });

  it("blocks when proxy is enabled but the HTTPS smoke failed", () => {
    const tn = clone(nibras);
    tn.cloudflare.smokePassed = false;
    expect(deriveTenantOverallStatus(tn)).toBe("blocked");
  });

  it("blocks when proxy is enabled but the API returns an error status", () => {
    const tn = clone(nibras);
    tn.apiHealth.httpsStatus = 521;
    expect(deriveTenantOverallStatus(tn)).toBe("blocked");
  });

  it("is provisioning when SSL is not ready yet", () => {
    const tn = clone(nibras);
    tn.ssl.ready = false;
    tn.cloudflare.proxyEnabled = false;
    expect(deriveTenantOverallStatus(tn)).toBe("provisioning");
  });

  it("blocks when the database is unreachable", () => {
    const tn = clone(nibras);
    tn.database.reachable = false;
    expect(deriveTenantOverallStatus(tn)).toBe("blocked");
  });
});

describe("getTenantWarnings", () => {
  it("flags missing branding and fallback frontend for alwah", () => {
    const warnings = getTenantWarnings(alwah);
    expect(warnings.length).toBeGreaterThanOrEqual(2);
    expect(warnings.some((w) => w.includes("هوية"))).toBe(true);
  });

  it("produces no warnings for fully configured tenants", () => {
    expect(getTenantWarnings(nibras)).toHaveLength(0);
    expect(getTenantWarnings(school)).toHaveLength(0);
  });

  it("does not duplicate warnings", () => {
    const warnings = getTenantWarnings(alwah);
    expect(new Set(warnings).size).toBe(warnings.length);
  });

  it("frontend branding missing yields warning, not failure (still live_with_warnings)", () => {
    expect(deriveTenantOverallStatus(alwah)).not.toBe("blocked");
  });
});

describe("getLifecycleProgress", () => {
  it("counts done stages for alwah (8 of 11)", () => {
    const p = getLifecycleProgress(alwah);
    expect(p.total).toBe(11);
    expect(p.done).toBe(8);
    expect(p.percent).toBe(73);
  });

  it("is 100% for a fully live tenant", () => {
    const p = getLifecycleProgress(nibras);
    expect(p.done).toBe(p.total);
    expect(p.percent).toBe(100);
  });
});

describe("canRunOperation", () => {
  it("marks completed stages as completed", () => {
    expect(canRunOperation(alwah, "prepare_database")).toBe("completed");
    expect(canRunOperation(alwah, "setup_nginx_ssl")).toBe("completed");
    expect(canRunOperation(alwah, "enable_cloudflare_proxy")).toBe("completed");
  });

  it("enables cloudflare proxy early — only blocked until SSL is ready", () => {
    const tn = clone(alwah);
    // Roll back SSL + proxy to pending to test gating.
    tn.lifecycle = tn.lifecycle.map((s) =>
      s.stage === "ssl_ready" || s.stage === "proxy_ready"
        ? { ...s, status: "pending" }
        : s,
    );
    expect(canRunOperation(tn, "enable_cloudflare_proxy")).toBe("blocked");

    // Once SSL is done, proxy becomes available immediately.
    tn.lifecycle = tn.lifecycle.map((s) =>
      s.stage === "ssl_ready" ? { ...s, status: "done" } : s,
    );
    expect(canRunOperation(tn, "enable_cloudflare_proxy")).toBe("available");
  });

  it("treats school profile bootstrap as available when frontend is warning", () => {
    expect(getStageStatus(alwah, "frontend_ready")).toBe("warning");
    expect(canRunOperation(alwah, "bootstrap_school_profile")).toBe("available");
  });

  it("always treats branding settings as a manual external action", () => {
    expect(canRunOperation(alwah, "open_branding_settings")).toBe("manual_required");
    expect(canRunOperation(nibras, "open_branding_settings")).toBe("manual_required");
  });

  it("blocks an operation whose precondition stage is not done", () => {
    const tn = clone(alwah);
    tn.lifecycle = tn.lifecycle.map((s) =>
      s.stage === "database_ready" ? { ...s, status: "pending" } : s,
    );
    expect(canRunOperation(tn, "install_odoo_base")).toBe("blocked");
  });
});

describe("getNextRecommendedActions", () => {
  it("recommends finishing the school profile for alwah", () => {
    const recs = getNextRecommendedActions(alwah);
    expect(recs).toContain("bootstrap_school_profile");
  });

  it("returns nothing to do for a fully live tenant", () => {
    expect(getNextRecommendedActions(nibras)).toHaveLength(0);
  });
});

describe("isTenantProductionReady", () => {
  it("is false for alwah (warnings + not fully live)", () => {
    expect(isTenantProductionReady(alwah)).toBe(false);
  });

  it("is true for fully configured live tenants", () => {
    expect(isTenantProductionReady(nibras)).toBe(true);
    expect(isTenantProductionReady(school)).toBe(true);
  });
});

describe("getPlatformSummary", () => {
  it("aggregates the seed tenants correctly", () => {
    const s = getPlatformSummary(tenants);
    expect(s.totalTenants).toBe(3);
    expect(s.tenantsWithWarnings).toBe(1);
    expect(s.criticalCount).toBe(0);
    expect(s.sslReady).toBe(3);
    expect(s.proxyReady).toBe(3);
    expect(s.servicesActive).toBe(3);
    expect(s.frontendReady).toBe(3);
    expect(s.backendDbHealthy).toBe(3);
  });
});
