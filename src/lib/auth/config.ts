import "server-only";

import { SESSION_MAX_AGE_SECONDS } from "./constants";

export interface AuthConfig {
  username: string;
  password: string;
  sessionSecret: string;
  isConfigured: boolean;
}

/** Read operator credentials and session secret from server env only. */
export function getAuthConfig(): AuthConfig {
  const username = process.env.CONTROL_CENTER_AUTH_USERNAME?.trim() ?? "";
  const password = process.env.CONTROL_CENTER_AUTH_PASSWORD ?? "";
  const sessionSecret = process.env.CONTROL_CENTER_SESSION_SECRET?.trim() ?? "";

  return {
    username,
    password,
    sessionSecret,
    isConfigured:
      username.length > 0 &&
      password.length > 0 &&
      sessionSecret.length >= 16,
  };
}

export function getSessionCookieOptions(isProduction: boolean) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
