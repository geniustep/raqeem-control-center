import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getTenantByCode } from "@/data/tenants";
import { buildSimulatedDryRunClientPayload } from "@/lib/audit/simulated-dry-run-payload";
import {
  ALLOWED_CLIENT_KEYS,
  findForbiddenClientKeys,
  FORBIDDEN_CLIENT_KEYS,
  getAuditWriteConfig,
  postSimulatedDryRunToOdoo,
  validateClientSimulatedDryRunPayload,
} from "@/lib/audit/simulated-dry-run";
import { buildDryRunReport } from "@/lib/operations-dry-run";

const nibras = getTenantByCode("nibras")!;

function validPayload() {
  const report = buildDryRunReport(nibras, "run_backend_smoke");
  return buildSimulatedDryRunClientPayload(report, "req-001");
}

describe("validateClientSimulatedDryRunPayload", () => {
  it("accepts a minimal safe client payload", () => {
    const result = validateClientSimulatedDryRunPayload(validPayload());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.source).toBe("ops_ui");
      expect(result.data.operation_code).toBe("run_backend_smoke");
    }
  });

  it("rejects forbidden top-level keys from the client", () => {
    for (const forbidden of [
      "operation_name",
      "severity",
      "risk_level",
      "actor",
      "timestamp",
      "token",
      "command",
      "ssh",
      "password",
      "secret",
      "private_key",
      "env",
    ]) {
      const payload = { ...validPayload(), [forbidden]: "blocked" };
      const result = validateClientSimulatedDryRunPayload(payload);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("forbidden_fields");
        expect(result.status).toBe(400);
      }
    }
  });

  it("rejects nested forbidden keys inside dry_run_report", () => {
    const payload = {
      ...validPayload(),
      dry_run_report: {
        ...validPayload().dry_run_report,
        command: "rm -rf /",
      },
    };
    const result = validateClientSimulatedDryRunPayload(payload);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("forbidden_fields");
    }
  });

  it("rejects unknown top-level keys", () => {
    const payload = { ...validPayload(), extra_field: true };
    const result = validateClientSimulatedDryRunPayload(payload);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("unknown_fields");
    }
  });

  it("requires source to be ops_ui", () => {
    const payload = { ...validPayload(), source: "other" };
    const result = validateClientSimulatedDryRunPayload(payload);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("invalid_source");
    }
  });
});

describe("findForbiddenClientKeys", () => {
  it("documents the forbidden key set used by validation", () => {
    expect(FORBIDDEN_CLIENT_KEYS).toContain("operation_name");
    expect(FORBIDDEN_CLIENT_KEYS).toContain("risk_level");
    expect(ALLOWED_CLIENT_KEYS).not.toContain("operation_name");
  });

  it("finds forbidden keys at nested paths", () => {
    const hits = findForbiddenClientKeys({
      dry_run_report: { ssh: "blocked" },
    });
    expect(hits).toContain("dry_run_report.ssh");
  });
});

describe("getAuditWriteConfig", () => {
  const keys = [
    "RAQEEM_PLATFORM_API_BASE_URL",
    "RAQEEM_PLATFORM_AUDIT_WRITE_TOKEN",
  ] as const;

  const saved: Partial<Record<(typeof keys)[number], string | undefined>> = {};

  beforeEach(() => {
    for (const key of keys) {
      saved[key] = process.env[key];
    }
  });

  afterEach(() => {
    for (const key of keys) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });

  it("reports unconfigured when env is missing", () => {
    delete process.env.RAQEEM_PLATFORM_API_BASE_URL;
    delete process.env.RAQEEM_PLATFORM_AUDIT_WRITE_TOKEN;
    const config = getAuditWriteConfig();
    expect(config.isConfigured).toBe(false);
    expect(config.writeToken).toBe("");
  });

  it("does not expose token values in config shape returned to callers", () => {
    process.env.RAQEEM_PLATFORM_API_BASE_URL = "http://odoo.test";
    process.env.RAQEEM_PLATFORM_AUDIT_WRITE_TOKEN = "super-secret-write-token";
    const config = getAuditWriteConfig();
    expect(config.isConfigured).toBe(true);
    expect(config.writeToken).toBe("super-secret-write-token");
    expect(JSON.stringify(config)).not.toContain("Bearer");
  });
});

describe("postSimulatedDryRunToOdoo", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends Bearer token server-side only in the upstream request", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          auditLogId: "audit-42",
          actionType: "simulated_dry_run",
          result: "recorded",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const clientPayload = validateClientSimulatedDryRunPayload(validPayload());
    expect(clientPayload.ok).toBe(true);
    if (!clientPayload.ok) return;

    const result = await postSimulatedDryRunToOdoo(clientPayload.data, {
      apiBaseUrl: "http://odoo.test",
      writeToken: "server-only-write-token",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.auditLogId).toBe("audit-42");
      expect(result.actionType).toBe("simulated_dry_run");
      expect(result.result).toBe("recorded");
      expect(JSON.stringify(result)).not.toContain("server-only-write-token");
      expect(JSON.stringify(result)).not.toContain("Bearer");
    }

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://odoo.test/api/v1/platform/audit/simulated-dry-run");
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer server-only-write-token");

    const upstreamBody = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(upstreamBody.operation_name).toBeTruthy();
    expect(upstreamBody.risk_level).toBeTruthy();
    expect(upstreamBody.timestamp).toBeTruthy();
    expect(upstreamBody.actor).toBe("control-center-ops-ui");
  });

  it("returns a safe failure without leaking upstream secrets", async () => {
    fetchMock.mockResolvedValue(
      new Response("invalid token super-secret-write-token", { status: 401 }),
    );

    const clientPayload = validateClientSimulatedDryRunPayload(validPayload());
    expect(clientPayload.ok).toBe(true);
    if (!clientPayload.ok) return;

    const result = await postSimulatedDryRunToOdoo(clientPayload.data, {
      apiBaseUrl: "http://odoo.test",
      writeToken: "server-only-write-token",
    });

    expect(result).toEqual({ ok: false, error: "upstream_rejected" });
    expect(JSON.stringify(result)).not.toContain("server-only-write-token");
  });
});

describe("simulated dry-run audit route safety", () => {
  it("does not define POST /api/operations/run", async () => {
    const { readdirSync, readFileSync } = await import("node:fs");
    const { join } = await import("node:path");

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

    const apiRoot = join(process.cwd(), "src", "app", "api");
    const routes = listRouteFiles(apiRoot);
    const operationsRoutes = routes.filter((p) =>
      p.includes(join("api", "operations")),
    );
    expect(operationsRoutes).toHaveLength(0);

    for (const routeFile of routes) {
      const content = readFileSync(routeFile, "utf8");
      expect(content).not.toMatch(/\/api\/operations\/run/);
    }
  });

  it("keeps audit write token out of client-facing modules", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const clientFiles = [
      join(process.cwd(), "src", "components", "OperationDialog.tsx"),
      join(process.cwd(), "src", "lib", "audit", "simulated-dry-run-payload.ts"),
      join(process.cwd(), "src", "lib", "operations-dry-run.ts"),
    ];

    for (const file of clientFiles) {
      const content = readFileSync(file, "utf8");
      expect(content).not.toMatch(/RAQEEM_PLATFORM_AUDIT_WRITE_TOKEN/);
      expect(content).not.toMatch(/Bearer\s+/);
    }
  });
});
