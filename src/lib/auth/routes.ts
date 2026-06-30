const PROTECTED_ROOTS = [
  "/tenants",
  "/domains",
  "/operations",
  "/audit",
  "/settings",
] as const;

/** Paths that require an authenticated session. */
export function isProtectedPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PROTECTED_ROOTS.some(
    (root) => pathname === root || pathname.startsWith(`${root}/`),
  );
}

/** Paths that bypass auth middleware checks entirely. */
export function isAuthBypassPath(pathname: string): boolean {
  if (pathname === "/login") return true;
  if (pathname.startsWith("/api/auth/")) return true;
  return false;
}

/**
 * Only allow same-origin relative redirects after login.
 * Rejects protocol-relative and external URLs.
 */
export function safeCallbackUrl(raw: string | null | undefined): string {
  const fallback = "/tenants";
  if (!raw) return fallback;
  const value = raw.trim();
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  if (value === "/login" || value.startsWith("/login?")) return fallback;
  return value;
}
