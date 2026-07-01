import { describe, expect, it } from "vitest";
import type { InfrastructureServer, Tenant, TenantInfrastructure } from "@/types";
import {
  deriveTenantInfrastructureSummary,
  displayInfraSyncError,
  displayInfrastructureProviderLabel,
  isRealServerCode,
  shouldShowInfraSyncWarning,
} from "@/lib/tenant-infrastructure";

const alwahInfrastructure: TenantInfrastructure = {
  appServer: "raqeem-prod-app-1",
  appServerPrivateIp: "10.114.0.8",
  appServerPublicIp: "164.92.199.180",
  dataServer: "raqeem-alwah",
  dataServerPrivateIp: "10.114.0.4",
  dbHost: "10.114.0.4",
  dbName: "alwah",
  dbUser: "odoo_alwah",
  odooLocalPort: "8079",
  serviceName: "odoo-alwah.service",
};

function alwahLikeTenant(): Tenant {
  return {
    code: "alwah",
    name: "مدارس ألواح",
    frontendDomain: "alwah.raqeem.ma",
    apiDomain: "api-alwah.raqeem.ma",
    overallStatus: "live_with_warnings",
    identity: {
      schoolName: "مدارس ألواح",
      tenantCode: "alwah",
      academicYear: "2025-2026",
      language: "ar",
      timezone: "Africa/Casablanca",
      currency: "MAD",
      brandingStatus: "missing",
      brandingUrl: "https://alwah.raqeem.ma/admin/settings/school-branding",
    },
    infrastructure: alwahInfrastructure,
    database: {
      reachable: true,
      host: "10.114.0.4",
      port: "5432",
      dbName: "alwah",
      dbUser: "odoo_alwah",
      pgHbaRules: [],
      pgHbaStatus: "passed",
      tableCount: 500,
      schoolTables: 199,
      modulesInstalled: true,
      lastSmokeResult: "passed",
    },
    odoo: {
      serviceName: "odoo-alwah.service",
      active: true,
      enabled: true,
      localUrl: "http://127.0.0.1:8079",
      localPort: "8079",
      localOnly: true,
      baseInstalled: true,
      backendDomain: "api-alwah.raqeem.ma",
      smartSchoolConnectInstalled: true,
      smartSchoolConnectVersion: "18.0.1.0.151",
      smartSchoolConnectCommit: "configured outside control center",
      modulesState: "passed",
    },
    nginx: { active: true, sitePath: "", proxyTarget: "127.0.0.1:8079" },
    ssl: { provider: "Let's Encrypt", ready: true, domain: "api-alwah.raqeem.ma" },
    cloudflare: {
      proxyEnabled: true,
      smokePassed: true,
      sslModeExpected: "Full (strict)",
    },
    apiHealth: {
      httpsStatus: 200,
      serverHeader: "cloudflare",
      httpRedirect: true,
      noCloudflareErrors: true,
    },
    frontend: {
      domain: "alwah.raqeem.ma",
      opens: true,
      loginVisible: true,
      brandingStatus: "missing",
    },
    healthChecks: [],
    lifecycle: [],
    warnings: [],
    operationRuns: [],
  };
}

function server(
  overrides: Partial<InfrastructureServer> & Pick<InfrastructureServer, "code">,
): InfrastructureServer {
  return {
    name: overrides.code,
    provider: "digitalocean",
    providerStatus: "active",
    providerResourceId: "123",
    infraSyncStatus: "synced",
    publicIp: "1.2.3.4",
    privateIp: "10.0.0.1",
    region: "fra1",
    serverRole: "app",
    monitoringEnabled: true,
    sizeSlug: "s-2vcpu-4gb",
    vcpus: 2,
    memoryMb: 4096,
    diskGb: 80,
    linkedTenants: { app: [], data: [] },
    ...overrides,
  };
}

describe("deriveTenantInfrastructureSummary", () => {
  it("resolves app and data servers by tenant infrastructure codes", () => {
    const tenant = alwahLikeTenant();
    const servers = [
      server({
        code: "raqeem-prod-app-1",
        linkedTenants: { app: ["alwah", "nibras"], data: [] },
      }),
      server({
        code: "raqeem-alwah",
        serverRole: "data",
        linkedTenants: { app: [], data: ["alwah"] },
      }),
    ];

    const summary = deriveTenantInfrastructureSummary(tenant, servers);

    expect(summary.appServer?.code).toBe("raqeem-prod-app-1");
    expect(summary.dataServer?.code).toBe("raqeem-alwah");
    expect(summary.sameServer).toBe(false);
  });

  it("falls back to linked_tenants when tenant codes are missing from registry", () => {
    const tenant: Tenant = {
      ...alwahLikeTenant(),
      infrastructure: {
        ...alwahInfrastructure,
        appServer: "missing-app-code",
        dataServer: "missing-data-code",
      },
    };

    const summary = deriveTenantInfrastructureSummary(tenant, [
      server({
        code: "raqeem-prod-app-1",
        linkedTenants: { app: ["alwah"], data: [] },
      }),
      server({
        code: "raqeem-alwah",
        serverRole: "data",
        linkedTenants: { app: [], data: ["alwah"] },
      }),
    ]);

    expect(summary.appServer?.code).toBe("raqeem-prod-app-1");
    expect(summary.dataServer?.code).toBe("raqeem-alwah");
    expect(summary.fallbackAppCode).toBeNull();
    expect(summary.fallbackDataCode).toBeNull();
  });

  it("keeps tenant codes as fallback when registry has no match", () => {
    const tenant = alwahLikeTenant();
    const summary = deriveTenantInfrastructureSummary(tenant, []);

    expect(summary.appServer).toBeNull();
    expect(summary.dataServer).toBeNull();
    expect(summary.fallbackAppCode).toBe("raqeem-prod-app-1");
    expect(summary.fallbackDataCode).toBe("raqeem-alwah");
  });

  it("marks same server when app and data resolve to one record", () => {
    const tenant: Tenant = {
      ...alwahLikeTenant(),
      code: "raqeem_control",
      infrastructure: {
        ...alwahLikeTenant().infrastructure,
        appServer: "raqeem-control-local",
        dataServer: "raqeem-control-local",
      },
    };

    const local = server({
      code: "raqeem-control-local",
      provider: "local",
      providerStatus: "—",
      providerResourceId: null,
      infraSyncStatus: "never",
      publicIp: "—",
      privateIp: "127.0.0.1",
      region: "—",
      serverRole: "app+data",
      sizeSlug: "—",
      vcpus: null,
      memoryMb: null,
      diskGb: null,
      linkedTenants: { app: ["raqeem_control"], data: ["raqeem_control"] },
    });

    const summary = deriveTenantInfrastructureSummary(tenant, [local]);

    expect(summary.sameServer).toBe(true);
    expect(summary.appServer?.code).toBe("raqeem-control-local");
    expect(summary.dataServer?.code).toBe("raqeem-control-local");
  });
});

describe("displayInfrastructureProviderLabel", () => {
  it("shows local/unlinked label for local or empty provider", () => {
    expect(displayInfrastructureProviderLabel("local")).toBe(
      "محلي / غير مرتبط بـ DigitalOcean",
    );
    expect(displayInfrastructureProviderLabel("")).toBe(
      "محلي / غير مرتبط بـ DigitalOcean",
    );
    expect(displayInfrastructureProviderLabel("digitalocean")).toBe("DigitalOcean");
  });
});

describe("infra sync status helpers", () => {
  it("treats only error as warning-worthy", () => {
    expect(shouldShowInfraSyncWarning("error")).toBe(true);
    expect(shouldShowInfraSyncWarning("never")).toBe(false);
    expect(shouldShowInfraSyncWarning("skipped")).toBe(false);
    expect(shouldShowInfraSyncWarning("synced")).toBe(false);
    expect(shouldShowInfraSyncWarning("local")).toBe(false);
  });

  it("sanitizes and truncates long sync errors", () => {
    const long = `password=secret123 ${"x".repeat(200)}`;
    const shown = displayInfraSyncError(long);
    expect(shown).not.toContain("secret123");
    expect(shown!.length).toBeLessThanOrEqual(120);
  });
});

describe("isRealServerCode", () => {
  it("rejects placeholders", () => {
    expect(isRealServerCode("—")).toBe(false);
    expect(isRealServerCode("raqeem-prod-app-1")).toBe(true);
  });
});
