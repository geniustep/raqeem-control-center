import type { NextRequest } from "next/server";

/**
 * Same-origin protection for Knowledge BFF mutations.
 * Dedicated CSRF tokens deferred to later Knowledge write stages.
 */
export function isAllowedKnowledgeMutationOrigin(
  request: NextRequest,
  isProduction = process.env.NODE_ENV === "production",
): boolean {
  const host = request.headers.get("host");
  if (!host) return false;

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "same-origin" || fetchSite === "none") {
    return true;
  }

  // In development, allow missing Origin for local tooling.
  if (!isProduction && !origin) return true;

  // Production: reject credentialed mutations without Origin/same-origin signal.
  return false;
}
