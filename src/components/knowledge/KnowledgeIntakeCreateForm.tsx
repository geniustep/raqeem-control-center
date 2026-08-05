"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";

import { KNOWLEDGE_INTAKE_BFF_PATHS, KNOWLEDGE_INTAKE_UI_PATHS } from "@/lib/knowledge-intake/constants";
import { knowledgeIntakeCopy as t } from "@/lib/knowledge-intake/i18n";
import type { KnowledgeDomain, KnowledgeOption } from "@/lib/knowledge-read/types";
import type { KnowledgeIntakeOption } from "@/lib/knowledge-intake/types";

interface Props {
  sourceTypes: KnowledgeIntakeOption[];
  riskLevels: KnowledgeIntakeOption[];
  itemTypes: KnowledgeOption[];
  intents: KnowledgeOption[];
  languages: KnowledgeOption[];
  domains: KnowledgeDomain[];
}

type ApiEnvelope = {
  ok: boolean;
  data?: { intake_uuid?: string } | null;
  error?: { message?: string } | null;
};

function actorForSource(sourceType: string): "human" | "ai" | "importer" | "system" {
  if (sourceType === "gpt") return "ai";
  if (sourceType === "import") return "importer";
  if (sourceType === "internal") return "system";
  return "human";
}

export function KnowledgeIntakeCreateForm({
  sourceTypes,
  riskLevels,
  itemTypes,
  intents,
  languages,
  domains,
}: Props) {
  const router = useRouter();
  const [sourceType, setSourceType] = useState("human_ui");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const visibleSources = useMemo(
    () => sourceTypes.filter((option) => ["human_ui", "gpt", "import", "internal"].includes(option.value)),
    [sourceTypes],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(null);
    const form = new FormData(event.currentTarget);
    const selectedDomains = form
      .getAll("proposed_domain_ids")
      .map(Number)
      .filter((value) => Number.isInteger(value) && value > 0);
    const primaryDomain = Number(form.get("proposed_primary_domain_id"));
    const payload = {
      source_type: sourceType,
      actor_type: actorForSource(sourceType),
      requested_by_external_actor:
        sourceType === "gpt" ? String(form.get("requested_by_external_actor") ?? "").trim() : undefined,
      source_key: String(form.get("source_key") ?? "").trim() || undefined,
      source_request_id: crypto.randomUUID(),
      idempotency_key: crypto.randomUUID(),
      proposed_title: String(form.get("proposed_title") ?? "").trim(),
      proposed_question: String(form.get("proposed_question") ?? "").trim(),
      proposed_short_answer: String(form.get("proposed_short_answer") ?? "").trim(),
      proposed_body: String(form.get("proposed_body") ?? "").trim() || undefined,
      proposed_item_type: String(form.get("proposed_item_type") ?? ""),
      proposed_intent: String(form.get("proposed_intent") ?? ""),
      proposed_language: String(form.get("proposed_language") ?? "ar"),
      proposed_domain_ids: selectedDomains,
      proposed_primary_domain_id:
        Number.isInteger(primaryDomain) && primaryDomain > 0 ? primaryDomain : undefined,
      proposed_references: String(form.get("proposed_references") ?? "").trim() || undefined,
      proposed_review_interval_days: Number(form.get("proposed_review_interval_days") ?? 180),
      source_url: String(form.get("source_url") ?? "").trim() || undefined,
      ai_provider: sourceType === "gpt" ? String(form.get("ai_provider") ?? "").trim() || undefined : undefined,
      ai_model: sourceType === "gpt" ? String(form.get("ai_model") ?? "").trim() || undefined : undefined,
      confidence_score:
        sourceType === "gpt" && String(form.get("confidence_score") ?? "").trim()
          ? Number(form.get("confidence_score"))
          : undefined,
      risk_level: String(form.get("risk_level") ?? "low"),
    };

    try {
      const response = await fetch(KNOWLEDGE_INTAKE_BFF_PATHS.intakes, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as ApiEnvelope;
      if (!response.ok || !body.ok || !body.data?.intake_uuid) {
        throw new Error(body.error?.message || t.messages.actionError);
      }
      setSuccess(t.messages.created);
      router.push(KNOWLEDGE_INTAKE_UI_PATHS.detail(body.data.intake_uuid));
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t.messages.actionError);
    } finally {
      setPending(false);
    }
  }

  const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500";

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-slate-700">{t.fields.sourceType}</span>
          <select className={inputClass} value={sourceType} onChange={(event) => setSourceType(event.target.value)}>
            {visibleSources.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-700">{t.fields.riskLevel}</span>
          <select name="risk_level" className={inputClass} defaultValue="low">
            {riskLevels.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        {sourceType === "gpt" ? (
          <>
            <label className="text-sm">
              <span className="mb-1 block text-slate-700">{t.fields.externalActor}</span>
              <input name="requested_by_external_actor" required className={inputClass} placeholder="chatgpt:user-request" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-700">AI Provider</span>
              <input name="ai_provider" className={inputClass} placeholder="OpenAI" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-700">AI Model</span>
              <input name="ai_model" className={inputClass} placeholder="GPT" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-700">Confidence (0–1)</span>
              <input name="confidence_score" type="number" min="0" max="1" step="0.01" className={inputClass} />
            </label>
          </>
        ) : null}
      </div>

      <div className="grid gap-4">
        <label className="text-sm">
          <span className="mb-1 block text-slate-700">{t.fields.title}</span>
          <input name="proposed_title" required maxLength={240} className={inputClass} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-700">{t.fields.question}</span>
          <input name="proposed_question" required maxLength={500} className={inputClass} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-700">{t.fields.shortAnswer}</span>
          <textarea name="proposed_short_answer" required rows={3} maxLength={2000} className={inputClass} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-700">{t.fields.body}</span>
          <textarea name="proposed_body" rows={10} maxLength={40000} className={inputClass} />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="text-sm">
          <span className="mb-1 block text-slate-700">{t.fields.itemType}</span>
          <select name="proposed_item_type" required className={inputClass}>{itemTypes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-700">{t.fields.intent}</span>
          <select name="proposed_intent" required className={inputClass}>{intents.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-700">{t.fields.language}</span>
          <select name="proposed_language" required defaultValue="ar" className={inputClass}>{languages.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <fieldset className="rounded-lg border border-slate-200 p-3">
          <legend className="px-1 text-sm text-slate-700">{t.fields.domains}</legend>
          <div className="mt-2 grid max-h-44 gap-2 overflow-y-auto">
            {domains.map((domain) => (
              <label key={domain.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="proposed_domain_ids" value={domain.id} />
                <span>{domain.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="text-sm">
          <span className="mb-1 block text-slate-700">{t.fields.primaryDomain}</span>
          <select name="proposed_primary_domain_id" className={inputClass} defaultValue="">
            <option value="">—</option>
            {domains.map((domain) => <option key={domain.id} value={domain.id}>{domain.name}</option>)}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-slate-700">{t.fields.sourceUrl}</span>
          <input name="source_url" type="url" className={inputClass} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-700">Source Key</span>
          <input name="source_key" className={inputClass} />
        </label>
        <label className="text-sm md:col-span-2">
          <span className="mb-1 block text-slate-700">{t.fields.references}</span>
          <textarea name="proposed_references" rows={3} className={inputClass} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-700">مدة المراجعة بالأيام</span>
          <input name="proposed_review_interval_days" type="number" min="1" defaultValue="180" className={inputClass} />
        </label>
      </div>

      <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{t.messages.draftOnly}</p>
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
      {success ? <p role="status" className="text-sm text-green-700">{success}</p> : null}
      <button disabled={pending} className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60">
        {pending ? t.actions.saving : t.actions.save}
      </button>
    </form>
  );
}
