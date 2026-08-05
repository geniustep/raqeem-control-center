import { KNOWLEDGE_AUTH_PATHS } from "@/lib/knowledge-auth/constants";

/** Knowledge UI / BFF paths (independent from Platform operator auth). */
export function isKnowledgePath(pathname: string): boolean {
  return (
    pathname === "/knowledge" ||
    pathname.startsWith("/knowledge/") ||
    pathname.startsWith("/api/knowledge/")
  );
}

export function isKnowledgeAuthApiPath(pathname: string): boolean {
  return pathname.startsWith("/api/knowledge/auth/");
}

export function isKnowledgeLoginPath(pathname: string): boolean {
  return pathname === KNOWLEDGE_AUTH_PATHS.loginPage;
}

export function isKnowledgeMfaOnboardingPath(pathname: string): boolean {
  return pathname === KNOWLEDGE_AUTH_PATHS.mfaOnboarding;
}

/**
 * Only allow same-origin relative Knowledge redirects.
 */
export function safeKnowledgeCallbackUrl(
  raw: string | null | undefined,
): string {
  const fallback = KNOWLEDGE_AUTH_PATHS.home;
  if (!raw) return fallback;
  const value = raw.trim();
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  if (value === KNOWLEDGE_AUTH_PATHS.loginPage) return fallback;
  if (value.startsWith(`${KNOWLEDGE_AUTH_PATHS.loginPage}?`)) return fallback;
  if (!value.startsWith("/knowledge")) return fallback;
  return value;
}
