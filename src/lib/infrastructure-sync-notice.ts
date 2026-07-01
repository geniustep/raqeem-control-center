import type { InfrastructureServer } from "@/types";
import { isMissingTimestamp } from "@/lib/format";
import { t } from "@/lib/i18n";

export type InfrastructureSyncNoticeKind =
  | "synced"
  | "disabled"
  | "pending"
  | "error"
  | "registry";

export type InfrastructureSyncNoticeVariant = "info" | "warning" | "danger";

export interface InfrastructureSyncNotice {
  kind: InfrastructureSyncNoticeKind;
  variant: InfrastructureSyncNoticeVariant;
  message: string;
  title?: string;
  lastSyncAt?: string;
  errorCount?: number;
}

export function isDigitalOceanServer(server: InfrastructureServer): boolean {
  return server.provider.trim().toLowerCase() === "digitalocean";
}

function latestInfraCheckAt(servers: InfrastructureServer[]): string | undefined {
  let best: string | undefined;
  let bestTime = -1;

  for (const server of servers) {
    const value = server.lastInfraCheckAt;
    if (!value || isMissingTimestamp(value)) continue;
    const time = new Date(value).getTime();
    if (time > bestTime) {
      bestTime = time;
      best = value;
    }
  }

  return best;
}

/** Derive the operator-facing sync notice for /infrastructure. */
export function deriveInfrastructureSyncNotice(
  servers: InfrastructureServer[],
): InfrastructureSyncNotice {
  const N = t.infrastructure.syncNotice;
  const doServers = servers.filter(isDigitalOceanServer);
  const errorServers = servers.filter((s) => s.infraSyncStatus === "error");
  const pendingServers = servers.filter((s) => s.infraSyncStatus === "pending");
  const syncedDoServers = doServers.filter((s) => s.infraSyncStatus === "synced");

  if (errorServers.length > 0) {
    return {
      kind: "error",
      variant: "danger",
      title: N.errorTitle,
      message: N.error,
      errorCount: errorServers.length,
    };
  }

  if (pendingServers.length > 0) {
    return {
      kind: "pending",
      variant: "warning",
      message: N.pending,
    };
  }

  if (syncedDoServers.length > 0) {
    return {
      kind: "synced",
      variant: "info",
      message: N.syncedSuccess,
      lastSyncAt: latestInfraCheckAt(syncedDoServers),
    };
  }

  const allDoNeverOrSkipped =
    doServers.length > 0 &&
    doServers.every(
      (s) => s.infraSyncStatus === "never" || s.infraSyncStatus === "skipped",
    );
  const noDoCheckTimes = doServers.every(
    (s) => !s.lastInfraCheckAt || isMissingTimestamp(s.lastInfraCheckAt),
  );

  if (doServers.length === 0 || (allDoNeverOrSkipped && noDoCheckTimes)) {
    return {
      kind: "disabled",
      variant: "info",
      message: N.disabled,
    };
  }

  return {
    kind: "registry",
    variant: "info",
    message: N.registryOnly,
  };
}
