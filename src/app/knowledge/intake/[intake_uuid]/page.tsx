import Link from "next/link";

import { KnowledgeIntakeActions } from "@/components/knowledge/KnowledgeIntakeActions";
import {
  KnowledgeIntakeRiskBadge,
  KnowledgeIntakeSourceBadge,
  KnowledgeIntakeStateBadge,
} from "@/components/knowledge/KnowledgeIntakeBadges";
import {
  KnowledgeErrorState,
  KnowledgePageHeader,
} from "@/components/knowledge/KnowledgePageChrome";
import { KnowledgeWorkspace } from "@/components/knowledge/KnowledgeWorkspace";
import { KnowledgeIntakeUpstreamError } from "@/lib/knowledge-intake/client";
import { KNOWLEDGE_INTAKE_UI_PATHS } from "@/lib/knowledge-intake/constants";
import { knowledgeIntakeCopy as t } from "@/lib/knowledge-intake/i18n";
import { loadIntakeData } from "@/lib/knowledge-intake/loaders";

export const dynamic = "force-dynamic";

function Field({ label, value, dir }: { label: string; value: string | number | null | undefined; dir?: "ltr" | "rtl" | "auto" }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-900" dir={dir}>{value === null || value === undefined || value === "" ? "—" : value}</dd>
    </div>
  );
}

export default async function KnowledgeIntakeDetailPage({
  params,
}: {
  params: Promise<{ intake_uuid: string }>;
}) {
  const { intake_uuid: intakeUuid } = await params;
  try {
    const { intake } = await loadIntakeData(intakeUuid);
    return (
      <KnowledgeWorkspace>
        <KnowledgePageHeader
          title={intake.proposed_question || intake.proposed_title || t.detailTitle}
          subtitle={t.detailTitle}
          actions={
            <Link href={KNOWLEDGE_INTAKE_UI_PATHS.inbox} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white">
              العودة إلى الصندوق
            </Link>
          }
        />

        <div className="mb-6 flex flex-wrap gap-2">
          <KnowledgeIntakeSourceBadge source={intake.source_type} />
          <KnowledgeIntakeStateBadge state={intake.state} />
          <KnowledgeIntakeRiskBadge risk={intake.risk_level} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <div className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-900">المحتوى المقترح</h2>
              <dl className="mt-4 grid gap-5">
                <Field label={t.fields.title} value={intake.proposed_title} />
                <Field label={t.fields.question} value={intake.proposed_question} />
                <Field label={t.fields.shortAnswer} value={intake.proposed_short_answer} />
                <Field label={t.fields.body} value={intake.proposed_body} />
              </dl>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-900">التصنيف والمصادر</h2>
              <dl className="mt-4 grid gap-5 md:grid-cols-2">
                <Field label={t.fields.itemType} value={intake.proposed_item_type} />
                <Field label={t.fields.intent} value={intake.proposed_intent} />
                <Field label={t.fields.language} value={intake.proposed_language} />
                <Field label={t.fields.primaryDomain} value={intake.proposed_primary_domain?.name} />
                <Field label={t.fields.domains} value={intake.proposed_domains.map((domain) => domain.name).join("، ")} />
                <Field label={t.fields.sourceUrl} value={intake.source_url} dir="ltr" />
                <Field label={t.fields.references} value={intake.proposed_references} />
                <Field label="الترخيص أو الإذن" value={intake.source_license_or_permission} />
              </dl>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-900">التحقق والمطابقة</h2>
              <dl className="mt-4 grid gap-5 md:grid-cols-2">
                <Field label={t.fields.proposedAction} value={intake.proposed_action} />
                <Field label={t.fields.duplicate} value={intake.duplicate_classification} />
                <Field label="درجة التكرار" value={intake.duplicate_score} />
                <Field label={t.fields.policyDecision} value={intake.policy_decision} />
                <Field label="أسباب القرار" value={intake.policy_reasons} />
                <Field label={t.fields.matchedItem} value={intake.matched_item?.title} />
                <Field label={t.fields.createdItem} value={intake.created_item?.title} />
                <Field label={t.fields.failure} value={intake.failure_message_safe || intake.failure_code} />
              </dl>
            </section>
          </div>

          <aside className="space-y-6">
            <KnowledgeIntakeActions
              intakeUuid={intake.intake_uuid}
              versionToken={intake.version_token}
              allowedActions={intake.allowed_actions}
            />

            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-slate-900">الفاعل والتوقيت</h2>
              <dl className="mt-4 grid gap-4">
                <Field label={t.fields.requester} value={intake.requested_by?.display_name} />
                <Field label={t.fields.externalActor} value={intake.requested_by_external_actor} />
                <Field label="المعالج" value={intake.processed_by?.display_name} />
                <Field label={t.fields.receivedAt} value={intake.received_at} dir="ltr" />
                <Field label="تم التحقق" value={intake.validated_at} dir="ltr" />
                <Field label="اتُّخذ القرار" value={intake.decided_at} dir="ltr" />
                <Field label="اكتمل" value={intake.completed_at} dir="ltr" />
              </dl>
            </section>

            {intake.source_type === "gpt" ? (
              <section className="rounded-xl border border-slate-200 bg-white p-5">
                <h2 className="text-sm font-semibold text-slate-900">بيانات مساعدة الذكاء الاصطناعي</h2>
                <dl className="mt-4 grid gap-4">
                  <Field label={t.fields.confidence} value={intake.confidence_score} />
                  <Field label="خطر الهلوسة" value={intake.hallucination_risk} />
                  <Field label="المزوّد" value={String(intake.ai_metadata.provider ?? intake.ai_metadata.ai_provider ?? "")} />
                  <Field label="النموذج" value={String(intake.ai_metadata.model ?? intake.ai_metadata.ai_model ?? "")} />
                </dl>
              </section>
            ) : null}

            <details className="rounded-xl border border-slate-200 bg-white p-5">
              <summary className="cursor-pointer text-sm font-semibold text-slate-900">معلومات تقنية</summary>
              <dl className="mt-4 grid gap-4">
                <Field label="Intake UUID" value={intake.intake_uuid} dir="ltr" />
                <Field label="Source Key" value={intake.source_key} dir="ltr" />
                <Field label="Source Request ID" value={intake.source_request_id} dir="ltr" />
                <Field label={t.fields.versionToken} value={intake.version_token} dir="ltr" />
                <Field label="Source Hash" value={intake.source_hash} dir="ltr" />
                <Field label="Snapshot Hash" value={intake.source_snapshot_hash} dir="ltr" />
              </dl>
            </details>
          </aside>
        </div>
      </KnowledgeWorkspace>
    );
  } catch (error) {
    const notFound = error instanceof KnowledgeIntakeUpstreamError && error.code === "intake_not_found";
    return (
      <KnowledgeWorkspace>
        <KnowledgePageHeader title={t.detailTitle} />
        <KnowledgeErrorState
          message={notFound ? "طلب الإدخال غير موجود." : "تعذّر تحميل طلب الإدخال."}
          retryHref={KNOWLEDGE_INTAKE_UI_PATHS.inbox}
        />
      </KnowledgeWorkspace>
    );
  }
}
