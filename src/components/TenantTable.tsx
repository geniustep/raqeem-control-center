import Link from "next/link";
import type { CheckStatus, Tenant } from "@/types";
import { deriveTenantOverallStatus, getTenantWarnings } from "@/lib/tenant-status";
import { StatusBadge } from "@/components/StatusBadge";
import { HealthBadge } from "@/components/HealthBadge";
import { Pill } from "@/components/Pill";
import { t } from "@/lib/i18n";

function backendStatus(tn: Tenant): CheckStatus {
  if (tn.apiHealth.httpsStatus === 200 && tn.apiHealth.noCloudflareErrors) return "passed";
  if (tn.apiHealth.httpsStatus >= 400) return "failed";
  return "pending";
}
function frontendStatus(tn: Tenant): CheckStatus {
  if (!tn.frontend.opens) return "pending";
  return tn.frontend.brandingStatus === "missing" ? "warning" : "passed";
}
function sslStatus(tn: Tenant): CheckStatus {
  return tn.ssl.ready ? "passed" : "pending";
}
function proxyStatus(tn: Tenant): CheckStatus {
  if (!tn.cloudflare.proxyEnabled) return "pending";
  return tn.cloudflare.smokePassed ? "passed" : "failed";
}
function dbStatus(tn: Tenant): CheckStatus {
  return tn.database.reachable ? "passed" : "failed";
}
function odooStatus(tn: Tenant): CheckStatus {
  return tn.odoo.active && tn.odoo.enabled ? "passed" : "failed";
}

const TH = "px-3 py-2.5 text-right text-xs font-semibold text-slate-500 whitespace-nowrap";
const TD = "px-3 py-3 text-sm text-slate-700 whitespace-nowrap";

export function TenantTable({ tenants }: { tenants: Tenant[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[1100px] border-collapse text-right">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <th className={TH}>{t.common.schoolName}</th>
            <th className={TH}>{t.common.code}</th>
            <th className={TH}>{t.common.frontendDomain}</th>
            <th className={TH}>{t.common.apiDomain}</th>
            <th className={TH}>{t.common.overallStatus}</th>
            <th className={TH}>{t.common.backend}</th>
            <th className={TH}>{t.common.frontend}</th>
            <th className={TH}>{t.common.ssl}</th>
            <th className={TH}>{t.common.proxy}</th>
            <th className={TH}>{t.common.database}</th>
            <th className={TH}>{t.common.odooService}</th>
            <th className={TH}>{t.common.warnings}</th>
            <th className={TH}></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tenants.map((tn) => {
            const warnings = getTenantWarnings(tn);
            return (
              <tr key={tn.code} className="hover:bg-slate-50/60">
                <td className={`${TD} font-medium text-slate-900`}>{tn.name}</td>
                <td className={`${TD} font-mono text-xs`} dir="ltr">{tn.code}</td>
                <td className={`${TD} font-mono text-xs text-slate-500`} dir="ltr">
                  {tn.frontendDomain}
                </td>
                <td className={`${TD} font-mono text-xs text-slate-500`} dir="ltr">
                  {tn.apiDomain}
                </td>
                <td className={TD}>
                  <StatusBadge status={deriveTenantOverallStatus(tn)} />
                </td>
                <td className={TD}><HealthBadge status={backendStatus(tn)} /></td>
                <td className={TD}><HealthBadge status={frontendStatus(tn)} /></td>
                <td className={TD}><HealthBadge status={sslStatus(tn)} /></td>
                <td className={TD}><HealthBadge status={proxyStatus(tn)} /></td>
                <td className={TD}><HealthBadge status={dbStatus(tn)} /></td>
                <td className={TD}><HealthBadge status={odooStatus(tn)} /></td>
                <td className={TD}>
                  <Pill tone={warnings.length > 0 ? "amber" : "gray"} dot={false}>
                    {warnings.length}
                  </Pill>
                </td>
                <td className={TD}>
                  <Link
                    href={`/tenants/${tn.code}`}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-brand-700 transition-colors hover:border-brand-300 hover:bg-brand-50"
                  >
                    {t.common.openDetails}
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
