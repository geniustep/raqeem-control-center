import type { ReactNode } from "react";

/** White rounded card used everywhere. */
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

/** Card header with a title and optional right-side content. */
export function CardHeader({
  title,
  icon,
  action,
}: {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
      <div className="flex items-center gap-2">
        {icon ? <span className="text-slate-400">{icon}</span> : null}
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      </div>
      {action ? <div className="text-sm">{action}</div> : null}
    </div>
  );
}

export function CardBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

/** A definition-list row used inside info panels. */
export function KeyValue({
  label,
  children,
  mono = false,
}: {
  label: string;
  children: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-50 py-2 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <dt className="shrink-0 text-xs font-medium text-slate-500">{label}</dt>
      <dd
        className={`min-w-0 break-words text-sm text-slate-800 ${
          mono ? "font-mono text-[13px]" : ""
        }`}
      >
        {children}
      </dd>
    </div>
  );
}
