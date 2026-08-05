import Link from "next/link";

import {
  KnowledgeEmptyState,
  KnowledgeErrorState,
  KnowledgePageHeader,
} from "@/components/knowledge/KnowledgePageChrome";
import {
  KnowledgeItemsTable,
  KnowledgeMobileCards,
} from "@/components/knowledge/KnowledgeItemsViews";
import { KnowledgeWorkspace } from "@/components/knowledge/KnowledgeWorkspace";
import { KnowledgeUpstreamError } from "@/lib/knowledge-auth/client";
import {
  KNOWLEDGE_REVIEW_STATUS_VALUES,
  KNOWLEDGE_SORT_VALUES,
  KNOWLEDGE_UI_PATHS,
} from "@/lib/knowledge-read/constants";
import { knowledgeUiCopy as t } from "@/lib/knowledge-read/i18n";
import {
  loadFilterOptions,
  loadItemsData,
} from "@/lib/knowledge-read/loaders";
import { parseItemsQuery } from "@/lib/knowledge-read/query";

export const dynamic = "force-dynamic";

function buildHref(
  base: Record<string, string | undefined>,
  patch: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams();
  const merged = { ...base, ...patch };
  for (const [key, value] of Object.entries(merged)) {
    if (value !== undefined && value !== "") params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `${KNOWLEDGE_UI_PATHS.items}?${qs}` : KNOWLEDGE_UI_PATHS.items;
}

export default async function KnowledgeItemsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") params.set(key, value);
    else if (Array.isArray(value) && value[0]) params.set(key, value[0]);
  }

  const parsed = parseItemsQuery(params);
  if (!parsed.ok) {
    return (
      <KnowledgeWorkspace>
        <KnowledgePageHeader title={t.items.title} subtitle={t.items.subtitle} />
        <KnowledgeErrorState message={t.states.error} retryHref={KNOWLEDGE_UI_PATHS.items} />
      </KnowledgeWorkspace>
    );
  }

  try {
    const [{ page }, options] = await Promise.all([
      loadItemsData(parsed.query),
      loadFilterOptions(),
    ]);

    const current: Record<string, string | undefined> = {};
    for (const [key, value] of Object.entries(parsed.query)) {
      if (value !== undefined && value !== null && value !== "") {
        current[key] = String(value);
      }
    }

    const hasFilters = Object.keys(current).some(
      (key) => key !== "page" && key !== "page_size" && key !== "sort" && key !== "order",
    );

    return (
      <KnowledgeWorkspace>
        <KnowledgePageHeader title={t.items.title} subtitle={t.items.subtitle} />

        <form
          method="GET"
          action={KNOWLEDGE_UI_PATHS.items}
          className="mb-6 space-y-3 rounded-xl border border-slate-200 bg-white p-4"
        >
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">{t.items.search}</span>
              <input
                name="search"
                defaultValue={current.search ?? ""}
                placeholder={t.items.searchPlaceholder}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">{t.items.state}</span>
              <select
                name="state"
                defaultValue={current.state ?? ""}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {options.states.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">{t.items.intent}</span>
              <select
                name="intent"
                defaultValue={current.intent ?? ""}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {options.intents.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">{t.items.type}</span>
              <select
                name="item_type"
                defaultValue={current.item_type ?? ""}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {options.itemTypes.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">{t.items.language}</span>
              <select
                name="language"
                defaultValue={current.language ?? ""}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {options.languages.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">{t.items.domain}</span>
              <select
                name="domain"
                defaultValue={current.domain ?? ""}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {options.domains.map((domain) => (
                  <option key={domain.id} value={domain.code}>
                    {domain.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">{t.items.owner}</span>
              <input
                name="owner"
                defaultValue={current.owner ?? ""}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">{t.items.reviewer}</span>
              <input
                name="reviewer"
                defaultValue={current.reviewer ?? ""}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">{t.items.publisher}</span>
              <input
                name="publisher"
                defaultValue={current.publisher ?? ""}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">{t.items.needsReview}</span>
              <select
                name="needs_review"
                defaultValue={current.needs_review ?? ""}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">—</option>
                <option value="true">{t.badges.yes}</option>
                <option value="false">{t.badges.no}</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">review_status</span>
              <select
                name="review_status"
                defaultValue={current.review_status ?? ""}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {KNOWLEDGE_REVIEW_STATUS_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">sort</span>
              <select
                name="sort"
                defaultValue={current.sort ?? "updated_at"}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {KNOWLEDGE_SORT_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">order</span>
              <select
                name="order"
                defaultValue={current.order ?? "desc"}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="desc">desc</option>
                <option value="asc">asc</option>
              </select>
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {t.items.apply}
            </button>
            <Link
              href={KNOWLEDGE_UI_PATHS.items}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {t.items.reset}
            </Link>
          </div>
        </form>

        {page.items.length === 0 ? (
          <KnowledgeEmptyState
            title={hasFilters ? t.items.noMatch : t.items.empty}
          />
        ) : (
          <>
            <KnowledgeItemsTable items={page.items} />
            <KnowledgeMobileCards items={page.items} />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
              <div>
                {t.items.pageOf} {page.meta.page} / {Math.max(page.meta.total_pages, 1)} ·{" "}
                {page.meta.total}
              </div>
              <div className="flex gap-2">
                {page.meta.has_previous ? (
                  <Link
                    href={buildHref(current, {
                      page: String(page.meta.page - 1),
                    })}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-white"
                  >
                    {t.items.previous}
                  </Link>
                ) : null}
                {page.meta.has_next ? (
                  <Link
                    href={buildHref(current, {
                      page: String(page.meta.page + 1),
                    })}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-white"
                  >
                    {t.items.next}
                  </Link>
                ) : null}
              </div>
            </div>
          </>
        )}
      </KnowledgeWorkspace>
    );
  } catch (error) {
    const message =
      error instanceof KnowledgeUpstreamError
        ? error.code === "upstream_unavailable"
          ? t.states.upstreamUnavailable
          : t.states.error
        : t.states.error;
    return (
      <KnowledgeWorkspace>
        <KnowledgePageHeader title={t.items.title} />
        <KnowledgeErrorState message={message} retryHref={KNOWLEDGE_UI_PATHS.items} />
      </KnowledgeWorkspace>
    );
  }
}
