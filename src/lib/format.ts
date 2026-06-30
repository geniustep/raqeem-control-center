/**
 * Small formatting helpers. Dates are rendered with a fixed, locale-independent
 * format to keep server and client output identical (no hydration mismatch).
 */

const pad = (n: number) => String(n).padStart(2, "0");

/** Placeholder when a timestamp is absent or unusable (never show Unix epoch). */
export const MISSING_DATE_LABEL = "غير معروف";

/** True when the value should not be rendered as a calendar date. */
export function isMissingTimestamp(value: string | null | undefined): boolean {
  if (value == null || value === "") return true;
  const t = new Date(value).getTime();
  return Number.isNaN(t) || t === 0;
}

function asValidTimestamp(value: string | null | undefined): string | null {
  if (isMissingTimestamp(value)) return null;
  return value!;
}

/** Format an ISO timestamp as `YYYY-MM-DD HH:mm` in UTC. */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(
    d.getUTCDate(),
  )} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

/** Like {@link formatDateTime} but returns a human placeholder for null/epoch values. */
export function formatOptionalDateTime(
  value: string | null | undefined,
  fallback = MISSING_DATE_LABEL,
): string {
  const iso = asValidTimestamp(value);
  if (iso === null) return fallback;
  return formatDateTime(iso);
}

/** Format an ISO timestamp as `YYYY-MM-DD` in UTC. */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Boolean -> Arabic yes/no helper used across panels. */
export function boolText(v: boolean, yes = "نعم", no = "لا"): string {
  return v ? yes : no;
}

const SECRET_FIELD_PATTERN =
  /(password|passwd|token|secret|api[_-]?key|private[_-]?key)\s*[:=]\s*\S+/gi;
const UNIX_PATH_PATTERN = /(?:\/[\w.-]+){2,}/g;
const WIN_PATH_PATTERN = /[A-Za-z]:\\(?:[\w.-]+\\)+[\w.-]+/g;

/** Strip sensitive paths and credential-like fragments from health-check messages. */
export function sanitizeHealthCheckMessage(message: string): string {
  let s = message.trim();
  if (s.length === 0) return s;

  if (/^(stdout|stderr|command output)\b/i.test(s)) {
    return "تفاصيل تقنية مخفية";
  }

  s = s.replace(SECRET_FIELD_PATTERN, "$1=[مخفي]");
  s = s.replace(UNIX_PATH_PATTERN, (match) => {
    const parts = match.split("/");
    return `…/${parts[parts.length - 1]}`;
  });
  s = s.replace(WIN_PATH_PATTERN, (match) => {
    const parts = match.split("\\");
    return `…\\${parts[parts.length - 1]}`;
  });

  if (s.length > 500) {
    return `${s.slice(0, 497)}…`;
  }
  return s;
}
