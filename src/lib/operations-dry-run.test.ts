import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getTenantByCode } from "@/data/tenants";
import {
  buildDryRunReport,
  containsLikelySecret,
  THEORETICAL_COMMANDS,
} from "@/lib/operations-dry-run";
import { OPERATION_ORDER } from "@/lib/operation-catalog";
import { t } from "@/lib/i18n";

const nibras = getTenantByCode("nibras")!;
const alwah = getTenantByCode("alwah")!;

describe("buildDryRunReport", () => {
  it("includes tenant target and marks report as simulated", () => {
    const report = buildDryRunReport(
      nibras,
      "run_backend_smoke",
      new Date("2026-06-30T12:00:00.000Z"),
    );
    expect(report.simulated).toBe(true);
    expect(report.tenantCode).toBe("nibras");
    expect(report.tenantName).toBe(nibras.name);
    expect(report.operationType).toBe("run_backend_smoke");
    expect(report.generatedAt).toBe("2026-06-30T12:00:00.000Z");
  });

  it("includes the no-real-execution preflight guard", () => {
    const report = buildDryRunReport(nibras, "prepare_database");
    expect(
      report.preflightChecks.some((c) =>
        c.label.includes("لا يتم تنفيذ أي أمر فعلي"),
      ),
    ).toBe(true);
  });

  it("wouldProceed is true for available operations", () => {
    const report = buildDryRunReport(nibras, "run_backend_smoke");
    expect(report.wouldProceed).toBe(true);
    expect(report.operationStatus).toBe("available");
  });

  it("reports completed status for already-done operations", () => {
    const report = buildDryRunReport(alwah, "prepare_database");
    expect(report.operationStatus).toBe("completed");
    expect(report.wouldProceed).toBe(false);
  });

  it("covers every operation type with theoretical steps", () => {
    for (const type of OPERATION_ORDER) {
      const report = buildDryRunReport(nibras, type);
      expect(report.theoreticalSteps.length).toBeGreaterThan(0);
    }
  });

  it("does not embed secrets in report text", () => {
    for (const type of OPERATION_ORDER) {
      const report = buildDryRunReport(nibras, type);
      const blob = JSON.stringify(report);
      expect(containsLikelySecret(blob)).toBe(false);
    }
  });
});

describe("containsLikelySecret", () => {
  it("flags obvious secret patterns", () => {
    expect(containsLikelySecret("password=abc123")).toBe(true);
    expect(containsLikelySecret("postgresql://user:pass@host/db")).toBe(true);
  });

  it("allows safe dry-run text", () => {
    expect(containsLikelySecret("لا يتم تنفيذ أي أمر فعلي")).toBe(false);
    expect(containsLikelySecret("odoo -d <db> --init base")).toBe(false);
  });
});

describe("operations UI safety strings", () => {
  it("exposes required Arabic warning copy", () => {
    expect(t.operations.interactive.simulationOnly).toBe("محاكاة فقط");
    expect(t.operations.interactive.noRealExecution).toContain(
      "لا يتم تنفيذ أي أمر فعلي",
    );
    expect(t.operations.interactive.previewPhaseOnly).toBe(
      "هذه المرحلة للمعاينة والتحقق فقط.",
    );
    expect(t.operations.dialog.auditSaveSuccess).toBe(
      "تم حفظ تقرير المحاكاة في سجل التدقيق",
    );
    expect(t.operations.dialog.auditSaveFailed).toContain(
      "تم إنشاء المحاكاة محليًا",
    );
  });

  it("theoretical commands contain no likely secrets", () => {
    const blob = JSON.stringify(THEORETICAL_COMMANDS);
    expect(containsLikelySecret(blob)).toBe(false);
  });
});

describe("no real operations execution route", () => {
  function listRouteFiles(dir: string): string[] {
    const entries = readdirSync(dir, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...listRouteFiles(full));
      } else if (entry.name === "route.ts" || entry.name === "route.tsx") {
        files.push(full);
      }
    }
    return files;
  }

  it("does not define POST /api/operations/run or similar execution endpoints", () => {
    const apiRoot = join(process.cwd(), "src", "app", "api");
    const routes = listRouteFiles(apiRoot);
    const operationsRoutes = routes.filter((p) => p.includes(`${join("api", "operations")}`));
    expect(operationsRoutes).toHaveLength(0);

    for (const routeFile of routes) {
      const content = readFileSync(routeFile, "utf8");
      expect(content).not.toMatch(/\/api\/operations\/run/);
    }
  });

  it("operations page and dialog components do not POST to execution APIs", () => {
    const files = [
      join(process.cwd(), "src", "app", "operations", "page.tsx"),
      join(process.cwd(), "src", "components", "OperationsCatalogPanel.tsx"),
    ];
    for (const file of files) {
      const content = readFileSync(file, "utf8");
      expect(content).not.toMatch(/fetch\s*\(/);
      expect(content).not.toMatch(/\/api\/operations/);
      expect(content).not.toMatch(/method\s*:\s*["']POST["']/i);
    }
  });

  it("OperationDialog posts only to the simulated audit dry-run route", () => {
    const content = readFileSync(
      join(process.cwd(), "src", "components", "OperationDialog.tsx"),
      "utf8",
    );
    expect(content).toMatch(/\/api\/audit\/simulated-dry-run/);
    expect(content).not.toMatch(/\/api\/operations/);
    expect(content).not.toMatch(/RAQEEM_PLATFORM_AUDIT_WRITE_TOKEN/);
  });
});
