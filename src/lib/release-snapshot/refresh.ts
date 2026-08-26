import "server-only";

import { mapReleaseReadiness, mapSchoolSnapshot } from "@/lib/release-snapshot/contract";
import type { ReleaseReadiness, SchoolSnapshot } from "@/lib/release-snapshot/types";

export interface SnapshotRefreshConfig {
  apiBaseUrl: string;
  writeToken: string;
  isConfigured: boolean;
}

export type SnapshotRefreshErrorCategory =
  | "CONFIGURATION_ERROR"
  | "AUTH_FAILURE"
  | "CONNECTIVITY_FAILURE"
  | "REMOTE_STATE_ERROR"
  | "SERVER_ERROR"
  | "CONTRACT_ERROR";

export type SnapshotRefreshResult =
  | {
      ok: true;
      snapshot: SchoolSnapshot;
      releaseReadiness: ReleaseReadiness;
      requestId: string | null;
    }
  | {
      ok: false;
      error:
        | "upstream_unreachable"
        | "upstream_rejected"
        | "upstream_invalid_response";
      category?: SnapshotRefreshErrorCategory;
    };

const ERROR_CATEGORIES = new Set<SnapshotRefreshErrorCategory>([
  "CONFIGURATION_ERROR",
  "AUTH_FAILURE",
  "CONNECTIVITY_FAILURE",
  "REMOTE_STATE_ERROR",
  "SERVER_ERROR",
  "CONTRACT_ERROR",
]);

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function getSnapshotRefreshConfig(): SnapshotRefreshConfig {
  const source = process.env.CONTROL_CENTER_DATA_SOURCE?.trim().toLowerCase();
  const apiBaseUrl = process.env.RAQEEM_PLATFORM_API_BASE_URL?.trim() ?? "";
  const writeToken = process.env.RAQEEM_PLATFORM_SNAPSHOT_REFRESH_TOKEN?.trim() ?? "";
  return {
    apiBaseUrl,
    writeToken,
    isConfigured:
      source === "odoo" && apiBaseUrl.length > 0 && writeToken.length > 0,
  };
}

function extractErrorCategory(body: unknown): SnapshotRefreshErrorCategory | undefined {
  const detail = asRecord(asRecord(body).error_detail);
  const raw = detail.error_category;
  return typeof raw === "string" && ERROR_CATEGORIES.has(raw as SnapshotRefreshErrorCategory)
    ? (raw as SnapshotRefreshErrorCategory)
    : undefined;
}

export async function refreshSchoolSnapshot(
  tenantCode: string,
  config: Pick<SnapshotRefreshConfig, "apiBaseUrl" | "writeToken">,
): Promise<SnapshotRefreshResult> {
  const baseUrl = config.apiBaseUrl.replace(/\/+$/, "");
  const url = `${baseUrl}/api/v1/platform/tenants/${encodeURIComponent(
    tenantCode,
  )}/school-snapshot/refresh`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.writeToken}`,
      },
      body: "{}",
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: "upstream_unreachable" };
  }

  let raw: unknown;
  try {
    raw = await response.json();
  } catch {
    return { ok: false, error: "upstream_invalid_response" };
  }

  if (!response.ok) {
    return {
      ok: false,
      error: "upstream_rejected",
      category: extractErrorCategory(raw),
    };
  }

  const root = asRecord(raw);
  const data = asRecord(root.data);
  if (root.success !== true || data.tenant_code !== tenantCode) {
    return { ok: false, error: "upstream_invalid_response" };
  }

  const snapshot = mapSchoolSnapshot(data);
  if (snapshot.observationStatus === "NEVER_OBSERVED") {
    return { ok: false, error: "upstream_invalid_response" };
  }

  const meta = asRecord(root.meta);
  return {
    ok: true,
    snapshot,
    releaseReadiness: mapReleaseReadiness(data.release_readiness),
    requestId: typeof meta.request_id === "string" ? meta.request_id : null,
  };
}
