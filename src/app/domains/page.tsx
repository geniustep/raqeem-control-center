import Link from "next/link";
import type { CheckStatus, TenantDomain } from "@/types";
import { PageHeader } from "@/components/PageHeader";
import { HealthBadge } from "@/components/HealthBadge";
import { Pill } from "@/components/Pill";
import { DataSourceBanner } from "@/components/DataSourceBanner";
import { DataSourceErrorState } from "@/components/DataSourceErrorState";
import { loadDomains } from "@/lib/data-source/platform-data-source";
import { t } from "@/lib/i18n";

function domainStatus(d: TenantDomain): CheckStatus {
  const axes = [d.dnsStatus, d.sslStatus, d.proxyStatus, d.lastSmoke];
  if (axes.includes("failed")) return "failed";
  if (axes.includes("warning")) return "warning";
  if (axes.includes("pending")) return "pending";
  return "passed";
}

const TH = "px-3 py-2.5 text-right text-xs font-semibold text-slate-500 whitespace-nowrap";
const TD = "px-3 py-3 text-sm text-slate-700 whitespace-nowrap";

export default async function DomainsPage() {
  const result = await loadDomains();
  if (result.error) {
    return (
      <div>
        <PageHeader
          title={t.nav.domains}
          subtitle="كل النطاقات (API والواجهة) عبر المدارس وحالتها"
        />
        <DataSourceErrorState error={result.error} />
      </div>
    );
  }

  const { data: domains, meta } = result;

  return (
    <div>
      <DataSourceBanner meta={meta} />
      <PageHeader
        title={t.nav.domains}
        subtitle="كل النطاقات (API والواجهة) عبر المدارس وحالتها"
      />

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[900px] border-collapse text-right">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className={TH}>{t.common.domain}</th>
              <th className={TH}>{t.common.tenant}</th>
              <th className={TH}>{t.common.type}</th>
              <th className={TH}>{t.common.target}</th>
              <th className={TH}>{t.common.ssl}</th>
              <th className={TH}>{t.common.proxy}</th>
              <th className={TH}>{t.common.lastSmoke}</th>
              <th className={TH}>{t.common.status}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {domains.map((d) => (
              <tr key={d.domain} className="hover:bg-slate-50/60">
                <td className={`${TD} font-mono text-xs text-slate-800`} dir="ltr">{d.domain}</td>
                <td className={TD}>
                  <Link href={`/tenants/${d.tenantCode}`} className="font-mono text-xs text-brand-700 hover:underline" dir="ltr">
                    {d.tenantCode}
                  </Link>
                </td>
                <td className={TD}>
                  <Pill tone={d.type === "api" ? "blue" : "gray"} dot={false}>{d.type}</Pill>
                </td>
                <td className={`${TD} max-w-[260px] truncate font-mono text-xs text-slate-500`} dir="ltr" title={d.target}>
                  {d.target}
                </td>
                <td className={TD}><HealthBadge status={d.sslStatus} /></td>
                <td className={TD}><HealthBadge status={d.proxyStatus} /></td>
                <td className={TD}><HealthBadge status={d.lastSmoke} /></td>
                <td className={TD}><HealthBadge status={domainStatus(d)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
