/**
 * Small formatting helpers. Dates are rendered with a fixed, locale-independent
 * format to keep server and client output identical (no hydration mismatch).
 */

const pad = (n: number) => String(n).padStart(2, "0");

/** Format an ISO timestamp as `YYYY-MM-DD HH:mm` in UTC. */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(
    d.getUTCDate(),
  )} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
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
