import Link from "next/link";

import {
  KnowledgeEmptyState,
  KnowledgeErrorState,
  KnowledgeMetricCard,
  KnowledgePageHeader,
} from "@/components/knowledge/KnowledgePageChrome";
import { KnowledgeWorkspace } from "@/components/knowledge/KnowledgeWorkspace";
import {
  KnowledgeStatusBadge,
} from "@/components/knowledge/KnowledgeBadges";
import { KnowledgeUpstreamError } from "@/lib/knowledge-auth/client";
import { KNOWLEDGE_UI_PATHS } from "@/lib/knowledge-read/constants";
import { knowledgeUiCopy as t } from "@/lib/knowledge-read/i18n";
import { loadDashboardData } from "@/lib/knowledge-read/loaders";
import type { KnowledgeItemSummary } from "@/lib/knowledge-read/types";

export const dynamic = "force-dynamic";

function ItemMiniList({
  items,
  emptyLabel,
}: {
  items: KnowledgeItemSummary[];
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">{emptyLabel}</p>;
  }
  return (
    <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
      {items.slice(0, 8).map((item) => (
        <li key={item.public_uuid}>
          <Link
            href={KNOWLEDGE_UI_PATHS.item(item.public_uuid)}
            className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500"
          >
            <div>
              <div className="text-sm font-medium text-slate-900">
                {item.question || item.title}
              </div>
              <div className="mt-1 text-xs text-slate-500" dir="ltr">
                {item.updated_at ?? "—"}
              </div>
            </div>
            <KnowledgeStatusBadge state={item.state} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function KnowledgeDashboardPage() {
  try {
    const { data } = await loadDashboardData();
    const counts = data.counts;

    return (
      <KnowledgeWorkspace>
        <KnowledgePageHeader
          title={t.dashboard.title}
          subtitle={t.dashboard.subtitle}
        />

        <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <KnowledgeMetricCard label={t.dashboard.myDrafts} value={counts.my_drafts} />
          <KnowledgeMetricCard
            label={t.dashboard.assignedReviews}
            value={counts.assigned_reviews}
            tone="amber"
          />
          <KnowledgeMetricCard
            label={t.dashboard.approvedWithoutPackage}
            value={counts.approved_without_package}
            tone="blue"
          />
          <KnowledgeMetricCard
            label={t.dashboard.packagesToVerify}
            value={counts.packages_to_verify}
            tone="amber"
          />
          <KnowledgeMetricCard
            label={t.dashboard.publishedRecently}
            value={counts.published_recently}
            tone="green"
          />
          <KnowledgeMetricCard
            label={t.dashboard.needsReview}
            value={counts.needs_review}
            tone="amber"
          />
          <KnowledgeMetricCard
            label={t.dashboard.expired}
            value={counts.expired}
            tone="red"
          />
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section>
            <h2 className="mb-3 text-sm font-semibold text-slate-800">
              {t.dashboard.recentMine}
            </h2>
            <ItemMiniList
              items={data.my_drafts}
              emptyLabel={t.dashboard.emptySection}
            />
          </section>
          <section>
            <h2 className="mb-3 text-sm font-semibold text-slate-800">
              {t.dashboard.assignedSection}
            </h2>
            <ItemMiniList
              items={data.assigned_reviews}
              emptyLabel={t.dashboard.emptySection}
            />
          </section>
          <section>
            <h2 className="mb-3 text-sm font-semibold text-slate-800">
              {t.dashboard.publishedSection}
            </h2>
            <ItemMiniList
              items={data.published_recently}
              emptyLabel={t.dashboard.emptySection}
            />
          </section>
          <section>
            <h2 className="mb-3 text-sm font-semibold text-slate-800">
              {t.dashboard.activitySection}
            </h2>
            {data.recent_activity.length === 0 ? (
              <KnowledgeEmptyState title={t.dashboard.emptySection} />
            ) : (
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                {data.recent_activity.slice(0, 10).map((event, index) => (
                  <li key={`${event.event_type}-${event.occurred_at}-${index}`} className="px-4 py-3">
                    <div className="text-sm font-medium text-slate-800">
                      {event.title || event.action || event.event_type}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span>{event.actor_login ?? "—"}</span>
                      <span dir="ltr">{event.occurred_at ?? "—"}</span>
                      {event.state ? <KnowledgeStatusBadge state={event.state} /> : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </KnowledgeWorkspace>
    );
  } catch (error) {
    const message =
      error instanceof KnowledgeUpstreamError
        ? error.code === "upstream_unavailable"
          ? t.states.upstreamUnavailable
          : error.code === "rate_limited"
            ? t.states.rateLimited
            : t.states.error
        : t.states.error;
    return (
      <KnowledgeWorkspace>
        <KnowledgePageHeader title={t.dashboard.title} />
        <KnowledgeErrorState message={message} retryHref={KNOWLEDGE_UI_PATHS.dashboard} />
      </KnowledgeWorkspace>
    );
  }
}
