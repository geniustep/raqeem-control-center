import type { ReactNode } from "react";
import type { Tone } from "@/components/Pill";

const ACCENT: Record<Tone, string> = {
  green: "text-emerald-600",
  amber: "text-amber-600",
  red: "text-red-600",
  gray: "text-slate-600",
  blue: "text-brand-600",
};

/** Compact metric card for the dashboard grid. */
export function StatCard({
  label,
  value,
  total,
  tone = "blue",
  icon,
}: {
  label: string;
  value: number | string;
  total?: number;
  tone?: Tone;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        {icon ? <span className={ACCENT[tone]}>{icon}</span> : null}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className={`text-2xl font-bold ${ACCENT[tone]}`}>{value}</span>
        {typeof total === "number" ? (
          <span className="text-sm text-slate-400">/ {total}</span>
        ) : null}
      </div>
    </div>
  );
}
