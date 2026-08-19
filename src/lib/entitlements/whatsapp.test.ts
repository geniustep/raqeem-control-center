import { afterEach, describe, expect, it, vi } from "vitest";
import { mapPlatformEntitlement } from "@/lib/entitlements/contract";
import {
  setWhatsAppEntitlement,
  validateSwitchPayload,
  WHATSAPP_SERVICE_KEY,
} from "@/lib/entitlements/whatsapp";

const CONTRACT = {
  entitlement: {
    tenant_id: "school",
    service_key: "messaging.whatsapp",
    enabled: true,
    effective: true,
    subscription_status: "active",
    plan_key: "basic",
    quota: null,
    quota_unlimited: true,
    effective_from: "2026-08-19T00:00:00",
    effective_until: null,
    grace_until: null,
    revision: "2026-08-19T12:00:00",
    reason_code: "active",
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("WhatsApp entitlement contract", () => {
  it("maps the provider-neutral Center response", () => {
    const mapped = mapPlatformEntitlement(CONTRACT);
    expect(mapped).toMatchObject({
      tenantId: "school",
      serviceKey: WHATSAPP_SERVICE_KEY,
      enabled: true,
      effective: true,
      subscriptionStatus: "active",
      planKey: "basic",
      quotaUnlimited: true,
      reasonCode: "active",
    });
  });

  it("accepts only an exact boolean switch payload", () => {
    expect(validateSwitchPayload({ enabled: true })).toEqual({ ok: true, enabled: true });
    expect(validateSwitchPayload({ enabled: "true" }).ok).toBe(false);
    expect(validateSwitchPayload({ enabled: true, tenant_code: "other" }).ok).toBe(false);
    expect(validateSwitchPayload({ provider: "whatsapp" }).ok).toBe(false);
  });
});

describe("WhatsApp entitlement writer", () => {
  it("posts only desired state with the dedicated server token", async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      expect(init?.method).toBe("POST");
      expect(init?.body).toBe(JSON.stringify({ enabled: true }));
      const headers = init?.headers as Record<string, string>;
      expect(headers.Authorization).toBe("Bearer dedicated-write-token");
      expect(String(init?.body)).not.toContain("tenant_code");
      expect(String(init?.body)).not.toContain("provider");
      return new Response(JSON.stringify(CONTRACT), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await setWhatsAppEntitlement("school", true, {
      apiBaseUrl: "http://127.0.0.1:8094",
      writeToken: "dedicated-write-token",
    });

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://127.0.0.1:8094/api/v1/platform/entitlements/school/messaging.whatsapp",
    );
  });

  it("rejects an upstream response for another tenant or state", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            entitlement: {
              ...CONTRACT.entitlement,
              tenant_id: "other",
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    await expect(
      setWhatsAppEntitlement("school", true, {
        apiBaseUrl: "http://127.0.0.1:8094",
        writeToken: "secret",
      }),
    ).resolves.toEqual({ ok: false, error: "upstream_invalid_response" });
  });
});
