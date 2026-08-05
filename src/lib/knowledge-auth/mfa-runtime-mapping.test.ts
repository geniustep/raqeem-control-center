import { describe, expect, it } from "vitest";

import { parseOdooKnowledgeUser } from "@/lib/knowledge-auth/client";

describe("Odoo Knowledge MFA runtime mapping", () => {
  it("reads nested mfa and onboarding nodes from the runtime contract", () => {
    const user = parseOdooKnowledgeUser({
      user: {
        user_id: 156,
        login: "user",
        display_name: "Knowledge Integration Test",
        roles: ["knowledge_editor"],
        capabilities: ["knowledge.item.read"],
        active: true,
        internal_user: true,
      },
      mfa: {
        available: true,
        enabled: true,
      },
      onboarding: {
        knowledge_access_ready: true,
      },
    });

    expect(user.mfa_available).toBe(true);
    expect(user.mfa_enabled).toBe(true);
    expect(user.knowledge_access_ready).toBe(true);
  });

  it("keeps the backend readiness decision authoritative when false", () => {
    const user = parseOdooKnowledgeUser({
      user: {
        user_id: 156,
        login: "user",
        display_name: "Knowledge Integration Test",
        roles: ["knowledge_editor"],
        capabilities: ["knowledge.item.read"],
      },
      mfa: {
        available: true,
        enabled: true,
      },
      onboarding: {
        knowledge_access_ready: false,
      },
    });

    expect(user.mfa_enabled).toBe(true);
    expect(user.knowledge_access_ready).toBe(false);
  });

  it("derives readiness from nested MFA when onboarding is omitted", () => {
    const user = parseOdooKnowledgeUser({
      user: {
        user_id: 156,
        login: "user",
        display_name: "Knowledge Integration Test",
        roles: ["knowledge_editor"],
        capabilities: [],
      },
      mfa: {
        available: true,
        enabled: true,
      },
    });

    expect(user.knowledge_access_ready).toBe(true);
  });
});
