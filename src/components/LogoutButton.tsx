import { t } from "@/lib/i18n";

/** POST form that clears the session cookie server-side. */
export function LogoutButton() {
  return (
    <form method="POST" action="/api/auth/logout">
      <button
        type="submit"
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
      >
        <svg
          className="h-5 w-5 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden
        >
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
        </svg>
        <span>{t.auth.logout}</span>
      </button>
    </form>
  );
}
