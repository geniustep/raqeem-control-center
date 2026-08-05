import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { createSessionToken } from "@/lib/auth/session";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { KNOWLEDGE_SESSION_COOKIE_NAME } from "@/lib/knowledge-auth/constants";
import {
  createKnowledgeSessionPayload,
  encryptKnowledgeSession,
} from "@/lib/knowledge-auth/session";
import { middleware } from "@/middleware";
import type { OdooKnowledgeUserSnapshot } from "@/lib/knowledge-auth/types";

const ENCRYPTION_KEY = "knowledge-middleware-key-32bytes!!";
const PLATFORM_SECRET = "platform-session-secret-32chars!";

function sampleUser(
  overrides: Partial<OdooKnowledgeUserSnapshot> = {},
): OdooKnowledgeUserSnapshot {
  return {
    user_id: 1,
    login: "user@raqeem.test",
    display_name: "مستخدم",
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

function requestFor(
  path: string,
  cookies: Record<string, string> = {},
): NextRequest {
  const header =
    Object.entries(cookies)
      .map(([name, value]) => `${name}=${value}`)
      .join("; ") || undefined;
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: header ? { cookie: header } : undefined,
  });
}

describe("knowledge route guards (middleware)", () => {
  it("redirects anonymous /knowledge to login", async () => {
    process.env.RAQEEM_KNOWLEDGE_SESSION_ENCRYPTION_KEY = ENCRYPTION_KEY;
    const response = await middleware(requestFor("/knowledge"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/knowledge/login");
  });

  it("redirects authenticated-not-ready users to MFA onboarding", async () => {
    process.env.RAQEEM_KNOWLEDGE_SESSION_ENCRYPTION_KEY = ENCRYPTION_KEY;
    const token = await encryptKnowledgeSession(
      createKnowledgeSessionPayload({
        user: sampleUser({
          mfa_enabled: false,
          knowledge_access_ready: false,
        }),
        upstreamSessionMaterial: "up",
      }),
      ENCRYPTION_KEY,
    );
    const response = await middleware(
      requestFor("/knowledge", { [KNOWLEDGE_SESSION_COOKIE_NAME]: token }),
    );
    expect(response.headers.get("location")).toContain(
      "/knowledge/onboarding/mfa",
    );
  });

  it("allows ready users into /knowledge", async () => {
    process.env.RAQEEM_KNOWLEDGE_SESSION_ENCRYPTION_KEY = ENCRYPTION_KEY;
    const token = await encryptKnowledgeSession(
      createKnowledgeSessionPayload({
        user: sampleUser(),
        upstreamSessionMaterial: "up",
      }),
      ENCRYPTION_KEY,
    );
    const response = await middleware(
      requestFor("/knowledge/dashboard", {
        [KNOWLEDGE_SESSION_COOKIE_NAME]: token,
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("returns JSON 401 for knowledge read APIs without session", async () => {
    process.env.RAQEEM_KNOWLEDGE_SESSION_ENCRYPTION_KEY = ENCRYPTION_KEY;
    const response = await middleware(requestFor("/api/knowledge/dashboard"));
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("authentication_required");
  });

  it("does not grant Knowledge access from Platform operator cookie alone", async () => {
    process.env.CONTROL_CENTER_SESSION_SECRET = PLATFORM_SECRET;
    process.env.RAQEEM_KNOWLEDGE_SESSION_ENCRYPTION_KEY = ENCRYPTION_KEY;
    const platformToken = await createSessionToken(PLATFORM_SECRET);
    const response = await middleware(
      requestFor("/knowledge", { [SESSION_COOKIE_NAME]: platformToken }),
    );
    expect(response.headers.get("location")).toContain("/knowledge/login");
  });

  it("does not grant Platform access from Knowledge cookie alone", async () => {
    process.env.CONTROL_CENTER_SESSION_SECRET = PLATFORM_SECRET;
    process.env.RAQEEM_KNOWLEDGE_SESSION_ENCRYPTION_KEY = ENCRYPTION_KEY;
    const knowledgeToken = await encryptKnowledgeSession(
      createKnowledgeSessionPayload({
        user: sampleUser(),
        upstreamSessionMaterial: "up",
      }),
      ENCRYPTION_KEY,
    );
    const response = await middleware(
      requestFor("/tenants", { [KNOWLEDGE_SESSION_COOKIE_NAME]: knowledgeToken }),
    );
    expect(response.headers.get("location")).toContain("/login");
  });

  it("keeps Platform routes working with Platform cookie", async () => {
    process.env.CONTROL_CENTER_SESSION_SECRET = PLATFORM_SECRET;
    const platformToken = await createSessionToken(PLATFORM_SECRET);
    const response = await middleware(
      requestFor("/tenants", { [SESSION_COOKIE_NAME]: platformToken }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });
});
