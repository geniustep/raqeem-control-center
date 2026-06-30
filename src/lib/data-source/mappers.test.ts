import { describe, expect, it } from "vitest";
import { mapOdooAuditEntry, mapOdooTenant } from "@/lib/data-source/mappers";
import { formatOptionalDateTime } from "@/lib/format";
import { tCheck } from "@/lib/i18n";

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
