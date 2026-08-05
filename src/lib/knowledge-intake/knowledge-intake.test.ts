import { describe, expect, it } from "vitest";

import {
  mapIntakeDetail,
  mapIntakePaginationMeta,
  mapIntakeSummary,
} from "@/lib/knowledge-intake/mappers";
import { intakeQueryToSearchParams, parseIntakeQuery } from "@/lib/knowledge-intake/query";

describe("knowledge intake query", () => {
  it("accepts allowlisted pagination and filters", () => {
    const parsed = parseIntakeQuery(
      new URLSearchParams("page=2&page_size=50&state=received&source_type=gpt&sort=received_at&order=desc"),
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.query).toMatchObject({
        page: 2,
        page_size: 50,
        state: "received",
        source_type: "gpt",
      });
      expect(intakeQueryToSearchParams(parsed.query).get("page")).toBe("2");
    }
  });

  it("rejects raw or unknown query parameters", () => {
    const parsed = parseIntakeQuery(new URLSearchParams("domain=[('id','>',0)]"));
    expect(parsed.ok).toBe(false);
  });

  it("enforces maximum page size", () => {
    const parsed = parseIntakeQuery(new URLSearchParams("page_size=101"));
    expect(parsed.ok).toBe(false);
  });
});

describe("knowledge intake mappers", () => {
  const raw = {
    intake_uuid: "8ef49ca1-2a1a-4c97-a73b-8213cb998c4a",
    source_type: "gpt",
    actor_type: "ai",
    requested_by: { id: 156, login: "user", display_name: "Knowledge Integration Test" },
    requested_by_external_actor: "chatgpt:user-request",
    proposed_title: "ما هو رقيم؟",
    proposed_question: "ما هو رقيم؟",
    proposed_short_answer: "منصة تشغيل للمدارس الخاصة.",
    proposed_body: "شرح تفصيلي.",
    proposed_item_type: "faq",
    proposed_intent: "definition",
    proposed_language: "ar",
    proposed_domains: [{ id: 1, code: "platform", name: "المنصة" }],
    proposed_primary_domain: { id: 1, code: "platform", name: "المنصة" },
    risk_level: "low",
    policy_decision: "not_evaluated",
    duplicate_score: 0,
    duplicate_classification: "none",
    proposed_action: "create",
    state: "received",
    received_at: "2026-08-05T20:00:00Z",
    write_date: "2026-08-05T20:00:01Z",
    active: true,
    allowed_actions: { validate: true, cancel: true },
  };

  it("maps safe list summaries", () => {
    const mapped = mapIntakeSummary(raw);
    expect(mapped?.intake_uuid).toBe(raw.intake_uuid);
    expect(mapped?.allowed_actions.validate).toBe(true);
    expect(mapped?.allowed_actions.accept_as_draft).toBe(false);
  });

  it("maps detail without inventing sensitive values", () => {
    const mapped = mapIntakeDetail(raw);
    expect(mapped?.proposed_body).toBe("شرح تفصيلي.");
    expect(mapped?.proposed_domains).toHaveLength(1);
    expect(mapped?.ai_metadata).toEqual({});
  });

  it("normalizes pagination defaults", () => {
    expect(mapIntakePaginationMeta({ page: 2, page_size: 20, total: 45 })).toEqual({
      page: 2,
      page_size: 20,
      total: 45,
      total_pages: 3,
      has_next: true,
      has_previous: true,
    });
  });
});
