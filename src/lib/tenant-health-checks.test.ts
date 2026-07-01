import { describe, expect, it } from "vitest";
import type { TenantHealthCheck } from "@/types";
import {
  healthCheckRecordedAtMs,
  healthCheckTypeKey,
  latestHealthChecksPerType,
} from "@/lib/tenant-health-checks";

function check(
  partial: Partial<TenantHealthCheck> & Pick<TenantHealthCheck, "id" | "status">,
): TenantHealthCheck {
  return {
    label: partial.id,
    ...partial,
  };
}

describe("latestHealthChecksPerType", () => {
  it("keeps the newest row per check type by checkedAt", () => {
    const latest = latestHealthChecksPerType([
      check({
        id: "registry_completeness",
        status: "warning",
        checkedAt: "2026-06-01T10:00:00.000Z",
        message: "registry gap(s)",
      }),
      check({
        id: "registry_completeness",
        status: "passed",
        checkedAt: "2026-07-01T12:00:00.000Z",
        message: "complete",
      }),
      check({
        id: "api",
        status: "failed",
        checkedAt: "2026-06-15T08:00:00.000Z",
        message: "API domain not configured",
      }),
      check({
        id: "api",
        status: "not_configured",
        checkedAt: "2026-07-01T11:00:00.000Z",
        message: "BFF internal",
      }),
    ]);

    expect(latest).toHaveLength(2);
    expect(latest.find((c) => c.id === "registry_completeness")).toMatchObject({
      status: "passed",
      message: "complete",
    });
    expect(latest.find((c) => c.id === "api")).toMatchObject({
      status: "not_configured",
      message: "BFF internal",
    });
  });

  it("prefers later payload order when timestamps tie or are missing", () => {
    const latest = latestHealthChecksPerType([
      check({ id: "frontend", status: "warning", message: "old gap" }),
      check({ id: "frontend", status: "passed", message: "clean" }),
    ]);

    expect(latest).toHaveLength(1);
    expect(latest[0]).toMatchObject({ status: "passed", message: "clean" });
  });

  it("returns one row per unique id for legacy mock checks (no history duplicates)", () => {
    const input = [
      check({ id: "api_https", status: "passed" }),
      check({ id: "frontend_opens", status: "passed" }),
      check({ id: "nginx_active", status: "passed" }),
    ];

    expect(latestHealthChecksPerType(input)).toHaveLength(3);
    expect(latestHealthChecksPerType(input).map((c) => c.id)).toEqual(
      input.map((c) => c.id),
    );
  });

  it("sorts results in canonical display order", () => {
    const latest = latestHealthChecksPerType([
      check({ id: "database", status: "passed", checkedAt: "2026-07-01T00:00:00Z" }),
      check({ id: "frontend", status: "passed", checkedAt: "2026-07-01T00:00:00Z" }),
      check({ id: "ssl", status: "passed", checkedAt: "2026-07-01T00:00:00Z" }),
    ]);

    expect(latest.map((c) => c.id)).toEqual(["frontend", "ssl", "database"]);
  });
});

describe("healthCheckTypeKey", () => {
  it("uses mapped probe id", () => {
    expect(healthCheckTypeKey(check({ id: "registry_completeness", status: "passed" }))).toBe(
      "registry_completeness",
    );
  });
});

describe("healthCheckRecordedAtMs", () => {
  it("returns -1 for missing timestamps", () => {
    expect(healthCheckRecordedAtMs(check({ id: "port", status: "unknown" }))).toBe(-1);
  });

  it("parses checkedAt", () => {
    expect(
      healthCheckRecordedAtMs(
        check({
          id: "ssl",
          status: "passed",
          checkedAt: "2026-07-01T12:00:00.000Z",
        }),
      ),
    ).toBe(new Date("2026-07-01T12:00:00.000Z").getTime());
  });
});
