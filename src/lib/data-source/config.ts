import "server-only";

/** Which backend supplies platform read-only data. */
export type ControlCenterDataSource = "mock" | "odoo";

export interface DataSourceConfig {
  source: ControlCenterDataSource;
  apiBaseUrl: string;
  apiToken: string;
  isApiConfigured: boolean;
}

/** Read server-side env (never expose token/URL to the client). */
export function getDataSourceConfig(): DataSourceConfig {
  const raw = process.env.CONTROL_CENTER_DATA_SOURCE?.trim().toLowerCase();
  const source: ControlCenterDataSource = raw === "odoo" ? "odoo" : "mock";
  const apiBaseUrl = process.env.RAQEEM_PLATFORM_API_BASE_URL?.trim() ?? "";
  const apiToken = process.env.RAQEEM_PLATFORM_API_TOKEN?.trim() ?? "";

  return {
    source,
    apiBaseUrl,
    apiToken,
    isApiConfigured: source === "odoo" && apiBaseUrl.length > 0,
  };
}

export function isMockDataSource(): boolean {
  return getDataSourceConfig().source === "mock";
}

export function isOdooDataSource(): boolean {
  return getDataSourceConfig().source === "odoo";
}

/** Production with Odoo configured — no silent mock fallback on API failure. */
export function isProductionStrictOdoo(): boolean {
  return (
    process.env.NODE_ENV === "production" &&
    getDataSourceConfig().source === "odoo"
  );
}

/** Safe subset for the settings page — no secrets, no full URL. */
export interface PublicDataSourceInfo {
  configuredSource: ControlCenterDataSource;
  apiConfigured: boolean;
}

export function getPublicDataSourceInfo(): PublicDataSourceInfo {
  const { source, isApiConfigured } = getDataSourceConfig();
  return {
    configuredSource: source,
    apiConfigured: isApiConfigured,
  };
}
