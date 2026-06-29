import Link from "next/link";
import type { Tenant } from "@/types";
import {
  deriveTenantOverallStatus,
  getLifecycleProgress,
  getTenantWarnings,
} from "@/lib/tenant-status";
import { StatusBadge } from "@/components/StatusBadge";

/** Compact tenant summary card used in the "needs attention" dashboard list. */
export function TenantStatusCard({ tenant }: { tenant: Tenant }) {
  const status = deriveTenantOverallStatus(tenant);
  const warnings = getTenantWarnings(tenant);
  const progress = getLifecycleProgress(tenant);

  return (
    <Link
      href={`/tenants/${tenant.code}`}
      className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-brand-300 hover:bg-brand-50/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-semibold text-slate-900">{tenant.name}</div>
          <div className="mt-0.5 font-mono text-xs text-slate-500" dir="ltr">
            {tenant.frontendDomain}
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
          <span>التقدّم</span>
          <span>
            {progress.done}/{progress.total}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-brand-500"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>

      {warnings.length > 0 ? (
        <ul className="mt-3 space-y-1">
          {warnings.slice(0, 2).map((w) => (
            <li key={w} className="flex items-start gap-1.5 text-xs text-amber-700">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
              <span className="min-w-0">{w}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-3 text-xs text-emerald-600">جاهزة — لا توجد تنبيهات</div>
      )}
    </Link>
  );
}
