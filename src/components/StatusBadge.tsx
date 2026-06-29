import type {
  LifecycleStageStatus,
  OperationStatus,
  TenantOverallStatus,
} from "@/types";
import {
  tLifecycleStatus,
  tOperationStatus,
  tOverall,
} from "@/lib/i18n";
import { Pill, type Tone } from "@/components/Pill";

const OVERALL_TONE: Record<TenantOverallStatus, Tone> = {
  draft: "gray",
  provisioning: "blue",
  live: "green",
  live_with_warnings: "amber",
  blocked: "red",
  maintenance: "amber",
};

const LIFECYCLE_TONE: Record<LifecycleStageStatus, Tone> = {
  done: "green",
  current: "blue",
  warning: "amber",
  blocked: "red",
  pending: "gray",
};

const OPERATION_TONE: Record<OperationStatus, Tone> = {
  available: "blue",
  completed: "green",
  blocked: "red",
  manual_required: "amber",
  disabled: "gray",
};

/** Badge for a tenant's aggregated overall status. */
export function StatusBadge({ status }: { status: TenantOverallStatus }) {
  return <Pill tone={OVERALL_TONE[status]}>{tOverall(status)}</Pill>;
}

/** Badge for a single lifecycle stage state. */
export function LifecycleBadge({ status }: { status: LifecycleStageStatus }) {
  return <Pill tone={LIFECYCLE_TONE[status]}>{tLifecycleStatus(status)}</Pill>;
}

/** Badge for an operation's availability. */
export function OperationBadge({ status }: { status: OperationStatus }) {
  return <Pill tone={OPERATION_TONE[status]}>{tOperationStatus(status)}</Pill>;
}
