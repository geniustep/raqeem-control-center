import "server-only";

import { OPERATION_ORDER } from "@/lib/operation-catalog";

export const ALLOWED_CLIENT_KEYS = [
  "tenant_code",
  "operation_code",
  "source",
  "dry_run_report",
  "preflight_checks",
  "theoretical_steps",
  "client_request_id",
] as const;

export const FORBIDDEN_CLIENT_KEYS = [
  "operation_name",
  "severity",
  "risk_level",
  "actor",
  "timestamp",
  "token",
  "command",
  "ssh",
  "password",
  "secret",
  "private_key",
  "env",
] as const;

/** Top-level keys that must never be sent to Odoo simulated-dry-run. */
export const FORBIDDEN_ODOO_UPSTREAM_KEYS = [
  "operation_name",
  "severity",
  "risk_level",
  "actor",
  "timestamp",
  "command",
  "shell",
  "script",
  "ssh",
  "exec",
  "execute",
  "run",
  "restart",
  "upgrade",
  "password",
  "token",
  "secret",
  "private_key",
  "env",
] as const;

export const ALLOWED_ODOO_UPSTREAM_KEYS = [
  "tenant_code",
  "operation_code",
  "source",
  "dry_run_report",
  "preflight_checks",
  "theoretical_steps",
  "client_request_id",
] as const;

const ALLOWED_KEY_SET = new Set<string>(ALLOWED_CLIENT_KEYS);
const FORBIDDEN_KEY_SET = new Set<string>(
  FORBIDDEN_CLIENT_KEYS.map((k) => k.toLowerCase()),
);
const VALID_OPERATION_CODES = new Set<string>(OPERATION_ORDER);

export interface ValidatedClientPayload {
  tenant_code: string;
  operation_code: string;
  source: "ops_ui";
  dry_run_report: Record<string, unknown>;
  preflight_checks: Array<{ label: string; status: string }>;
  theoretical_steps: string[];
  client_request_id: string;
}

export type ClientPayloadValidationResult =
  | { ok: true; data: ValidatedClientPayload }
  | { ok: false; error: string; status: number };

export interface AuditWriteConfig {
  apiBaseUrl: string;
  writeToken: string;
  isConfigured: boolean;
}

export interface SafeAuditWriteSuccess {
  ok: true;
  auditLogId: string;
  actionType: string;
  result: string;
}

export interface SafeAuditWriteFailure {
  ok: false;
  error: string;
}

export type SafeAuditWriteResponse = SafeAuditWriteSuccess | SafeAuditWriteFailure;

/** Read server-side audit write env — never expose to the client. */
export function getAuditWriteConfig(): AuditWriteConfig {
  const apiBaseUrl = process.env.RAQEEM_PLATFORM_API_BASE_URL?.trim() ?? "";
  const writeToken = process.env.RAQEEM_PLATFORM_AUDIT_WRITE_TOKEN?.trim() ?? "";
  return {
    apiBaseUrl,
    writeToken,
    isConfigured: apiBaseUrl.length > 0 && writeToken.length > 0,
  };
}

function normalizeKey(key: string): string {
  return key.trim().toLowerCase();
}

/** Collect object keys that are forbidden anywhere in the payload tree. */
export function findForbiddenClientKeys(
  value: unknown,
  path = "",
): string[] {
  if (value === null || typeof value !== "object") return [];

  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      findForbiddenClientKeys(item, `${path}[${index}]`),
    );
  }

  const hits: string[] = [];
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const normalized = normalizeKey(key);
    const keyPath = path ? `${path}.${key}` : key;
    if (FORBIDDEN_KEY_SET.has(normalized)) {
      hits.push(keyPath);
    }
    hits.push(...findForbiddenClientKeys(nested, keyPath));
  }
  return hits;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validatePreflightChecks(
  value: unknown,
): Array<{ label: string; status: string }> | null {
  if (!Array.isArray(value)) return null;
  const checks: Array<{ label: string; status: string }> = [];
  for (const item of value) {
    if (!isPlainObject(item)) return null;
    if (!isNonEmptyString(item.label) || !isNonEmptyString(item.status)) {
      return null;
    }
    checks.push({ label: item.label.trim(), status: item.status.trim() });
  }
  return checks;
}

function validateTheoreticalSteps(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  if (!value.every((step) => typeof step === "string" && step.trim().length > 0)) {
    return null;
  }
  return value.map((step) => step.trim());
}

/** Validate and sanitize the client POST body — rejects forbidden and unknown keys. */
export function validateClientSimulatedDryRunPayload(
  body: unknown,
): ClientPayloadValidationResult {
  if (!isPlainObject(body)) {
    return { ok: false, error: "invalid_payload", status: 400 };
  }

  const forbidden = findForbiddenClientKeys(body);
  if (forbidden.length > 0) {
    return { ok: false, error: "forbidden_fields", status: 400 };
  }

  const topLevelKeys = Object.keys(body);
  const unknownKeys = topLevelKeys.filter((key) => !ALLOWED_KEY_SET.has(key));
  if (unknownKeys.length > 0) {
    return { ok: false, error: "unknown_fields", status: 400 };
  }

  for (const required of ALLOWED_CLIENT_KEYS) {
    if (!(required in body)) {
      return { ok: false, error: "missing_fields", status: 400 };
    }
  }

  if (!isNonEmptyString(body.tenant_code)) {
    return { ok: false, error: "invalid_tenant_code", status: 400 };
  }

  if (!isNonEmptyString(body.operation_code)) {
    return { ok: false, error: "invalid_operation_code", status: 400 };
  }

  const operationCode = body.operation_code.trim();
  if (!VALID_OPERATION_CODES.has(operationCode)) {
    return { ok: false, error: "invalid_operation_code", status: 400 };
  }

  if (body.source !== "ops_ui") {
    return { ok: false, error: "invalid_source", status: 400 };
  }

  if (!isPlainObject(body.dry_run_report)) {
    return { ok: false, error: "invalid_dry_run_report", status: 400 };
  }

  const preflightChecks = validatePreflightChecks(body.preflight_checks);
  if (!preflightChecks) {
    return { ok: false, error: "invalid_preflight_checks", status: 400 };
  }

  const theoreticalSteps = validateTheoreticalSteps(body.theoretical_steps);
  if (!theoreticalSteps) {
    return { ok: false, error: "invalid_theoretical_steps", status: 400 };
  }

  if (!isNonEmptyString(body.client_request_id)) {
    return { ok: false, error: "invalid_client_request_id", status: 400 };
  }

  return {
    ok: true,
    data: {
      tenant_code: body.tenant_code.trim(),
      operation_code: operationCode,
      source: "ops_ui",
      dry_run_report: body.dry_run_report,
      preflight_checks: preflightChecks,
      theoretical_steps: theoreticalSteps,
      client_request_id: body.client_request_id.trim(),
    },
  };
}

function pickSafeString(record: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }
  return "";
}

/** Build the Odoo upstream body — allowed keys only, no server enrichment. */
export function buildOdooUpstreamPayload(
  clientPayload: ValidatedClientPayload,
): Record<string, unknown> {
  return {
    tenant_code: clientPayload.tenant_code,
    operation_code: clientPayload.operation_code,
    source: clientPayload.source,
    dry_run_report: clientPayload.dry_run_report,
    preflight_checks: clientPayload.preflight_checks,
    theoretical_steps: clientPayload.theoretical_steps,
    client_request_id: clientPayload.client_request_id,
  };
}

function parseOdooAuditSuccess(raw: Record<string, unknown>): SafeAuditWriteSuccess | null {
  const auditLog = raw.audit_log;
  if (isPlainObject(auditLog)) {
    const auditLogId = pickSafeString(auditLog, "id", "auditLogId", "audit_log_id");
    const actionType = pickSafeString(
      auditLog,
      "action_type",
      "actionType",
      "action",
    );
    const result = pickSafeString(auditLog, "result", "status");
    if (auditLogId) {
      return {
        ok: true,
        auditLogId,
        actionType: actionType || "simulated_dry_run",
        result: result || "recorded",
      };
    }
  }

  const auditLogId = pickSafeString(raw, "auditLogId", "audit_log_id", "id");
  const actionType = pickSafeString(raw, "actionType", "action_type", "action");
  const result = pickSafeString(raw, "result", "status");
  if (!auditLogId) return null;

  return {
    ok: true,
    auditLogId,
    actionType: actionType || "simulated_dry_run",
    result: result || "recorded",
  };
}

/** Forward a validated client payload to Odoo using the server-side write token. */
export async function postSimulatedDryRunToOdoo(
  clientPayload: ValidatedClientPayload,
  config: Pick<AuditWriteConfig, "apiBaseUrl" | "writeToken">,
): Promise<SafeAuditWriteResponse> {
  const baseUrl = config.apiBaseUrl.replace(/\/+$/, "");
  const url = `${baseUrl}/api/v1/platform/audit/simulated-dry-run`;
  const odooPayload = buildOdooUpstreamPayload(clientPayload);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.writeToken}`,
      },
      body: JSON.stringify(odooPayload),
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

  if (!isPlainObject(raw)) {
    return { ok: false, error: "upstream_invalid_response" };
  }

  const parsed = parseOdooAuditSuccess(raw);
  if (!parsed) {
    return { ok: false, error: "upstream_invalid_response" };
  }

  return parsed;
}
