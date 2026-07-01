import { describe, expect, it } from "vitest";
import type { InfrastructureServer } from "@/types";
import {
  deriveInfrastructureSyncNotice,
  isDigitalOceanServer,
} from "@/lib/infrastructure-sync-notice";
import { formatOptionalDateTime } from "@/lib/format";
import { t } from "@/lib/i18n";

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
    sizeSlug: "s-1vcpu-1gb",
    vcpus: 1,
    memoryMb: 1024,
    diskGb: 25,
    linkedTenants: { app: [], data: [] },
    ...overrides,
  };
}

describe("deriveInfrastructureSyncNotice", () => {
  it("shows synced success when DigitalOcean servers are synced", () => {
    const notice = deriveInfrastructureSyncNotice([
      server({
        code: "raqeem-prod-app-1",
        lastInfraCheckAt: "2026-06-30T22:26:00.000Z",
      }),
      server({
        code: "raqeem-control-local",
        provider: "local",
        infraSyncStatus: "never",
        providerResourceId: null,
      }),
    ]);

    expect(notice.kind).toBe("synced");
    expect(notice.message).toBe(t.infrastructure.syncNotice.syncedSuccess);
    expect(notice.message).not.toContain("غير مفعّلة");
    expect(notice.lastSyncAt).toBe("2026-06-30T22:26:00.000Z");
    expect(formatOptionalDateTime(notice.lastSyncAt)).not.toContain("1970");
  });

  it("shows disabled when all DO servers are never/skipped without checks", () => {
    const notice = deriveInfrastructureSyncNotice([
      server({
        code: "do-staging",
        infraSyncStatus: "never",
        providerResourceId: null,
        lastInfraCheckAt: undefined,
      }),
      server({
        code: "do-skipped",
        infraSyncStatus: "skipped",
        providerResourceId: null,
      }),
    ]);

    expect(notice.kind).toBe("disabled");
    expect(notice.message).toBe(t.infrastructure.syncNotice.disabled);
  });

  it("shows pending when any server is pending", () => {
    const notice = deriveInfrastructureSyncNotice([
      server({ code: "do-synced", infraSyncStatus: "synced" }),
      server({ code: "do-pending", infraSyncStatus: "pending" }),
    ]);

    expect(notice.kind).toBe("pending");
    expect(notice.message).toBe(t.infrastructure.syncNotice.pending);
  });

  it("shows error alert when any server has error (priority over synced)", () => {
    const notice = deriveInfrastructureSyncNotice([
      server({ code: "do-synced", infraSyncStatus: "synced" }),
      server({
        code: "do-error",
        infraSyncStatus: "error",
        infraLastError: "token=[مخفي] sync failed",
      }),
    ]);

    expect(notice.kind).toBe("error");
    expect(notice.variant).toBe("danger");
    expect(notice.errorCount).toBe(1);
    expect(notice.message).not.toContain("token=");
    expect(notice.message).toBe(t.infrastructure.syncNotice.error);
  });

  it("picks the latest lastInfraCheckAt among synced DO servers", () => {
    const notice = deriveInfrastructureSyncNotice([
      server({
        code: "do-a",
        lastInfraCheckAt: "2026-06-29T10:00:00.000Z",
      }),
      server({
        code: "do-b",
        lastInfraCheckAt: "2026-06-30T22:26:00.000Z",
      }),
    ]);

    expect(notice.lastSyncAt).toBe("2026-06-30T22:26:00.000Z");
  });
});

describe("isDigitalOceanServer", () => {
  it("matches digitalocean provider case-insensitively", () => {
    expect(isDigitalOceanServer(server({ code: "x", provider: "DigitalOcean" }))).toBe(
      true,
    );
    expect(isDigitalOceanServer(server({ code: "x", provider: "local" }))).toBe(false);
  });
});
