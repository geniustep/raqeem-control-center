import Link from "next/link";

import {
  KnowledgeDomainBadge,
  KnowledgeIntentBadge,
  KnowledgeLanguageBadge,
  KnowledgeStatusBadge,
  KnowledgeTypeBadge,
  NeedsReviewBadge,
} from "@/components/knowledge/KnowledgeBadges";
import { KNOWLEDGE_UI_PATHS } from "@/lib/knowledge-read/constants";
import { knowledgeUiCopy as t } from "@/lib/knowledge-read/i18n";
import type { KnowledgeItemSummary } from "@/lib/knowledge-read/types";

function truncate(text: string, max = 120): string {
  const value = text.trim();
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("ar", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function KnowledgeItemsTable({ items }: { items: KnowledgeItemSummary[] }) {
  return (
    <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white md:block">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="px-4 py-3 text-start font-medium">{t.items.question}</th>
            <th className="px-4 py-3 text-start font-medium">{t.items.state}</th>
            <th className="px-4 py-3 text-start font-medium">{t.items.intent}</th>
            <th className="px-4 py-3 text-start font-medium">{t.items.type}</th>
            <th className="px-4 py-3 text-start font-medium">{t.items.language}</th>
            <th className="px-4 py-3 text-start font-medium">{t.items.domain}</th>
            <th className="px-4 py-3 text-start font-medium">{t.items.owner}</th>
            <th className="px-4 py-3 text-start font-medium">{t.items.updated}</th>
            <th className="px-4 py-3 text-start font-medium">{t.items.needsReview}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.public_uuid} className="border-t border-slate-100">
              <td className="px-4 py-3 align-top">
                <Link
                  href={KNOWLEDGE_UI_PATHS.item(item.public_uuid)}
                  className="font-medium text-brand-700 hover:underline focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {item.question || item.title}
                </Link>
                {item.short_answer ? (
                  <p className="mt-1 text-xs text-slate-500">
                    {truncate(item.short_answer)}
                  </p>
                ) : null}
              </td>
              <td className="px-4 py-3 align-top">
                <KnowledgeStatusBadge state={item.state} />
              </td>
              <td className="px-4 py-3 align-top">
                <KnowledgeIntentBadge intent={item.intent} />
              </td>
              <td className="px-4 py-3 align-top">
                <KnowledgeTypeBadge type={item.item_type} />
              </td>
              <td className="px-4 py-3 align-top">
                <KnowledgeLanguageBadge language={item.language} />
              </td>
              <td className="px-4 py-3 align-top">
                {item.primary_domain ? (
                  <KnowledgeDomainBadge
                    name={item.primary_domain.name}
                    code={item.primary_domain.code}
                  />
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-3 align-top text-slate-700" dir="auto">
                {item.owner?.display_name ?? "—"}
              </td>
              <td className="px-4 py-3 align-top text-slate-600" dir="ltr">
                {formatDate(item.updated_at)}
              </td>
              <td className="px-4 py-3 align-top">
                <NeedsReviewBadge needsReview={item.needs_review} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function KnowledgeMobileCards({
  items,
}: {
  items: KnowledgeItemSummary[];
}) {
  return (
    <div className="space-y-3 md:hidden">
      {items.map((item) => (
        <Link
          key={item.public_uuid}
          href={KNOWLEDGE_UI_PATHS.item(item.public_uuid)}
          className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <div className="font-medium text-slate-900">
            {item.question || item.title}
          </div>
          {item.short_answer ? (
            <p className="mt-1 text-sm text-slate-500">
              {truncate(item.short_answer, 90)}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <KnowledgeStatusBadge state={item.state} />
            <KnowledgeIntentBadge intent={item.intent} />
            <KnowledgeTypeBadge type={item.item_type} />
            {item.needs_review ? (
              <NeedsReviewBadge needsReview />
            ) : null}
          </div>
          <div className="mt-3 flex justify-between text-xs text-slate-500">
            <span dir="auto">{item.owner?.display_name ?? "—"}</span>
            <span dir="ltr">{formatDate(item.updated_at)}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
