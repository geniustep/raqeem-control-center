import type { PlatformEntitlement } from "@/lib/data-source/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function bool(value: unknown): boolean {
  return value === true;
}

function nullableBool(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function nullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function mapPlatformEntitlement(raw: unknown): PlatformEntitlement {
  const root = isRecord(raw) ? raw : {};
  const nested = isRecord(root.entitlement)
    ? root.entitlement
    : isRecord(root.data)
      ? root.data
      : root;

  return {
    tenantId: stringOrNull(nested.tenant_id) ?? "",
    serviceKey: stringOrNull(nested.service_key),
    enabled: bool(nested.enabled),
    effective: bool(nested.effective),
    subscriptionStatus: stringOrNull(nested.subscription_status),
    planKey: stringOrNull(nested.plan_key),
    quota: nullableNumber(nested.quota),
    quotaUnlimited: nullableBool(nested.quota_unlimited),
    effectiveFrom: stringOrNull(nested.effective_from),
    effectiveUntil: stringOrNull(nested.effective_until),
    graceUntil: stringOrNull(nested.grace_until),
    revision: stringOrNull(nested.revision),
    reasonCode: stringOrNull(nested.reason_code) ?? "unknown",
  };
}

export function disabledMockEntitlement(
  tenantCode: string,
  serviceKey: string,
): PlatformEntitlement {
  return {
    tenantId: tenantCode,
    serviceKey,
    enabled: false,
    effective: false,
    subscriptionStatus: null,
    planKey: null,
    quota: null,
    quotaUnlimited: null,
    effectiveFrom: null,
    effectiveUntil: null,
    graceUntil: null,
    revision: null,
    reasonCode: "mock_disabled",
  };
}
