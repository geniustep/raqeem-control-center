"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { KnowledgeLogoutButton } from "@/components/knowledge/KnowledgeLogoutButton";
import { KNOWLEDGE_INTAKE_UI_PATHS } from "@/lib/knowledge-intake/constants";
import { knowledgeIntakeCopy } from "@/lib/knowledge-intake/i18n";
import { KNOWLEDGE_UI_PATHS } from "@/lib/knowledge-read/constants";
import { knowledgeUiCopy as t } from "@/lib/knowledge-read/i18n";

const NAV = [
  { href: KNOWLEDGE_UI_PATHS.dashboard, label: t.nav.dashboard },
  { href: KNOWLEDGE_UI_PATHS.items, label: t.nav.items },
  { href: KNOWLEDGE_INTAKE_UI_PATHS.inbox, label: knowledgeIntakeCopy.nav },
  { href: KNOWLEDGE_UI_PATHS.domains, label: t.nav.domains },
  { href: KNOWLEDGE_UI_PATHS.activity, label: t.nav.activity },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 p-3" aria-label="قائمة المعرفة">
      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
              active
                ? "bg-brand-50 text-brand-800"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function KnowledgeShell({
  children,
  userName,
}: {
  children: ReactNode;
  userName?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-l border-slate-200 bg-white md:flex md:flex-col">
        <div className="border-b border-slate-200 px-4 py-4">
          <div className="text-sm font-bold text-slate-900">{t.productName}</div>
          {userName ? (
            <div className="mt-1 truncate text-xs text-slate-500" dir="auto">
              {userName}
            </div>
          ) : null}
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavLinks />
        </div>
        <div className="border-t border-slate-200 p-3">
          <KnowledgeLogoutButton className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <div>
            <div className="text-sm font-bold text-slate-900">{t.productName}</div>
            {userName ? (
              <div className="text-xs text-slate-500" dir="auto">
                {userName}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            aria-expanded={open}
            aria-controls="knowledge-mobile-nav"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? t.nav.closeMenu : t.nav.openMenu}
          </button>
        </header>

        {open ? (
          <div id="knowledge-mobile-nav" className="border-b border-slate-200 bg-white md:hidden">
            <NavLinks onNavigate={() => setOpen(false)} />
            <div className="border-t border-slate-100 p-3">
              <KnowledgeLogoutButton className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700" />
            </div>
          </div>
        ) : null}

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
