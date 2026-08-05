import { describe, expect, it } from "vitest";

import {
  mapDashboard,
  mapDomain,
  mapItemDetail,
  mapItemSummary,
  mapOptions,
  mapPaginationMeta,
} from "@/lib/knowledge-read/mappers";
import { parseItemsQuery } from "@/lib/knowledge-read/query";

describe("knowledge read mappers", () => {
  it("maps item summary without inventing fields", () => {
    const item = mapItemSummary({
      public_uuid: "9a377133-bc87-477f-979b-5fc4b8406302",
      slug: "ma-huwa-raqeem",
      title: "ما هو رقيم؟",
      question: "ما هو رقيم؟",
      short_answer: "منصة",
      item_type: "faq",
      intent: "definition",
      language: "ar",
      state: "published",
      primary_domain: { id: 5, code: "platform", name: "Platform" },
      domains: [{ id: 5, code: "platform", name: "Platform" }],
      owner: { user_id: 1, login: "admin", display_name: "Admin" },
      needs_review: false,
      package_count: 1,
      relation_count: 0,
      asset_count: 0,
      allowed_actions: { edit: true, publish: false },
    });
    expect(item?.public_uuid).toBe("9a377133-bc87-477f-979b-5fc4b8406302");
    expect(item?.allowed_actions.edit).toBe(true);
    expect(item?.primary_domain?.code).toBe("platform");
  });

  it("maps detail body and validity", () => {
    const item = mapItemDetail({
      public_uuid: "abc",
      question: "q",
      body: "long body",
      validity: {
        valid_until: "2027-01-01",
        next_review_date: "2026-09-01",
      },
      state: "draft",
      item_type: "term",
      intent: "concept",
      language: "ar",
    });
    expect(item?.body).toBe("long body");
    expect(item?.validity.valid_until).toBe("2027-01-01");
  });

  it("maps dashboard counts including zeros", () => {
    const dashboard = mapDashboard({
      counts: {
        my_drafts: 0,
        assigned_reviews: 2,
        approved_without_package: 0,
        packages_to_verify: 0,
        published_recently: 1,
        expired: 0,
        needs_review: 0,
      },
      my_drafts: [],
      assigned_reviews: [],
      approved_without_package: [],
      packages_to_verify: [],
      published_recently: [],
      expired: [],
      needs_review: [],
      recent_activity: [
        {
          event_type: "knowledge_item_touched",
          action: "item_write",
          result: "ok",
          occurred_at: "2026-08-05T10:00:00Z",
          actor_login: "user",
          title: "ما هو رقيم؟",
          state: "published",
        },
      ],
    });
    expect(dashboard.counts.my_drafts).toBe(0);
    expect(dashboard.recent_activity).toHaveLength(1);
  });

  it("maps domains and options", () => {
    expect(
      mapDomain({
        id: 5,
        code: "platform",
        name: "Platform",
        description: "x",
        parent_id: null,
        sequence: 5,
        active: true,
      })?.code,
    ).toBe("platform");
    expect(mapOptions([{ value: "draft", label: "Draft" }])).toEqual([
      { value: "draft", label: "Draft" },
    ]);
  });

  it("maps pagination meta", () => {
    expect(
      mapPaginationMeta({
        page: 2,
        page_size: 20,
        total: 45,
        total_pages: 3,
        has_next: true,
        has_previous: true,
      }),
    ).toMatchObject({ page: 2, total: 45, has_next: true });
  });
});

describe("items query allowlist", () => {
  it("accepts supported filters", () => {
    const params = new URLSearchParams({
      page: "1",
      page_size: "20",
      search: "رقيم",
      state: "published",
      sort: "updated_at",
      order: "desc",
      needs_review: "false",
      review_status: "current",
    });
    const parsed = parseItemsQuery(params);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.query.state).toBe("published");
      expect(parsed.query.page_size).toBe(20);
    }
  });

  it("rejects unknown and invalid params", () => {
    expect(parseItemsQuery(new URLSearchParams({ q: "x" })).ok).toBe(false);
    expect(parseItemsQuery(new URLSearchParams({ page: "0" })).ok).toBe(false);
    expect(parseItemsQuery(new URLSearchParams({ page_size: "101" })).ok).toBe(
      false,
    );
    expect(parseItemsQuery(new URLSearchParams({ sort: "-title" })).ok).toBe(
      false,
    );
    expect(
      parseItemsQuery(new URLSearchParams({ review_status: "weird" })).ok,
    ).toBe(false);
  });
});
