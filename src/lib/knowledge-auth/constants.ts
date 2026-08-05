/** Separate from Platform operator cookie `raqeem_cc_session`. */
export const KNOWLEDGE_SESSION_COOKIE_NAME = "raqeem_knowledge_session";

/** Knowledge session lifetime: 8 hours. */
export const KNOWLEDGE_SESSION_TTL_SECONDS = 8 * 60 * 60;

/** Opaque session schema version for rotation / migration. */
export const KNOWLEDGE_SESSION_VERSION = 1;

export const KNOWLEDGE_AUTH_PATHS = {
  loginApi: "/api/knowledge/auth/login",
  logoutApi: "/api/knowledge/auth/logout",
  meApi: "/api/knowledge/auth/me",
  loginPage: "/knowledge/login",
  mfaOnboarding: "/knowledge/onboarding/mfa",
  home: "/knowledge",
} as const;

/** Upstream Odoo Knowledge auth routes (relative to base URL). */
export const ODOO_KNOWLEDGE_AUTH = {
  login: "/api/v1/control-center/knowledge/auth/login",
  logout: "/api/v1/control-center/knowledge/auth/logout",
  me: "/api/v1/control-center/knowledge/auth/me",
} as const;

export const KNOWLEDGE_UPSTREAM_TIMEOUT_MS = 15_000;

/** Max JSON body size for login BFF (bytes). */
export const KNOWLEDGE_LOGIN_BODY_MAX_BYTES = 4_096;
