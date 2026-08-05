import Link from "next/link";
import type { ReactNode } from "react";

export function KnowledgePageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function KnowledgeEmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div
      role="status"
      className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center"
    >
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {description ? (
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      ) : null}
    </div>
  );
}

export function KnowledgeErrorState({
  message,
  retryHref,
}: {
  message: string;
  retryHref?: string;
}) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center"
    >
      <p className="text-sm font-medium text-red-800">{message}</p>
      {retryHref ? (
        <Link
          href={retryHref}
          className="mt-4 inline-flex rounded-lg bg-red-700 px-3 py-2 text-sm font-medium text-white hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          إعادة المحاولة
        </Link>
      ) : null}
    </div>
  );
}

export function KnowledgeMetricCard({
  label,
  value,
  tone = "blue",
}: {
  label: string;
  value: number;
  tone?: "blue" | "amber" | "green" | "red" | "gray";
}) {
  const tones = {
    blue: "text-brand-600",
    amber: "text-amber-600",
    green: "text-emerald-600",
    red: "text-red-600",
    gray: "text-slate-600",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className={`mt-2 text-2xl font-bold ${tones[tone]}`}>{value}</div>
    </div>
  );
}
