import { describe, expect, it } from "vitest";
import {
  isCheckExplicitFailure,
  mapOdooAuditEntry,
  mapOdooDashboardAggregate,
  mapOdooTenant,
  mapOdooTenantsResponse,
} from "@/lib/data-source/mappers";
import { formatOptionalDateTime } from "@/lib/format";
import { t, tCheck } from "@/lib/i18n";
import { getPlatformSummary } from "@/lib/tenant-status";

describe("mapOdooAuditEntry", () => {
  it("maps result=recorded without falling back to unknown", () => {
    const entry = mapOdooAuditEntry({
      id: "29",
      tenant_code: "raqeem_control",
      date: "2026-06-30T12:00:00.000Z",
      action: "simulated_dry_run",
      result: "recorded",
      actor: "control-center-ops-ui",
      risk_level: "low",
    });

    expect(entry).not.toBeNull();
    expect(entry!.result).toBe("recorded");
    expect(entry!.result).not.toBe("unknown");
    expect(tCheck(entry!.result)).toBe("محاكاة مسجلة");
    expect(tCheck(entry!.result)).not.toBe("غير معروف");
  });

  it("keeps existing check status mappings", () => {
    expect(
      mapOdooAuditEntry({
        id: "1",
        tenant_code: "nibras",
        result: "passed",
      })!.result,
    ).toBe("passed");
    expect(
      mapOdooAuditEntry({
        id: "2",
        tenant_code: "nibras",
        result: "failed",
      })!.result,
    ).toBe("failed");
  });

  it("does not invent epoch date when audit date is missing", () => {
    const entry = mapOdooAuditEntry({
      id: "3",
      tenant_code: "nibras",
      action: "run_backend_smoke",
      result: "passed",
    });

    expect(entry).not.toBeNull();
    expect(entry!.date).toBeUndefined();
    expect(formatOptionalDateTime(entry!.date)).not.toContain("1970");
  });
});

describe("mapOperationRun via mapOdooTenant", () => {
  it("preserves null started_at without epoch fallback", () => {
    const tenant = mapOdooTenant({
      code: "demo",
      name: "Demo",
      operation_runs: [
        {
          id: "run-1",
          title: "Smoke test",
          result: "passed",
          started_at: null,
          finished_at: null,
        },
      ],
    });

    expect(tenant).not.toBeNull();
    const run = tenant!.operationRuns[0];
    expect(run.startedAt).toBeUndefined();
    expect(run.finishedAt).toBeUndefined();
    expect(formatOptionalDateTime(run.finishedAt ?? run.startedAt)).toBe("غير معروف");
    expect(formatOptionalDateTime(run.finishedAt ?? run.startedAt)).not.toContain("1970");
  });
});

describe("mapOdooDashboardAggregate", () => {
  it("maps snake_case dashboard counts from /tenants envelope", () => {
    const summary = mapOdooDashboardAggregate({
      data: [{ code: "alwah", name: "Alwah" }],
      tenant_count: 5,
      live_count: 4,
      warning_count: 2,
      critical_count: 1,
      ssl_ready_count: 5,
      proxy_ready_count: 4,
      services_active_count: 5,
      frontend_ready_count: 4,
      backend_db_healthy_count: 5,
    });

    expect(summary).toEqual({
      totalTenants: 5,
      tenantsWithWarnings: 2,
      criticalCount: 1,
      sslReady: 5,
      proxyReady: 4,
      servicesActive: 5,
      frontendReady: 4,
      backendDbHealthy: 5,
      fromOdoo: true,
    });
  });

  it("maps nested dashboard object", () => {
    const summary = mapOdooDashboardAggregate({
      tenants: [{ code: "demo", name: "Demo" }],
      dashboard: {
        tenant_count: 3,
        warning_count: 1,
        critical_count: 0,
        ssl_ready_count: 3,
        proxy_ready_count: 3,
        services_active_count: 3,
        frontend_ready_count: 3,
        backend_db_healthy_count: 2,
      },
    });

    expect(summary?.totalTenants).toBe(3);
    expect(summary?.backendDbHealthy).toBe(2);
    expect(summary?.fromOdoo).toBe(true);
  });

  it("returns null when Odoo sends no dashboard aggregate", () => {
    expect(mapOdooDashboardAggregate({ data: [{ code: "x", name: "X" }] })).toBeNull();
    expect(mapOdooDashboardAggregate([{ code: "x", name: "X" }])).toBeNull();
  });
});

describe("mapOdooTenantsResponse", () => {
  it("falls back to local summary when dashboard is absent", () => {
    const { tenants, dashboard } = mapOdooTenantsResponse({
      data: [
        {
          code: "demo",
          name: "Demo",
          ssl: { ready: true },
          cloudflare: { proxy_enabled: true },
          odoo: { active: true, enabled: true },
          frontend: { opens: true },
          database: { reachable: true },
        },
      ],
    });

    expect(dashboard).toBeNull();
    expect(tenants).toHaveLength(1);
    const local = getPlatformSummary(tenants);
    expect(local.totalTenants).toBe(1);
    expect(local.sslReady).toBe(1);
    expect(local.fromOdoo).toBeUndefined();
  });
});

describe("isCheckExplicitFailure", () => {
  it("treats only failed as explicit failure", () => {
    expect(isCheckExplicitFailure("failed")).toBe(true);
    expect(isCheckExplicitFailure("unknown")).toBe(false);
    expect(isCheckExplicitFailure("not_configured")).toBe(false);
    expect(isCheckExplicitFailure("warning")).toBe(false);
    expect(isCheckExplicitFailure("pending")).toBe(false);
    expect(isCheckExplicitFailure("recorded")).toBe(false);
    expect(isCheckExplicitFailure("passed")).toBe(false);
  });

  it("maps not_configured check status without coercing to failed", () => {
    const tenant = mapOdooTenant({
      code: "demo",
      name: "Demo",
      health_checks: [{ id: "local", label: "Registry", status: "not_configured" }],
    });

    expect(tenant!.healthChecks[0].status).toBe("not_configured");
    expect(isCheckExplicitFailure(tenant!.healthChecks[0].status)).toBe(false);
    expect(tCheck(tenant!.healthChecks[0].status)).toBe("غير مُعدّ");
  });
});

describe("dashboard warning metric label", () => {
  it("keeps warning_count value but uses a label that is not school-count wording", () => {
    const summary = mapOdooDashboardAggregate({
      tenant_count: 4,
      warning_count: 9,
    });

    expect(summary!.totalTenants).toBe(4);
    expect(summary!.tenantsWithWarnings).toBe(9);
    expect(t.dashboard.metrics.tenantsWithWarnings).toBe("تنبيهات صحية");
    expect(t.dashboard.metrics.tenantsWithWarnings).not.toMatch(/مدارس/);
  });
});
