"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { KnowledgeLogoutButton } from "@/components/knowledge/KnowledgeLogoutButton";
import { KNOWLEDGE_AUTH_PATHS } from "@/lib/knowledge-auth/constants";
import { knowledgeAuthCopy as t } from "@/lib/knowledge-auth/i18n";

export function KnowledgeMfaOnboardingPanel({
  displayName,
  login,
}: {
  displayName: string;
  login: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onRetry() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(KNOWLEDGE_AUTH_PATHS.meApi, {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });
      const envelope = (await response.json()) as {
        ok: boolean;
        data?: {
          user?: { knowledge_access_ready?: boolean; mfa_enabled?: boolean };
        } | null;
        error?: { message?: string } | null;
      };

      if (!response.ok || !envelope.ok) {
        setError(envelope.error?.message ?? t.genericError);
        setLoading(false);
        return;
      }

      if (envelope.data?.user?.knowledge_access_ready) {
        router.replace("/knowledge/dashboard");
        router.refresh();
        return;
      }

      setError(t.mfaBody);
      setLoading(false);
    } catch {
      setError(t.genericError);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <p className="font-medium">{t.mfaTitle}</p>
        <p className="mt-2">{t.mfaBody}</p>
      </div>

      <dl className="grid gap-2 text-sm text-slate-700">
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">{t.signedInAs}</dt>
          <dd className="font-medium" dir="auto">
            {displayName}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">{t.emailLabel}</dt>
          <dd className="font-mono text-xs" dir="ltr">
            {login}
          </dd>
        </div>
      </dl>

      <p className="text-sm text-slate-600">{t.mfaInstructions}</p>

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onRetry}
          disabled={loading}
          className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-70"
        >
          {loading ? t.mfaRetrying : t.mfaRetry}
        </button>
        <KnowledgeLogoutButton />
      </div>
    </div>
  );
}
