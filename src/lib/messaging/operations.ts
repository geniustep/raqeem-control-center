import "server-only";

export const MESSAGE_STATES = [
  "queued",
  "processing",
  "sent",
  "delivered",
  "read",
  "failed",
] as const;

export type MessageState = (typeof MESSAGE_STATES)[number];

export type MessagingOperationsMessage = {
  internalMessageId: string;
  tenantCode: string;
  provider: string;
  eventKey: string;
  recipientMasked: string;
  state: MessageState;
  attempts: number;
  createdAt: string;
  nextAttemptAt: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  failedAt: string | null;
  errorCode: string | null;
};

export type MessagingOperationsSnapshot = {
  tenantCode: string;
  total: number;
  counts: Record<MessageState, number>;
  messages: MessagingOperationsMessage[];
  generatedAt: string;
};

export type MessagingOperationsResult = {
  data: MessagingOperationsSnapshot | null;
  error: "unconfigured" | "invalid_tenant" | "upstream_unavailable" | "invalid_response" | null;
};

type RawMessage = {
  internal_message_id?: unknown;
  tenant_code?: unknown;
  provider?: unknown;
  event_key?: unknown;
  recipient_masked?: unknown;
  state?: unknown;
  attempts?: unknown;
  created_at?: unknown;
  next_attempt_at?: unknown;
  sent_at?: unknown;
  delivered_at?: unknown;
  read_at?: unknown;
  failed_at?: unknown;
  error_code?: unknown;
};

type RawSnapshot = {
  tenant_code?: unknown;
  total?: unknown;
  counts?: unknown;
  messages?: unknown;
  generated_at?: unknown;
};

const TENANT_CODE_RE = /^[A-Za-z0-9._-]{1,128}$/;
const STATE_SET = new Set<string>(MESSAGE_STATES);

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function mapMessage(value: unknown): MessagingOperationsMessage | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as RawMessage;
  if (
    typeof raw.internal_message_id !== "string" ||
    typeof raw.tenant_code !== "string" ||
    typeof raw.provider !== "string" ||
    typeof raw.event_key !== "string" ||
    typeof raw.recipient_masked !== "string" ||
    typeof raw.state !== "string" ||
    !STATE_SET.has(raw.state) ||
    typeof raw.attempts !== "number" ||
    !Number.isFinite(raw.attempts) ||
    typeof raw.created_at !== "string"
  ) {
    return null;
  }

  return {
    internalMessageId: raw.internal_message_id,
    tenantCode: raw.tenant_code,
    provider: raw.provider,
    eventKey: raw.event_key,
    recipientMasked: raw.recipient_masked,
    state: raw.state as MessageState,
    attempts: raw.attempts,
    createdAt: raw.created_at,
    nextAttemptAt: optionalString(raw.next_attempt_at),
    sentAt: optionalString(raw.sent_at),
    deliveredAt: optionalString(raw.delivered_at),
    readAt: optionalString(raw.read_at),
    failedAt: optionalString(raw.failed_at),
    errorCode: optionalString(raw.error_code),
  };
}

function mapSnapshot(value: unknown): MessagingOperationsSnapshot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as RawSnapshot;
  if (
    typeof raw.tenant_code !== "string" ||
    typeof raw.total !== "number" ||
    !Number.isFinite(raw.total) ||
    typeof raw.generated_at !== "string" ||
    !raw.counts ||
    typeof raw.counts !== "object" ||
    Array.isArray(raw.counts) ||
    !Array.isArray(raw.messages)
  ) {
    return null;
  }

  const rawCounts = raw.counts as Record<string, unknown>;
  const counts = Object.fromEntries(
    MESSAGE_STATES.map((state) => {
      const count = rawCounts[state];
      return [state, typeof count === "number" && Number.isFinite(count) ? count : 0];
    }),
  ) as Record<MessageState, number>;

  const messages: MessagingOperationsMessage[] = [];
  for (const item of raw.messages) {
    const mapped = mapMessage(item);
    if (!mapped) return null;
    messages.push(mapped);
  }

  return {
    tenantCode: raw.tenant_code,
    total: raw.total,
    counts,
    messages,
    generatedAt: raw.generated_at,
  };
}

function getConfig(): { baseUrl: string; token: string } | null {
  const baseUrl = (process.env.RAQEEM_MESSAGING_API_BASE_URL ?? "")
    .trim()
    .replace(/\/+$/, "");
  const token = (process.env.RAQEEM_MESSAGING_READ_TOKEN ?? "").trim();
  if (!baseUrl || !token) return null;
  return { baseUrl, token };
}

export async function loadTenantMessagingOperations(
  tenantCode: string,
  limit = 20,
): Promise<MessagingOperationsResult> {
  const code = tenantCode.trim();
  if (!TENANT_CODE_RE.test(code)) {
    return { data: null, error: "invalid_tenant" };
  }

  const config = getConfig();
  if (!config) {
    return { data: null, error: "unconfigured" };
  }

  const safeLimit = Math.max(1, Math.min(50, Math.trunc(limit) || 20));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(
      `${config.baseUrl}/internal/v1/operations/tenants/${encodeURIComponent(code)}/messages?limit=${safeLimit}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${config.token}`,
        },
        cache: "no-store",
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      return { data: null, error: "upstream_unavailable" };
    }

    const payload: unknown = await response.json();
    const mapped = mapSnapshot(payload);
    if (!mapped || mapped.tenantCode !== code) {
      return { data: null, error: "invalid_response" };
    }

    return { data: mapped, error: null };
  } catch {
    return { data: null, error: "upstream_unavailable" };
  } finally {
    clearTimeout(timeout);
  }
}
