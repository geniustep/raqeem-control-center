import type { LifecycleStageStatus, Tenant } from "@/types";
import { tStage } from "@/lib/i18n";
import { LifecycleBadge } from "@/components/StatusBadge";

const NODE: Record<LifecycleStageStatus, string> = {
  done: "bg-emerald-500 border-emerald-500",
  current: "bg-white border-brand-500 ring-4 ring-brand-100",
  warning: "bg-amber-500 border-amber-500",
  blocked: "bg-red-500 border-red-500",
  pending: "bg-white border-slate-300",
};

const LINE: Record<LifecycleStageStatus, string> = {
  done: "bg-emerald-300",
  current: "bg-brand-200",
  warning: "bg-amber-300",
  blocked: "bg-red-300",
  pending: "bg-slate-200",
};

/** Vertical lifecycle timeline (draft -> live) with per-stage status. */
export function LifecycleTimeline({ tenant }: { tenant: Tenant }) {
  const stages = tenant.lifecycle;

  return (
    <ol className="relative">
      {stages.map((s, i) => {
        const last = i === stages.length - 1;
        return (
          <li key={s.stage} className="flex gap-3 pb-5 last:pb-0">
            {/* Node + connector gutter. */}
            <div className="relative flex w-4 flex-col items-center">
              <span
                className={`z-10 mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 ${NODE[s.status]}`}
              />
              {!last ? (
                <span
                  className={`absolute top-4 h-[calc(100%-0.5rem)] w-0.5 ${LINE[s.status]}`}
                />
              ) : null}
            </div>

            <div className="min-w-0 flex-1 pb-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-800">
                  {tStage(s.stage)}
                </span>
                <LifecycleBadge status={s.status} />
              </div>
              <div className="mt-0.5 font-mono text-[11px] text-slate-400" dir="ltr">
                {s.stage}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
