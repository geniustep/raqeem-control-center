import "server-only";

import type { DataSourceErrorInfo } from "@/lib/data-source/types";

export class OdooApiError extends Error {
  readonly status: number;
  readonly path: string;

  constructor(path: string, status: number, message?: string) {
    super(message ?? `Odoo API request failed (${status}) for ${path}`);
    this.name = "OdooApiError";
    this.status = status;
    this.path = path;
  }
}

export class OdooConnectionError extends Error {
  readonly cause?: unknown;

  constructor(path: string, cause?: unknown) {
    super(`Unable to reach Odoo API for ${path}`);
    this.name = "OdooConnectionError";
    this.cause = cause;
  }
}

/** Safe operator-facing error — never includes tokens, URLs, or raw exception text. */
export function toPublicDataSourceError(): DataSourceErrorInfo {
  return { code: "odoo_unavailable" };
}

export function odooMisconfiguredError(): DataSourceErrorInfo {
  return { code: "odoo_misconfigured" };
}
