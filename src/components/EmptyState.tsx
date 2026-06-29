import type { ReactNode } from "react";

/** Friendly empty placeholder for lists/tables with no rows. */
export function EmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <div className="text-slate-300">
        {icon ?? (
          <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M3 9h18M8 14h8" />
          </svg>
        )}
      </div>
      <div className="text-sm font-semibold text-slate-700">{title}</div>
      {description ? <div className="text-xs text-slate-500">{description}</div> : null}
    </div>
  );
}
