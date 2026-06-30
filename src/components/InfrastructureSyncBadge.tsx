import type { InfrastructureSyncStatus } from "@/types";
import { tInfraSync } from "@/lib/i18n";
import { Pill, type Tone } from "@/components/Pill";

const SYNC_TONE: Record<InfrastructureSyncStatus, Tone> = {
  synced: "green",
  skipped: "gray",
  never: "gray",
  pending: "gray",
  error: "red",
  stale: "amber",
  local: "blue",
};

/** Badge for infrastructure registry sync status — never/skipped are neutral. */
export function InfrastructureSyncBadge({
  status,
  label,
}: {
  status: InfrastructureSyncStatus;
  label?: string;
}) {
  return (
    <Pill tone={SYNC_TONE[status]}>{label ?? tInfraSync(status)}</Pill>
  );
}
