import "server-only";

import { mapPlatformEntitlement } from "@/lib/entitlements/contract";
import type { PlatformEntitlement } from "@/lib/data-source/types";

export const WHATSAPP_SERVICE_KEY = "messaging.whatsapp";

export interface EntitlementWriteConfig {
  apiBaseUrl: string;
  writeToken: string;
  isConfigured: boolean;
}

export type SwitchPayloadResult =
  | { ok: true; enabled: boolean }
  | { ok: false; error: "invalid_payload" };

export type EntitlementWriteResult =
  | { ok: true; entitlement: PlatformEntitlement }
  | { ok: false; error: "upstream_unreachable" | "upstream_rejected" | "upstream_invalid_response" };

export function validateSwitchPayload(body: unknown): SwitchPayloadResult {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "invalid_payload" };
  }
  const record = body as Record<string, unknown>;
  if (Object.keys(record).length !== 1 || typeof record.enabled !== "boolean") {
    return { ok: false, error: "invalid_payload" };
  }
  return { ok: true, enabled: record.enabled };
}

export function getEntitlementWriteConfig(): EntitlementWriteConfig {
  const source = process.env.CONTROL_CENTER_DATA_SOURCE?.trim().toLowerCase();
  const apiBaseUrl = process.env.RAQEEM_PLATFORM_API_BASE_URL?.trim() ?? "";
  const writeToken =
    process.env.RAQEEM_PLATFORM_ENTITLEMENTS_WRITE_TOKEN?.trim() ?? "";
  return {
    apiBaseUrl,
    writeToken,
    isConfigured:
      source === "odoo" && apiBaseUrl.length > 0 && writeToken.length > 0,
  };
}

export async function setWhatsAppEntitlement(
  tenantCode: string,
  enabled: boolean,
  config: Pick<EntitlementWriteConfig, "apiBaseUrl" | "writeToken">,
): Promise<EntitlementWriteResult> {
  const baseUrl = config.apiBaseUrl.replace(/\/+$/, "");
  const url = `${baseUrl}/api/v1/platform/entitlements/${encodeURIComponent(
    tenantCode,
  )}/${WHATSAPP_SERVICE_KEY}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.writeToken}`,
      },
      body: JSON.stringify({ enabled }),
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: "upstream_unreachable" };
  }

  if (!response.ok) {
    return { ok: false, error: "upstream_rejected" };
  }

  let raw: unknown;
  try {
    raw = await response.json();
  } catch {
    return { ok: false, error: "upstream_invalid_response" };
  }

  const entitlement = mapPlatformEntitlement(raw);
  if (
    entitlement.tenantId !== tenantCode ||
    entitlement.serviceKey !== WHATSAPP_SERVICE_KEY ||
    entitlement.enabled !== enabled
  ) {
    return { ok: false, error: "upstream_invalid_response" };
  }

  return { ok: true, entitlement };
}
