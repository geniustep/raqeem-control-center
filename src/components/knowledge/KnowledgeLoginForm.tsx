"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";

import { KNOWLEDGE_AUTH_PATHS } from "@/lib/knowledge-auth/constants";
import { knowledgeAuthCopy as t } from "@/lib/knowledge-auth/i18n";

export function KnowledgeLoginForm({
  showTotpField = true,
}: {
  showTotpField?: boolean;
}) {
  const router = useRouter();
  const emailId = useId();
  const passwordId = useId();
  const totpId = useId();
  const statusId = useId();

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: Record<string, string> = { login, password };
      if (totp.trim()) payload.totp = totp.trim();

      const response = await fetch(KNOWLEDGE_AUTH_PATHS.loginApi, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        credentials: "same-origin",
      });

      const envelope = (await response.json()) as {
        ok: boolean;
        data?: { redirect_to?: string } | null;
        error?: { message?: string } | null;
      };

      if (!response.ok || !envelope.ok) {
        setError(envelope.error?.message ?? t.genericError);
        setLoading(false);
        return;
      }

      const redirectTo =
        envelope.data?.redirect_to ?? KNOWLEDGE_AUTH_PATHS.home;
      router.replace(redirectTo);
      router.refresh();
    } catch {
      setError(t.genericError);
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit} autoComplete="off" noValidate>
      <div
        id={statusId}
        role="status"
        aria-live="polite"
        className="sr-only"
      >
        {loading ? t.submitting : error ? error : ""}
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      ) : null}

      <div>
        <label
          htmlFor={emailId}
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          {t.emailLabel}
        </label>
        <input
          id={emailId}
          name="login"
          type="email"
          required
          value={login}
          onChange={(event) => setLogin(event.target.value)}
          autoComplete="username"
          dir="ltr"
          aria-describedby={statusId}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-brand-500 focus:border-brand-500 focus:ring-2"
        />
      </div>

      <div>
        <label
          htmlFor={passwordId}
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          {t.passwordLabel}
        </label>
        <input
          id={passwordId}
          name="password"
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          dir="ltr"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-brand-500 focus:border-brand-500 focus:ring-2"
        />
      </div>

      {showTotpField ? (
        <div>
          <label
            htmlFor={totpId}
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            {t.totpLabel}
          </label>
          <input
            id={totpId}
            name="totp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={totp}
            onChange={(event) => setTotp(event.target.value)}
            dir="ltr"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-brand-500 focus:border-brand-500 focus:ring-2"
          />
          <p className="mt-1 text-xs text-slate-500">{t.totpHint}</p>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? t.submitting : t.submit}
      </button>
    </form>
  );
}
