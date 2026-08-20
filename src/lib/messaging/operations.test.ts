import { afterEach, describe, expect, it, vi } from "vitest";
import { loadTenantMessagingOperations } from "@/lib/messaging/operations";

const ORIGINAL_BASE_URL = process.env.RAQEEM_MESSAGING_API_BASE_URL;
const ORIGINAL_TOKEN = process.env.RAQEEM_MESSAGING_READ_TOKEN;

const SNAPSHOT = {
  tenant_code: "school",
  total: 3,
  counts: {
    queued: 0,
    processing: 0,
    sent: 1,
    delivered: 1,
    read: 1,
    failed: 0,
  },
  messages: [
    {
      internal_message_id: "06eae1e7-1080-4bfe-a197-b1af7908f243",
      tenant_code: "school",
      provider: "whatsapp",
      event_key: "ACCOUNT_CREATED",
      recipient_masked: "+212•••••6497",
      state: "read",
      attempts: 1,
      created_at: "2026-08-20T18:45:35.697484",
      next_attempt_at: null,
      sent_at: "2026-08-20T18:45:42.478856",
      delivered_at: "2026-08-20T18:45:50",
      read_at: "2026-08-20T18:47:16",
      failed_at: null,
      error_code: null,
    },
  ],
  generated_at: "2026-08-20T18:48:00Z",
};

function configure() {
  process.env.RAQEEM_MESSAGING_API_BASE_URL = "https://messaging.test/";
  process.env.RAQEEM_MESSAGING_READ_TOKEN = "dedicated-read-token";
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();

  if (ORIGINAL_BASE_URL === undefined) {
    delete process.env.RAQEEM_MESSAGING_API_BASE_URL;
  } else {
    process.env.RAQEEM_MESSAGING_API_BASE_URL = ORIGINAL_BASE_URL;
  }

  if (ORIGINAL_TOKEN === undefined) {
    delete process.env.RAQEEM_MESSAGING_READ_TOKEN;
  } else {
    process.env.RAQEEM_MESSAGING_READ_TOKEN = ORIGINAL_TOKEN;
  }
});

describe("Messaging operations client", () => {
  it("fails closed when the server-side channel is unconfigured", async () => {
    delete process.env.RAQEEM_MESSAGING_API_BASE_URL;
    delete process.env.RAQEEM_MESSAGING_READ_TOKEN;

    await expect(loadTenantMessagingOperations("school")).resolves.toEqual({
      data: null,
      error: "unconfigured",
    });
  });

  it("uses the dedicated bearer token and maps the tenant snapshot", async () => {
    configure();
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      expect(init?.method).toBe("GET");
      expect(init?.cache).toBe("no-store");
      const headers = init?.headers as Record<string, string>;
      expect(headers.Authorization).toBe("Bearer dedicated-read-token");
      return new Response(JSON.stringify(SNAPSHOT), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await loadTenantMessagingOperations("school", 20);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://messaging.test/internal/v1/operations/tenants/school/messages?limit=20",
    );
    expect(result.error).toBeNull();
    expect(result.data).toMatchObject({
      tenantCode: "school",
      total: 3,
      counts: { sent: 1, delivered: 1, read: 1, failed: 0 },
    });
    expect(result.data?.messages[0]).toMatchObject({
      internalMessageId: "06eae1e7-1080-4bfe-a197-b1af7908f243",
      recipientMasked: "+212•••••6497",
      state: "read",
      attempts: 1,
      errorCode: null,
    });
  });

  it("rejects a snapshot scoped to another tenant", async () => {
    configure();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ ...SNAPSHOT, tenant_code: "other" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(loadTenantMessagingOperations("school")).resolves.toEqual({
      data: null,
      error: "invalid_response",
    });
  });

  it("rejects malformed message metadata", async () => {
    configure();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            ...SNAPSHOT,
            messages: [{ ...SNAPSHOT.messages[0], recipient_masked: null }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    await expect(loadTenantMessagingOperations("school")).resolves.toEqual({
      data: null,
      error: "invalid_response",
    });
  });

  it("does not call upstream for an invalid tenant code", async () => {
    configure();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(loadTenantMessagingOperations("school/other")).resolves.toEqual({
      data: null,
      error: "invalid_tenant",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
