import type { AuditLogEntry } from "@/types";
import { HealthBadge, RiskBadge } from "@/components/HealthBadge";
import { formatDateTime } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";
import { t } from "@/lib/i18n";

const DOT: Record<string, string> = {
  passed: "bg-emerald-500",
  warning: "bg-amber-500",
  failed: "bg-red-500",
  pending: "bg-slate-300",
  unknown: "bg-slate-300",
};

/** Vertical audit timeline of operation reports, newest first. */
export function AuditTimeline({
  entries,
  showTenant = true,
}: {
  entries: AuditLogEntry[];
  showTenant?: boolean;
}) {
  if (entries.length === 0) {
    return <EmptyState title={t.audit.empty} />;
  }

  return (
    <ol className="relative space-y-4">
      {entries.map((e) => (
        <li key={e.id} className="flex gap-3">
          <div className="relative flex w-3 justify-center">
            <span className={`mt-1.5 h-3 w-3 rounded-full ${DOT[e.result] ?? "bg-slate-300"}`} />
          </div>
          <div className="min-w-0 flex-1 rounded-lg border border-slate-100 bg-white p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-800">{e.action}</span>
              <div className="flex items-center gap-2">
                <HealthBadge status={e.result} />
                <RiskBadge risk={e.risk} />
              </div>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              <span dir="ltr" className="font-mono">{formatDateTime(e.date)}</span>
              {showTenant ? <span>· {e.tenantCode}</span> : null}
              <span>· {e.actor}</span>
            </div>
            {e.notes ? (
              <div className="mt-1.5 text-xs text-slate-500">{e.notes}</div>
            ) : null}
            <div className="mt-1 font-mono text-[10px] text-slate-300" dir="ltr">
              {e.id}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
