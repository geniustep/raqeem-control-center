import { describe, expect, it } from "vitest";
import { mapOdooAuditEntry } from "@/lib/data-source/mappers";
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
});
