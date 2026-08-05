import Link from "next/link";

import {
  KnowledgeEmptyState,
  KnowledgeErrorState,
  KnowledgePageHeader,
} from "@/components/knowledge/KnowledgePageChrome";
import {
  KnowledgeIntakeRiskBadge,
  KnowledgeIntakeSourceBadge,
  KnowledgeIntakeStateBadge,
} from "@/components/knowledge/KnowledgeIntakeBadges";
import { KnowledgeWorkspace } from "@/components/knowledge/KnowledgeWorkspace";
import { KnowledgeIntakeUpstreamError } from "@/lib/knowledge-intake/client";
import {
  INTAKE_SORT_VALUES,
  KNOWLEDGE_INTAKE_UI_PATHS,
} from "@/lib/knowledge-intake/constants";
import { knowledgeIntakeCopy as t } from "@/lib/knowledge-intake/i18n";
import { loadIntakeOptions, loadIntakesData } from "@/lib/knowledge-intake/loaders";
import { parseIntakeQuery } from "@/lib/knowledge-intake/query";
import type { KnowledgeIntakeSummary } from "@/lib/knowledge-intake/types";

export const dynamic = "force-dynamic";

function buildHref(
  base: Record<string, string | undefined>,
  patch: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...base, ...patch })) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `${KNOWLEDGE_INTAKE_UI_PATHS.inbox}?${query}` : KNOWLEDGE_INTAKE_UI_PATHS.inbox;
}

function IntakeTable({ intakes }: { intakes: KnowledgeIntakeSummary[] }) {
  return (
    <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white md:block">
      <table className="min-w-full divide-y divide-slate-200 text-right text-sm">
        <thead className="bg-slate-50 text-xs text-slate-600">
          <tr>
            <th className="px-4 py-3 font-semibold">المقترح</th>
            <th className="px-4 py-3 font-semibold">المصدر</th>
            <th className="px-4 py-3 font-semibold">الحالة</th>
            <th className="px-4 py-3 font-semibold">المخاطر</th>
            <th className="px-4 py-3 font-semibold">الإجراء المقترح</th>
            <th className="px-4 py-3 font-semibold">الاستلام</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {intakes.map((intake) => (
            <tr key={intake.intake_uuid} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <Link href={KNOWLEDGE_INTAKE_UI_PATHS.detail(intake.intake_uuid)} className="font-semibold text-slate-900 hover:text-brand-700">
                  {intake.proposed_question || intake.proposed_title || "—"}
                </Link>
                {intake.proposed_short_answer ? <p className="mt-1 max-w-xl truncate text-xs text-slate-500">{intake.proposed_short_answer}</p> : null}
              </td>
              <td className="px-4 py-3"><KnowledgeIntakeSourceBadge source={intake.source_type} /></td>
              <td className="px-4 py-3"><KnowledgeIntakeStateBadge state={intake.state} /></td>
              <td className="px-4 py-3"><KnowledgeIntakeRiskBadge risk={intake.risk_level} /></td>
              <td className="px-4 py-3 text-slate-600">{intake.proposed_action || "—"}</td>
              <td className="px-4 py-3 text-xs text-slate-500" dir="ltr">{intake.received_at || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IntakeCards({ intakes }: { intakes: KnowledgeIntakeSummary[] }) {
  return (
    <div className="grid gap-3 md:hidden">
      {intakes.map((intake) => (
        <Link key={intake.intake_uuid} href={KNOWLEDGE_INTAKE_UI_PATHS.detail(intake.intake_uuid)} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          <h2 className="font-semibold text-slate-900">{intake.proposed_question || intake.proposed_title || "—"}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <KnowledgeIntakeSourceBadge source={intake.source_type} />
            <KnowledgeIntakeStateBadge state={intake.state} />
            <KnowledgeIntakeRiskBadge risk={intake.risk_level} />
          </div>
          <p className="mt-3 text-xs text-slate-500" dir="ltr">{intake.received_at || "—"}</p>
        </Link>
      ))}
    </div>
  );
}

export default async function KnowledgeIntakeInboxPage({
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
  const parsed = parseIntakeQuery(params);
  if (!parsed.ok) {
    return (
      <KnowledgeWorkspace>
        <KnowledgePageHeader title={t.title} subtitle={t.subtitle} />
        <KnowledgeErrorState message="الفلاتر غير صالحة." retryHref={KNOWLEDGE_INTAKE_UI_PATHS.inbox} />
      </KnowledgeWorkspace>
    );
  }

  try {
    const [{ page }, options] = await Promise.all([
      loadIntakesData(parsed.query),
      loadIntakeOptions(),
    ]);
    const current: Record<string, string | undefined> = {};
    for (const [key, value] of Object.entries(parsed.query)) {
      if (value !== undefined && value !== null && value !== "") current[key] = String(value);
    }
    const hasFilters = Object.keys(current).some((key) => !["page", "page_size", "sort", "order"].includes(key));

    return (
      <KnowledgeWorkspace>
        <KnowledgePageHeader
          title={t.title}
          subtitle={t.subtitle}
          action={
            <Link href={KNOWLEDGE_INTAKE_UI_PATHS.create} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              {t.newButton}
            </Link>
          }
        />

        <form method="GET" action={KNOWLEDGE_INTAKE_UI_PATHS.inbox} className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm"><span className="mb-1 block text-slate-600">بحث</span><input name="search" defaultValue={current.search ?? ""} className="w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
            <label className="text-sm"><span className="mb-1 block text-slate-600">{t.fields.state}</span><select name="state" defaultValue={current.state ?? ""} className="w-full rounded-lg border border-slate-300 px-3 py-2"><option value="">—</option>{options.states.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className="text-sm"><span className="mb-1 block text-slate-600">{t.fields.sourceType}</span><select name="source_type" defaultValue={current.source_type ?? ""} className="w-full rounded-lg border border-slate-300 px-3 py-2"><option value="">—</option>{options.sourceTypes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className="text-sm"><span className="mb-1 block text-slate-600">{t.fields.riskLevel}</span><select name="risk_level" defaultValue={current.risk_level ?? ""} className="w-full rounded-lg border border-slate-300 px-3 py-2"><option value="">—</option>{options.riskLevels.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className="text-sm"><span className="mb-1 block text-slate-600">{t.fields.proposedAction}</span><select name="proposed_action" defaultValue={current.proposed_action ?? ""} className="w-full rounded-lg border border-slate-300 px-3 py-2"><option value="">—</option>{options.proposedActions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className="text-sm"><span className="mb-1 block text-slate-600">الترتيب</span><select name="sort" defaultValue={current.sort ?? "received_at"} className="w-full rounded-lg border border-slate-300 px-3 py-2">{INTAKE_SORT_VALUES.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            <label className="text-sm"><span className="mb-1 block text-slate-600">الاتجاه</span><select name="order" defaultValue={current.order ?? "desc"} className="w-full rounded-lg border border-slate-300 px-3 py-2"><option value="desc">الأحدث</option><option value="asc">الأقدم</option></select></label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white">تطبيق</button>
            <Link href={KNOWLEDGE_INTAKE_UI_PATHS.inbox} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700">مسح</Link>
          </div>
        </form>

        {page.intakes.length === 0 ? (
          <KnowledgeEmptyState title={hasFilters ? t.noMatch : t.empty} />
        ) : (
          <>
            <IntakeTable intakes={page.intakes} />
            <IntakeCards intakes={page.intakes} />
            <div className="mt-4 flex items-center justify-between gap-3 text-sm text-slate-600">
              <span>الصفحة {page.meta.page} من {Math.max(page.meta.total_pages, 1)} · {page.meta.total}</span>
              <div className="flex gap-2">
                {page.meta.has_previous ? <Link className="rounded-lg border border-slate-300 px-3 py-1.5" href={buildHref(current, { page: String(page.meta.page - 1) })}>السابق</Link> : null}
                {page.meta.has_next ? <Link className="rounded-lg border border-slate-300 px-3 py-1.5" href={buildHref(current, { page: String(page.meta.page + 1) })}>التالي</Link> : null}
              </div>
            </div>
          </>
        )}
      </KnowledgeWorkspace>
    );
  } catch (error) {
    const message = error instanceof KnowledgeIntakeUpstreamError && error.code === "upstream_unavailable" ? "خدمة Intake غير متاحة حاليًا." : "تعذّر تحميل صندوق الوارد.";
    return (
      <KnowledgeWorkspace>
        <KnowledgePageHeader title={t.title} />
        <KnowledgeErrorState message={message} retryHref={KNOWLEDGE_INTAKE_UI_PATHS.inbox} />
      </KnowledgeWorkspace>
    );
  }
}
