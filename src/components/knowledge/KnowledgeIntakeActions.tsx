"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { KNOWLEDGE_INTAKE_BFF_PATHS } from "@/lib/knowledge-intake/constants";
import { knowledgeIntakeCopy as t } from "@/lib/knowledge-intake/i18n";
import type { KnowledgeIntakeAllowedActions } from "@/lib/knowledge-intake/types";

interface Props {
  intakeUuid: string;
  versionToken: string;
  allowedActions: KnowledgeIntakeAllowedActions;
}

type ActionKey =
  | "validate"
  | "submit-for-human-review"
  | "reject"
  | "cancel"
  | "retry-validation";

const LABELS: Record<ActionKey, string> = {
  validate: t.actions.validate,
  "submit-for-human-review": t.actions.submitReview,
  reject: t.actions.reject,
  cancel: t.actions.cancel,
  "retry-validation": t.actions.retry,
};

export function KnowledgeIntakeActions({
  intakeUuid,
  versionToken,
  allowedActions,
}: Props) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState<ActionKey | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const available: ActionKey[] = [];
  if (allowedActions.validate) available.push("validate");
  if (allowedActions.submit_for_human_review) available.push("submit-for-human-review");
  if (allowedActions.reject) available.push("reject");
  if (allowedActions.cancel) available.push("cancel");
  if (allowedActions.retry_validation) available.push("retry-validation");

  async function runAction(action: ActionKey) {
    const requiresReason = action === "reject" || action === "submit-for-human-review";
    if (requiresReason && !reason.trim()) {
      setError("اكتب سببًا واضحًا قبل تنفيذ هذا الإجراء.");
      return;
    }
    setPending(action);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch(
        KNOWLEDGE_INTAKE_BFF_PATHS.action(intakeUuid, action),
        {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason: reason.trim() || undefined,
            version_token: versionToken,
            idempotency_key: crypto.randomUUID(),
          }),
        },
      );
      const body = (await response.json()) as {
        ok?: boolean;
        error?: { message?: string } | null;
      };
      if (!response.ok || !body.ok) {
        throw new Error(body.error?.message || t.messages.actionError);
      }
      setMessage(t.messages.actionSuccess);
      setReason("");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t.messages.actionError);
    } finally {
      setPending(null);
    }
  }

  if (available.length === 0 && !allowedActions.accept_as_draft) {
    return (
      <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
        {t.messages.noPermission}
      </p>
    );
  }

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-900">الإجراءات المتاحة</h2>
      {(allowedActions.submit_for_human_review || allowedActions.reject) ? (
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">السبب</span>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            maxLength={2000}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </label>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {available.map((action) => (
          <button
            key={action}
            type="button"
            disabled={pending !== null}
            onClick={() => void runAction(action)}
            className={`rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 ${
              action === "reject"
                ? "border border-red-300 bg-white text-red-700 hover:bg-red-50"
                : action === "cancel"
                  ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  : "bg-brand-600 text-white hover:bg-brand-700"
            }`}
          >
            {pending === action ? "جارٍ التنفيذ…" : LABELS[action]}
          </button>
        ))}
      </div>
      {allowedActions.accept_as_draft ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {t.messages.gateClosed} لن يُفعّل قبول المسودة من Next.js في هذه المرحلة.
        </div>
      ) : null}
      {message ? <p role="status" className="text-sm text-green-700">{message}</p> : null}
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
    </section>
  );
}
