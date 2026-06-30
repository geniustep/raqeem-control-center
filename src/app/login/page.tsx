import { Card, CardBody, CardHeader } from "@/components/Card";
import { safeCallbackUrl } from "@/lib/auth/routes";
import { dir, t } from "@/lib/i18n";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(params.callbackUrl);
  const showError = params.error === "1";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-lg font-bold text-white">
            ر
          </div>
          <h1 className="text-xl font-bold text-slate-900">{t.app.name}</h1>
          <p className="mt-1 text-sm text-slate-500">{t.auth.loginSubtitle}</p>
        </div>

        <Card>
          <CardHeader title={t.auth.loginTitle} />
          <CardBody>
            {showError ? (
              <div
                role="alert"
                className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                {t.auth.loginError}
              </div>
            ) : null}

            <form
              method="POST"
              action="/api/auth/login"
              className="space-y-4"
              autoComplete="off"
            >
              <input type="hidden" name="callbackUrl" value={callbackUrl} />

              <div>
                <label
                  htmlFor="username"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  {t.auth.usernameLabel}
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  dir={dir}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-brand-500 focus:border-brand-500 focus:ring-2"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  {t.auth.passwordLabel}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  dir="ltr"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-brand-500 focus:border-brand-500 focus:ring-2"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
              >
                {t.auth.loginButton}
              </button>
            </form>
          </CardBody>
        </Card>

        <p className="mt-4 text-center text-xs text-slate-400">{t.auth.loginFooter}</p>
      </div>
    </div>
  );
}
