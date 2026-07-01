import { isMissingTimestamp } from "@/lib/format";
import { HEALTH_CHECK_DISPLAY_ORDER } from "@/lib/i18n";
import type { TenantHealthCheck } from "@/types";

function healthCheckSortIndex(id: string): number {
  const index = HEALTH_CHECK_DISPLAY_ORDER.indexOf(
    id as (typeof HEALTH_CHECK_DISPLAY_ORDER)[number],
  );
  return index === -1 ? HEALTH_CHECK_DISPLAY_ORDER.length + 1 : index;
}

/** Stable probe key used to group historical rows (check_type when mapped, else id). */
export function healthCheckTypeKey(check: TenantHealthCheck): string {
  return check.id;
}

/** Best-effort timestamp for ordering historical rows (ms since epoch, or -1). */
export function healthCheckRecordedAtMs(check: TenantHealthCheck): number {
  const value = check.checkedAt;
  if (!value || isMissingTimestamp(value)) return -1;
  return new Date(value).getTime();
}

/** Keep only the newest row per probe type; preserves full history in the source array. */
export function latestHealthChecksPerType(
  checks: TenantHealthCheck[],
): TenantHealthCheck[] {
  const latestByType = new Map<string, TenantHealthCheck>();

  for (const check of checks) {
    const typeKey = healthCheckTypeKey(check);
    const existing = latestByType.get(typeKey);
    if (!existing) {
      latestByType.set(typeKey, check);
      continue;
    }

    const checkTime = healthCheckRecordedAtMs(check);
    const existingTime = healthCheckRecordedAtMs(existing);

    if (checkTime > existingTime) {
      latestByType.set(typeKey, check);
    } else if (checkTime === existingTime) {
      // Same timestamp (or both missing): prefer the later row in payload order.
      latestByType.set(typeKey, check);
    }
  }

  return [...latestByType.values()].sort((a, b) => {
    const order =
      healthCheckSortIndex(healthCheckTypeKey(a)) -
      healthCheckSortIndex(healthCheckTypeKey(b));
    if (order !== 0) return order;
    return healthCheckTypeKey(a).localeCompare(healthCheckTypeKey(b));
  });
}
