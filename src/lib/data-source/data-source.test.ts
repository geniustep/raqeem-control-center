import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getPublicDataSourceInfo } from "@/lib/data-source/config";
import { mapOdooTenant } from "@/lib/data-source/mappers";
import { MockPlatformDataSource } from "@/lib/data-source/mock-platform-data-source";
import { OdooPlatformDataSource } from "@/lib/data-source/odoo-platform-data-source";
import {
  loadAuditLogs,
  loadOperationsPageData,
  loadTenants,
} from "@/lib/data-source/platform-data-source";
import { listOperations } from "@/lib/operation-catalog";
import { tenants as mockTenants } from "@/data/tenants";

const ENV_KEYS = [
  "CONTROL_CENTER_DATA_SOURCE",
  "RAQEEM_PLATFORM_API_BASE_URL",
  "RAQEEM_PLATFORM_API_TOKEN",
] as const;

function saveEnv(): Record<string, string | undefined> {
  const saved: Record<string, string | undefined> = {};
  for (const key of ENV_KEYS) {
    saved[key] = process.env[key];
  }
  return saved;
}

function restoreEnv(saved: Record<string, string | undefined>) {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
}

describe("data source config", () => {
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = saveEnv();
    delete process.env.CONTROL_CENTER_DATA_SOURCE;
    delete process.env.RAQEEM_PLATFORM_API_BASE_URL;
    delete process.env.RAQEEM_PLATFORM_API_TOKEN;
  });

  afterEach(() => {
    restoreEnv(saved);
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("defaults to mock when CONTROL_CENTER_DATA_SOURCE is unset", async () => {
    const result = await loadTenants();
    expect(result.error).toBeUndefined();
    expect(result.meta.configuredSource).toBe("mock");
    expect(result.meta.effectiveSource).toBe("mock");
    expect(result.meta.usedFallback).toBe(false);
    expect(result.data).toHaveLength(mockTenants.length);
  });

  it("uses mock adapter when CONTROL_CENTER_DATA_SOURCE=mock", async () => {
    process.env.CONTROL_CENTER_DATA_SOURCE = "mock";
    const mock = new MockPlatformDataSource();
    const list = await mock.listTenants();
    expect(list.map((t) => t.code)).toEqual(mockTenants.map((t) => t.code));
  });

  it("does not expose token via getPublicDataSourceInfo", () => {
    process.env.CONTROL_CENTER_DATA_SOURCE = "odoo";
    process.env.RAQEEM_PLATFORM_API_BASE_URL = "http://127.0.0.1:8094";
    process.env.RAQEEM_PLATFORM_API_TOKEN = "super-secret-token";

    const info = getPublicDataSourceInfo();
    expect(JSON.stringify(info)).not.toContain("super-secret");
    expect(JSON.stringify(info)).not.toContain("8094");
    expect(info).toEqual({
      configuredSource: "odoo",
      apiConfigured: true,
    });
  });
});

describe("Odoo mapper", () => {
  it("maps snake_case tenant payload to Tenant", () => {
    const tenant = mapOdooTenant({
      code: "alwah",
      name: "مدارس ألواح",
      frontend_domain: "alwah.raqeem.ma",
      api_domain: "api-alwah.raqeem.ma",
      overall_status: "live_with_warnings",
      identity: {
        school_name: "مدارس ألواح",
        tenant_code: "alwah",
        branding_status: "missing",
      },
      database: { reachable: true },
      odoo: { active: true, enabled: true },
      ssl: { ready: true },
      cloudflare: { proxy_enabled: true, smoke_passed: false },
      api_health: { https_status: 200, no_cloudflare_errors: true },
      frontend: { opens: true, branding_status: "missing" },
    });

    expect(tenant).not.toBeNull();
    expect(tenant!.code).toBe("alwah");
    expect(tenant!.frontendDomain).toBe("alwah.raqeem.ma");
    expect(tenant!.overallStatus).toBe("live_with_warnings");
    expect(tenant!.identity.brandingStatus).toBe("missing");
    expect(tenant!.database.reachable).toBe(true);
  });
});

describe("Odoo adapter", () => {
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = saveEnv();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    restoreEnv(saved);
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("uses GET-only requests", () => {
    expect(OdooPlatformDataSource.allowedHttpMethod()).toBe("GET");
  });

  it("calls Odoo tenants endpoint when CONTROL_CENTER_DATA_SOURCE=odoo", async () => {
    process.env.CONTROL_CENTER_DATA_SOURCE = "odoo";
    process.env.RAQEEM_PLATFORM_API_BASE_URL = "http://odoo.test";
    process.env.RAQEEM_PLATFORM_API_TOKEN = "test-token";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{ code: "demo", name: "Demo School", overall_status: "live" }],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const odoo = new OdooPlatformDataSource({
      apiBaseUrl: "http://odoo.test",
      apiToken: "test-token",
    });
    const list = await odoo.listTenants();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://odoo.test/api/v1/platform/tenants",
      expect.objectContaining({ method: "GET" }),
    );
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe(
      "Bearer test-token",
    );
    expect(list).toHaveLength(1);
    expect(list[0].code).toBe("demo");
  });

  it("loads Odoo data when API succeeds via platform loader", async () => {
    process.env.CONTROL_CENTER_DATA_SOURCE = "odoo";
    process.env.RAQEEM_PLATFORM_API_BASE_URL = "http://odoo.test";
    process.env.RAQEEM_PLATFORM_API_TOKEN = "test-token";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [{ code: "demo", name: "Demo School", overall_status: "live" }],
        }),
      }),
    );

    const result = await loadTenants();
    expect(result.error).toBeUndefined();
    if (result.error) return;
    expect(result.meta.effectiveSource).toBe("odoo");
    expect(result.meta.usedFallback).toBe(false);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].code).toBe("demo");
  });

  it("falls back to mock when Odoo API is unreachable outside production", async () => {
    process.env.CONTROL_CENTER_DATA_SOURCE = "odoo";
    process.env.RAQEEM_PLATFORM_API_BASE_URL = "http://odoo.test";
    vi.stubEnv("NODE_ENV", "development");

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));

    const result = await loadTenants();
    expect(result.error).toBeUndefined();
    if (result.error) return;
    expect(result.meta.usedFallback).toBe(true);
    expect(result.meta.effectiveSource).toBe("mock");
    expect(result.meta.configuredSource).toBe("odoo");
    expect(result.data).toHaveLength(mockTenants.length);
  });

  it("does not fall back to mock in production when Odoo API fails", async () => {
    process.env.CONTROL_CENTER_DATA_SOURCE = "odoo";
    process.env.RAQEEM_PLATFORM_API_BASE_URL = "http://127.0.0.1:8094";
    process.env.RAQEEM_PLATFORM_API_TOKEN = "super-secret-token";
    vi.stubEnv("NODE_ENV", "production");

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));

    const result = await loadTenants();
    expect(result.error).toEqual({ code: "odoo_unavailable" });
    expect(result.data).toBeNull();
    expect(result.meta.usedFallback).toBe(false);
    expect(result.meta.effectiveSource).toBe("odoo");
    expect(result.meta.configuredSource).toBe("odoo");

    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("super-secret");
    expect(serialized).not.toContain("8094");
    expect(serialized).not.toContain("ECONNREFUSED");
  });

  it("returns misconfigured error in production when Odoo API URL is missing", async () => {
    process.env.CONTROL_CENTER_DATA_SOURCE = "odoo";
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.RAQEEM_PLATFORM_API_BASE_URL;

    const result = await loadTenants();
    expect(result.error).toEqual({ code: "odoo_misconfigured" });
    expect(result.data).toBeNull();
    expect(result.meta.usedFallback).toBe(false);
  });

  it("does not use POST/PATCH/DELETE in fetch calls", async () => {
    process.env.CONTROL_CENTER_DATA_SOURCE = "odoo";
    process.env.RAQEEM_PLATFORM_API_BASE_URL = "http://odoo.test";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const odoo = new OdooPlatformDataSource({
      apiBaseUrl: "http://odoo.test",
      apiToken: "",
    });

    await odoo.listTenants();
    await odoo.listDomains();
    await odoo.listOperations();
    await odoo.listAuditLogs();

    for (const call of fetchMock.mock.calls) {
      expect(call[1]?.method ?? "GET").toBe("GET");
    }
  });

  it("does not use static catalog fallback in production when operations endpoint fails", async () => {
    process.env.CONTROL_CENTER_DATA_SOURCE = "odoo";
    process.env.RAQEEM_PLATFORM_API_BASE_URL = "http://127.0.0.1:8094";
    process.env.RAQEEM_PLATFORM_API_TOKEN = "super-secret-token";
    vi.stubEnv("NODE_ENV", "production");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        if (String(url).includes("/operations")) {
          return Promise.reject(new Error("ECONNREFUSED"));
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: [] }),
        });
      }),
    );

    const result = await loadOperationsPageData();
    expect(result.error).toEqual({ code: "odoo_unavailable" });
    expect(result.data).toBeNull();

    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("super-secret");
    expect(serialized).not.toContain("8094");
    expect(serialized).not.toContain("ECONNREFUSED");
  });

  it("does not use tenant-derived fallback in production when audit endpoint fails", async () => {
    process.env.CONTROL_CENTER_DATA_SOURCE = "odoo";
    process.env.RAQEEM_PLATFORM_API_BASE_URL = "http://127.0.0.1:8094";
    process.env.RAQEEM_PLATFORM_API_TOKEN = "super-secret-token";
    vi.stubEnv("NODE_ENV", "production");

    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (String(url).includes("/audit")) {
        return Promise.reject(new Error("ECONNREFUSED"));
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          data: [{ code: "demo", name: "Demo School", overall_status: "live" }],
        }),
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await loadAuditLogs();
    expect(result.error).toEqual({ code: "odoo_unavailable" });
    expect(result.data).toBeNull();
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/tenants"))).toBe(
      false,
    );

    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("super-secret");
    expect(serialized).not.toContain("8094");
    expect(serialized).not.toContain("ECONNREFUSED");
  });

  it("keeps static catalog fallback in development when operations endpoint fails", async () => {
    process.env.CONTROL_CENTER_DATA_SOURCE = "odoo";
    process.env.RAQEEM_PLATFORM_API_BASE_URL = "http://odoo.test";
    vi.stubEnv("NODE_ENV", "development");

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));

    const odoo = new OdooPlatformDataSource({
      apiBaseUrl: "http://odoo.test",
      apiToken: "",
    });
    const catalog = await odoo.listOperations();
    expect(catalog).toEqual(listOperations());
  });

  it("keeps tenant-derived audit fallback in development when audit endpoint fails", async () => {
    process.env.CONTROL_CENTER_DATA_SOURCE = "odoo";
    process.env.RAQEEM_PLATFORM_API_BASE_URL = "http://odoo.test";
    vi.stubEnv("NODE_ENV", "development");

    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (String(url).includes("/audit")) {
        return Promise.reject(new Error("ECONNREFUSED"));
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          data: [{ code: "demo", name: "Demo School", overall_status: "live" }],
        }),
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const odoo = new OdooPlatformDataSource({
      apiBaseUrl: "http://odoo.test",
      apiToken: "",
    });
    await expect(odoo.listAuditLogs()).resolves.toEqual(expect.any(Array));
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/tenants"))).toBe(
      true,
    );
  });
});
