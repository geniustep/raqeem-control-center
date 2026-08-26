import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getSnapshotRefreshConfig,
  refreshSchoolSnapshot,
} from "@/lib/release-snapshot/refresh";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const SUCCESS = {
  success: true,
  data: {
    tenant_code: "school",
    observation_status: "FRESH",
    observed_at: "2026-08-26 12:00:00",
    schema_version: "SCHOOL-SNAPSHOT-2026.08.1",
    students: { active_total: 217, by_level: [] },
    classes: { active_total: 22 },
    teachers: { active_total: 19 },
    release_readiness: {
      status: "VERIFY_REQUIRED",
      compatibility_status: "VERIFY_REQUIRED",
      currency_status: "VERIFY_REQUIRED",
      verification_state: "VERIFY_REQUIRED",
      reasons: ["no_target_release"],
    },
  },
  meta: { request_id: "req-refresh-1" },
};

describe("snapshot refresh configuration", () => {
  it("requires Odoo source, API base URL and a dedicated refresh token", () => {
    vi.stubEnv("CONTROL_CENTER_DATA_SOURCE", "odoo");
    vi.stubEnv("RAQEEM_PLATFORM_API_BASE_URL", "https://control.example");
    vi.stubEnv("RAQEEM_PLATFORM_SNAPSHOT_REFRESH_TOKEN", "dedicated-refresh-token");
    expect(getSnapshotRefreshConfig().isConfigured).toBe(true);

    vi.stubEnv("RAQEEM_PLATFORM_SNAPSHOT_REFRESH_TOKEN", "");
    expect(getSnapshotRefreshConfig().isConfigured).toBe(false);
  });
});

describe("snapshot refresh writer", () => {
  it("uses POST with only an empty body and the dedicated server token", async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      expect(init?.method).toBe("POST");
      expect(init?.body).toBe("{}");
      expect(init?.cache).toBe("no-store");
      const headers = init?.headers as Record<string, string>;
      expect(headers.Authorization).toBe("Bearer dedicated-refresh-token");
      expect(String(init?.body)).not.toContain("school");
      expect(String(init?.body)).not.toContain("secret");
      return new Response(JSON.stringify(SUCCESS), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await refreshSchoolSnapshot("school", {
      apiBaseUrl: "https://control.example/",
      writeToken: "dedicated-refresh-token",
    });

    expect(result.ok).toBe(true);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://control.example/api/v1/platform/tenants/school/school-snapshot/refresh",
    );
  });

  it("rejects a successful response for another tenant", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            ...SUCCESS,
            data: { ...SUCCESS.data, tenant_code: "other" },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    await expect(
      refreshSchoolSnapshot("school", {
        apiBaseUrl: "https://control.example",
        writeToken: "secret-never-returned",
      }),
    ).resolves.toEqual({ ok: false, error: "upstream_invalid_response" });
  });

  it("returns only the governed error category, never the upstream body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            error: "snapshot_refresh_failed",
            raw_secret: "must-not-escape",
            error_detail: { error_category: "CONNECTIVITY_FAILURE" },
          }),
          { status: 502, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    const result = await refreshSchoolSnapshot("school", {
      apiBaseUrl: "https://control.example",
      writeToken: "secret-never-returned",
    });

    expect(result).toEqual({
      ok: false,
      error: "upstream_rejected",
      category: "CONNECTIVITY_FAILURE",
    });
    expect(JSON.stringify(result)).not.toContain("must-not-escape");
    expect(JSON.stringify(result)).not.toContain("secret-never-returned");
  });
});
