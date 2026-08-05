import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { isProtectedPath } from "@/lib/auth/routes";
import {
  KnowledgeOdooAuthClient,
  KnowledgeUpstreamError,
  deriveKnowledgeAccessReady,
  normalizeCookieHeader,
  parseOdooKnowledgeUser,
} from "@/lib/knowledge-auth/client";
import { getKnowledgeAuthConfig } from "@/lib/knowledge-auth/config";
import {
  KNOWLEDGE_SESSION_COOKIE_NAME,
  KNOWLEDGE_SESSION_TTL_SECONDS,
} from "@/lib/knowledge-auth/constants";
import {
  mapUpstreamAuthError,
  shouldClearSessionOnError,
} from "@/lib/knowledge-auth/errors";
import { isAllowedKnowledgeMutationOrigin } from "@/lib/knowledge-auth/origin";
import {
  assertNoSensitiveClientFields,
  toPublicUser,
} from "@/lib/knowledge-auth/public-user";
import {
  isKnowledgeAuthApiPath,
  isKnowledgeLoginPath,
  isKnowledgePath,
  safeKnowledgeCallbackUrl,
} from "@/lib/knowledge-auth/routes";
import {
  createKnowledgeSessionPayload,
  decryptKnowledgeSession,
  encryptKnowledgeSession,
  knowledgeSessionCryptoMode,
  mergeLiveUserIntoSession,
} from "@/lib/knowledge-auth/session";
import type { OdooKnowledgeUserSnapshot } from "@/lib/knowledge-auth/types";

const ENCRYPTION_KEY = "knowledge-test-encryption-key-32b!!";

function sampleUser(
  overrides: Partial<OdooKnowledgeUserSnapshot> = {},
): OdooKnowledgeUserSnapshot {
  return {
    user_id: 42,
    login: "editor@raqeem.test",
    display_name: "محرر المعرفة",
    roles: ["knowledge_editor"],
    capabilities: ["knowledge.item.read"],
    mfa_available: true,
    mfa_enabled: true,
    knowledge_access_ready: true,
    active: true,
    is_internal_user: true,
    ...overrides,
  };
}

describe("knowledge auth coexistence", () => {
  it("uses a distinct cookie from the Platform operator session", () => {
    expect(KNOWLEDGE_SESSION_COOKIE_NAME).toBe("raqeem_knowledge_session");
    expect(KNOWLEDGE_SESSION_COOKIE_NAME).not.toBe(SESSION_COOKIE_NAME);
  });

  it("does not treat /knowledge as a Platform-protected path", () => {
    expect(isProtectedPath("/knowledge")).toBe(false);
    expect(isProtectedPath("/knowledge/login")).toBe(false);
    expect(isKnowledgePath("/knowledge")).toBe(true);
    expect(isKnowledgeLoginPath("/knowledge/login")).toBe(true);
    expect(isKnowledgeAuthApiPath("/api/knowledge/auth/login")).toBe(true);
  });
});

describe("knowledge session encryption", () => {
  it("uses authenticated encryption (JWE A256GCM), not HMAC-only", () => {
    expect(knowledgeSessionCryptoMode()).toBe("jwe-a256gcm");
  });

  it("encrypts and decrypts a valid 8-hour session", async () => {
    const payload = createKnowledgeSessionPayload({
      user: sampleUser(),
      upstreamSessionMaterial: "session_id=UPSTREAM-SECRET",
      ttlSeconds: KNOWLEDGE_SESSION_TTL_SECONDS,
      nowSeconds: 1_700_000_000,
    });

    expect(payload.expires_at - payload.issued_at).toBe(
      KNOWLEDGE_SESSION_TTL_SECONDS,
    );

    const token = await encryptKnowledgeSession(payload, ENCRYPTION_KEY);
    const restored = await decryptKnowledgeSession(
      token,
      ENCRYPTION_KEY,
      1_700_000_000,
    );

    expect(restored).not.toBeNull();
    expect(restored!.user_id).toBe(42);
    expect(restored!.upstream_session_material).toBe(
      "session_id=UPSTREAM-SECRET",
    );
    expect(restored!.expires_at - restored!.issued_at).toBe(28800);
  });

  it("rejects expired sessions", async () => {
    const payload = createKnowledgeSessionPayload({
      user: sampleUser(),
      upstreamSessionMaterial: "abc",
      ttlSeconds: 60,
      nowSeconds: 1_700_000_000,
    });
    const token = await encryptKnowledgeSession(payload, ENCRYPTION_KEY);
    expect(
      await decryptKnowledgeSession(token, ENCRYPTION_KEY, 1_700_000_000 + 120),
    ).toBeNull();
  });

  it("rejects tampered sessions", async () => {
    const payload = createKnowledgeSessionPayload({
      user: sampleUser(),
      upstreamSessionMaterial: "abc",
    });
    const token = await encryptKnowledgeSession(payload, ENCRYPTION_KEY);
    const tampered = `${token.slice(0, -4)}xxxx`;
    expect(await decryptKnowledgeSession(tampered, ENCRYPTION_KEY)).toBeNull();
  });

  it("never includes sensitive fields in public user projection", () => {
    const payload = createKnowledgeSessionPayload({
      user: sampleUser(),
      upstreamSessionMaterial: "RAW-ODOO-SESSION",
    });
    const publicUser = toPublicUser(payload);
    expect(publicUser).not.toHaveProperty("upstream_session_material");
    expect(publicUser).not.toHaveProperty("session_id");
    expect(publicUser).not.toHaveProperty("password");
    assertNoSensitiveClientFields(publicUser as unknown as Record<string, unknown>);
  });
});

describe("knowledge cookie options", () => {
  it("sets HttpOnly / SameSite / Secure contract helpers", async () => {
    const { getKnowledgeSessionCookieOptions } = await import(
      "@/lib/knowledge-auth/config"
    );
    const prod = getKnowledgeSessionCookieOptions(true, 28800);
    expect(prod.httpOnly).toBe(true);
    expect(prod.secure).toBe(true);
    expect(prod.sameSite).toBe("lax");
    expect(prod.path).toBe("/");
    expect(prod.maxAge).toBe(28800);

    const dev = getKnowledgeSessionCookieOptions(false, 28800);
    expect(dev.secure).toBe(false);
  });
});

describe("knowledge routes helpers", () => {
  it("sanitizes knowledge callback URLs", () => {
    expect(safeKnowledgeCallbackUrl("/knowledge")).toBe("/knowledge");
    expect(safeKnowledgeCallbackUrl("//evil.test")).toBe("/knowledge");
    expect(safeKnowledgeCallbackUrl("/tenants")).toBe("/knowledge");
    expect(safeKnowledgeCallbackUrl("/knowledge/login")).toBe("/knowledge");
  });
});

describe("origin protection", () => {
  it("accepts matching Origin host", () => {
    const request = {
      headers: new Headers({
        host: "localhost:3000",
        origin: "http://localhost:3000",
      }),
    } as unknown as import("next/server").NextRequest;
    expect(isAllowedKnowledgeMutationOrigin(request, true)).toBe(true);
  });

  it("rejects cross-site Origin in production", () => {
    const request = {
      headers: new Headers({
        host: "localhost:3000",
        origin: "https://evil.test",
      }),
    } as unknown as import("next/server").NextRequest;
    expect(isAllowedKnowledgeMutationOrigin(request, true)).toBe(false);
  });
});

describe("error mapping", () => {
  it("maps upstream codes and statuses safely", () => {
    expect(mapUpstreamAuthError({ status: 401 })).toBe("invalid_credentials");
    expect(mapUpstreamAuthError({ status: 429 })).toBe("rate_limited");
    expect(mapUpstreamAuthError({ status: 503 })).toBe("upstream_unavailable");
    expect(
      mapUpstreamAuthError({ status: 403, code: "knowledge_role_required" }),
    ).toBe("knowledge_role_required");
  });

  it("clears session on identity revocation errors", () => {
    expect(shouldClearSessionOnError("user_inactive")).toBe(true);
    expect(shouldClearSessionOnError("knowledge_role_required")).toBe(true);
    expect(shouldClearSessionOnError("rate_limited")).toBe(false);
  });
});

describe("odoo knowledge user parsing", () => {
  it("derives ready=false when MFA is disabled", () => {
    expect(
      deriveKnowledgeAccessReady({
        mfa_enabled: false,
        roles: ["knowledge_editor"],
        capabilities: [],
      }),
    ).toBe(false);
  });

  it("parses nested user payloads", () => {
    const user = parseOdooKnowledgeUser({
      user: {
        id: 7,
        login: "reviewer@raqeem.test",
        display_name: "مراجع",
        roles: ["knowledge_reviewer"],
        capabilities: [],
        mfa_available: true,
        mfa_enabled: false,
        active: true,
        is_internal_user: true,
      },
    });
    expect(user.user_id).toBe(7);
    expect(user.knowledge_access_ready).toBe(false);
  });
});

describe("KnowledgeOdooAuthClient", () => {
  it("creates a Next-facing login result without exposing service bearer usage", async () => {
    const fetchImpl = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          ok: true,
          data: {
            user: sampleUser({ mfa_enabled: false, knowledge_access_ready: false }),
            session_id: "ODOO-SESSION-XYZ",
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    });

    const client = new KnowledgeOdooAuthClient({
      baseUrl: "https://odoo.test",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const result = await client.login({
      login: "editor@raqeem.test",
      password: "secret",
      requestId: "req-1",
    });

    expect(result.upstreamSessionMaterial).toBe("ODOO-SESSION-XYZ");
    expect(result.user.knowledge_access_ready).toBe(false);

    expect(fetchImpl).toHaveBeenCalled();
    const call = fetchImpl.mock.calls[0] as unknown as [
      string,
      { headers?: Record<string, string>; body?: string },
    ];
    expect(String(call[0])).toContain(
      "/api/v1/control-center/knowledge/auth/login",
    );
    expect(call[1]?.headers?.Authorization).toBeUndefined();
    expect(String(call[1]?.body)).not.toContain("Bearer");
  });

  it("maps invalid credentials without account enumeration specifics", async () => {
    const fetchImpl = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          ok: false,
          error: { code: "invalid_credentials", message: "nope" },
        }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    });

    const client = new KnowledgeOdooAuthClient({
      baseUrl: "https://odoo.test",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await expect(
      client.login({
        login: "a@b.c",
        password: "x",
        requestId: "req-2",
      }),
    ).rejects.toMatchObject({ code: "invalid_credentials" });
  });

  it("maps rate limiting", async () => {
    const fetchImpl = vi.fn(async () => {
      return new Response("{}", {
        status: 429,
        headers: { "Retry-After": "30" },
      });
    });

    const client = new KnowledgeOdooAuthClient({
      baseUrl: "https://odoo.test",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    try {
      await client.login({
        login: "a@b.c",
        password: "x",
        requestId: "req-3",
      });
      throw new Error("expected failure");
    } catch (error) {
      expect(error).toBeInstanceOf(KnowledgeUpstreamError);
      expect((error as KnowledgeUpstreamError).code).toBe("rate_limited");
      expect((error as KnowledgeUpstreamError).retryAfterSeconds).toBe(30);
    }
  });

  it("maps upstream unavailable on network failure", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("ECONNREFUSED");
    });

    const client = new KnowledgeOdooAuthClient({
      baseUrl: "https://odoo.test",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await expect(
      client.me({
        upstreamSessionMaterial: "abc",
        requestId: "req-4",
      }),
    ).rejects.toMatchObject({ code: "upstream_unavailable" });
  });

  it("clears access when roles are removed on /me", async () => {
    const fetchImpl = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          data: sampleUser({
            roles: [],
            capabilities: [],
            knowledge_access_ready: false,
          }),
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    const client = new KnowledgeOdooAuthClient({
      baseUrl: "https://odoo.test",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await expect(
      client.me({
        upstreamSessionMaterial: "abc",
        requestId: "req-5",
      }),
    ).rejects.toMatchObject({ code: "knowledge_role_required" });
  });

  it("rejects inactive users on /me", async () => {
    const fetchImpl = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          data: sampleUser({ active: false }),
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    const client = new KnowledgeOdooAuthClient({
      baseUrl: "https://odoo.test",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await expect(
      client.me({
        upstreamSessionMaterial: "abc",
        requestId: "req-6",
      }),
    ).rejects.toMatchObject({ code: "user_inactive" });
  });

  it("treats logout as best-effort / idempotent locally", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("already gone");
    });
    const client = new KnowledgeOdooAuthClient({
      baseUrl: "https://odoo.test",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    await expect(
      client.logout({
        upstreamSessionMaterial: "abc",
        requestId: "req-7",
      }),
    ).resolves.toBeUndefined();
  });
});

describe("live session refresh merge", () => {
  it("updates MFA ready state from /me snapshot", () => {
    const session = createKnowledgeSessionPayload({
      user: sampleUser({
        mfa_enabled: false,
        knowledge_access_ready: false,
      }),
      upstreamSessionMaterial: "abc",
    });
    const merged = mergeLiveUserIntoSession(
      session,
      sampleUser({ mfa_enabled: true, knowledge_access_ready: true }),
    );
    expect(merged.mfa_enabled).toBe(true);
    expect(merged.knowledge_access_ready).toBe(true);
    expect(merged.upstream_session_material).toBe("abc");
  });
});

describe("cookie header normalization", () => {
  it("strips Set-Cookie attributes for request Cookie header", () => {
    expect(
      normalizeCookieHeader(
        "session_id=abc123; Path=/; HttpOnly; Secure; SameSite=Lax",
      ),
    ).toBe("session_id=abc123");
  });
});

describe("getKnowledgeAuthConfig", () => {
  const keys = [
    "RAQEEM_CONTROL_ODOO_BASE_URL",
    "RAQEEM_PLATFORM_API_BASE_URL",
    "RAQEEM_KNOWLEDGE_SESSION_SECRET",
    "RAQEEM_KNOWLEDGE_SESSION_ENCRYPTION_KEY",
    "RAQEEM_KNOWLEDGE_SESSION_TTL_SECONDS",
  ] as const;

  const saved: Partial<Record<(typeof keys)[number], string | undefined>> = {};

  beforeEach(() => {
    for (const key of keys) saved[key] = process.env[key];
  });

  afterEach(() => {
    for (const key of keys) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });

  it("requires secrets and base URL", () => {
    process.env.RAQEEM_CONTROL_ODOO_BASE_URL = "https://odoo.test";
    process.env.RAQEEM_KNOWLEDGE_SESSION_SECRET = "s".repeat(32);
    process.env.RAQEEM_KNOWLEDGE_SESSION_ENCRYPTION_KEY = "k".repeat(32);
    expect(getKnowledgeAuthConfig().isConfigured).toBe(true);
  });

  it("fails closed when encryption key is missing", () => {
    process.env.RAQEEM_CONTROL_ODOO_BASE_URL = "https://odoo.test";
    process.env.RAQEEM_KNOWLEDGE_SESSION_SECRET = "s".repeat(32);
    delete process.env.RAQEEM_KNOWLEDGE_SESSION_ENCRYPTION_KEY;
    expect(getKnowledgeAuthConfig().isConfigured).toBe(false);
  });

  it("does not expose NEXT_PUBLIC auth secrets in env contract", () => {
    expect(process.env.NEXT_PUBLIC_RAQEEM_KNOWLEDGE_SESSION_SECRET).toBeUndefined();
    expect(
      process.env.NEXT_PUBLIC_RAQEEM_KNOWLEDGE_SESSION_ENCRYPTION_KEY,
    ).toBeUndefined();
  });
});

describe("mfa onboarding page copy safety", () => {
  it("onboarding copy refuses TOTP enrollment and QR generation", async () => {
    const { knowledgeAuthCopy } = await import("@/lib/knowledge-auth/i18n");
    expect(knowledgeAuthCopy.mfaInstructions).toContain("لا تُنشئ أسرار TOTP");
    expect(knowledgeAuthCopy.mfaInstructions).toContain("لا تعرض رمز QR");
    expect(knowledgeAuthCopy.mfaInstructions.toLowerCase()).not.toContain(
      "scan this qr",
    );
    expect(knowledgeAuthCopy.mfaInstructions.toLowerCase()).not.toContain(
      "totp secret:",
    );
  });
});
