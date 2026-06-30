import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { verifyOperatorCredentials } from "./credentials";
import {
  isAuthBypassPath,
  isProtectedPath,
  safeCallbackUrl,
} from "./routes";
import {
  createSessionPayload,
  createSessionToken,
  verifySessionToken,
} from "./session";

describe("auth routes", () => {
  it("marks control center pages as protected", () => {
    expect(isProtectedPath("/")).toBe(true);
    expect(isProtectedPath("/tenants")).toBe(true);
    expect(isProtectedPath("/tenants/alwah")).toBe(true);
    expect(isProtectedPath("/domains")).toBe(true);
    expect(isProtectedPath("/operations")).toBe(true);
    expect(isProtectedPath("/audit")).toBe(true);
    expect(isProtectedPath("/settings")).toBe(true);
  });

  it("does not protect login or auth API routes", () => {
    expect(isProtectedPath("/login")).toBe(false);
    expect(isAuthBypassPath("/login")).toBe(true);
    expect(isAuthBypassPath("/api/auth/login")).toBe(true);
    expect(isAuthBypassPath("/api/auth/logout")).toBe(true);
  });

  it("sanitizes callback URLs", () => {
    expect(safeCallbackUrl("/domains")).toBe("/domains");
    expect(safeCallbackUrl("//evil.test")).toBe("/tenants");
    expect(safeCallbackUrl("https://evil.test")).toBe("/tenants");
    expect(safeCallbackUrl("/login")).toBe("/tenants");
    expect(safeCallbackUrl(null)).toBe("/tenants");
  });
});

describe("session tokens", () => {
  const secret = "test-session-secret-min-16";

  it("creates and verifies a signed session", async () => {
    const token = await createSessionToken(secret);
    const payload = await verifySessionToken(token, secret);
    expect(payload).not.toBeNull();
    expect(payload!.exp).toBeGreaterThan(payload!.iat);
  });

  it("rejects tampered tokens", async () => {
    const token = await createSessionToken(secret);
    const tampered = `${token}x`;
    expect(await verifySessionToken(tampered, secret)).toBeNull();
  });

  it("rejects expired sessions", async () => {
    const expired = createSessionPayload(Math.floor(Date.now() / 1000) - 7200);
    expired.exp = expired.iat + 60;
    const token = await createSessionToken(secret, expired);
    expect(await verifySessionToken(token, secret)).toBeNull();
  });
});

describe("operator credentials", () => {
  it("accepts exact credentials", () => {
    expect(
      verifyOperatorCredentials("ops", "secret-pass", "ops", "secret-pass"),
    ).toBe(true);
  });

  it("rejects invalid credentials without throwing", () => {
    expect(
      verifyOperatorCredentials("ops", "secret-pass", "ops", "wrong"),
    ).toBe(false);
    expect(
      verifyOperatorCredentials("ops", "secret-pass", "wrong", "secret-pass"),
    ).toBe(false);
  });
});

describe("getAuthConfig", () => {
  const keys = [
    "CONTROL_CENTER_AUTH_USERNAME",
    "CONTROL_CENTER_AUTH_PASSWORD",
    "CONTROL_CENTER_SESSION_SECRET",
  ] as const;

  const saved: Partial<Record<(typeof keys)[number], string | undefined>> = {};

  beforeEach(() => {
    for (const key of keys) {
      saved[key] = process.env[key];
    }
  });

  afterEach(async () => {
    for (const key of keys) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
    await import("./config");
  });

  it("reports configured when all env vars are present", async () => {
    process.env.CONTROL_CENTER_AUTH_USERNAME = "ops-user";
    process.env.CONTROL_CENTER_AUTH_PASSWORD = "ops-pass";
    process.env.CONTROL_CENTER_SESSION_SECRET = "a".repeat(32);

    const { getAuthConfig } = await import("./config");
    const config = getAuthConfig();
    expect(config.isConfigured).toBe(true);
    expect(config.username).toBe("ops-user");
  });

  it("reports not configured when session secret is too short", async () => {
    process.env.CONTROL_CENTER_AUTH_USERNAME = "ops-user";
    process.env.CONTROL_CENTER_AUTH_PASSWORD = "ops-pass";
    process.env.CONTROL_CENTER_SESSION_SECRET = "short";

    const { getAuthConfig } = await import("./config");
    expect(getAuthConfig().isConfigured).toBe(false);
  });
});
