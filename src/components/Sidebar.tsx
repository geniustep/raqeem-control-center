"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LogoutButton } from "@/components/LogoutButton";
import { t } from "@/lib/i18n";

type NavItem = {
  href: string;
  label: string;
  icon: (props: { className?: string }) => ReactNode;
};

function IconDashboard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}
function IconTenants({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 21V8l6-4 6 4v13" />
      <path d="M15 21V11l6 0v10" />
      <path d="M3 21h18M7 12h0M7 16h0M11 12h0M11 16h0" />
    </svg>
  );
}
function IconDomains({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
    </svg>
  );
}
function IconInfrastructure({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2" y="14" width="20" height="7" rx="1.5" />
      <rect x="5" y="3" width="14" height="8" rx="1.5" />
      <path d="M8 7h8M8 17h0M12 17h0M16 17h0" />
    </svg>
  );
}
function IconOperations({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
      <path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-2.9 1.2V21a2 2 0 11-4 0v-.1A1.7 1.7 0 005 19.4l-.1.1a2 2 0 11-2.8-2.8l.1-.1A1.7 1.7 0 002.6 14H2a2 2 0 110-4h.1A1.7 1.7 0 004.6 8l-.1-.1A2 2 0 117.3 5l.1.1A1.7 1.7 0 0010 4.6V4a2 2 0 114 0v.1a1.7 1.7 0 002.9 1.2l.1-.1A2 2 0 1119.8 8l-.1.1a1.7 1.7 0 00-.3 1.9" />
    </svg>
  );
}
function IconAudit({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 3h6a2 2 0 012 2v0a2 2 0 01-2 2H9a2 2 0 01-2-2v0a2 2 0 012-2z" />
      <path d="M7 5H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <path d="M8 12h8M8 16h5" />
    </svg>
  );
}
function IconSettings({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </svg>
  );
}

const NAV: NavItem[] = [
  { href: "/", label: t.nav.dashboard, icon: IconDashboard },
  { href: "/tenants", label: t.nav.tenants, icon: IconTenants },
  { href: "/domains", label: t.nav.domains, icon: IconDomains },
  { href: "/infrastructure", label: t.nav.infrastructure, icon: IconInfrastructure },
  { href: "/operations", label: t.nav.operations, icon: IconOperations },
  { href: "/audit", label: t.nav.audit, icon: IconAudit },
  { href: "/settings", label: t.nav.settings, icon: IconSettings },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex h-full flex-col gap-1 p-3">
      <div className="mb-4 flex items-center gap-3 px-2 pt-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">
          ر
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold text-slate-900">{t.app.name}</div>
          <div className="text-xs text-slate-500">{t.app.operator}</div>
        </div>
      </div>

      {NAV.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-brand-50 text-brand-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}

      <div className="mt-auto space-y-1">
        <LogoutButton />
      </div>

      <div className="mt-3 rounded-lg bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-500 ring-1 ring-inset ring-slate-200">
        المرحلة الأولى — للقراءة والمحاكاة فقط. لا تُنفَّذ أي عمليات فعلية على
        الخوادم.
      </div>
    </nav>
  );
}
