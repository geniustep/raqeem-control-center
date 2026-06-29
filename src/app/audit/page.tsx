import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardBody } from "@/components/Card";
import { HealthBadge, RiskBadge } from "@/components/HealthBadge";
import { EmptyState } from "@/components/EmptyState";
import { DataSourceBanner } from "@/components/DataSourceBanner";
import { loadAuditLogs } from "@/lib/data-source/platform-data-source";
import { formatDateTime } from "@/lib/format";
import { t } from "@/lib/i18n";

const TH = "px-3 py-2.5 text-right text-xs font-semibold text-slate-500 whitespace-nowrap";
const TD = "px-3 py-3 text-sm text-slate-700 align-top";

export default async function AuditPage() {
  const { data: entries, meta } = await loadAuditLogs();

  return (
    <div>
      <DataSourceBanner meta={meta} />
      <PageHeader title={t.audit.title} subtitle={t.audit.subtitle} />

      {entries.length === 0 ? (
        <EmptyState title={t.audit.empty} />
      ) : (
        <Card>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-right">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className={TH}>{t.common.date}</th>
                    <th className={TH}>{t.common.tenant}</th>
                    <th className={TH}>{t.common.actor}</th>
                    <th className={TH}>{t.common.action}</th>
                    <th className={TH}>{t.common.result}</th>
                    <th className={TH}>{t.common.risk}</th>
                    <th className={TH}>{t.common.notes}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {entries.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/60">
                      <td className={`${TD} whitespace-nowrap font-mono text-xs text-slate-500`} dir="ltr">
                        {formatDateTime(e.date)}
                      </td>
                      <td className={`${TD} whitespace-nowrap`}>
                        <Link href={`/tenants/${e.tenantCode}`} className="font-mono text-xs text-brand-700 hover:underline" dir="ltr">
                          {e.tenantCode}
                        </Link>
                      </td>
                      <td className={`${TD} whitespace-nowrap font-mono text-xs text-slate-500`} dir="ltr">
                        {e.actor}
                      </td>
                      <td className={TD}>
                        <div className="font-medium text-slate-800">{e.action}</div>
                        <div className="font-mono text-[10px] text-slate-400" dir="ltr">{e.id}</div>
                      </td>
                      <td className={`${TD} whitespace-nowrap`}><HealthBadge status={e.result} /></td>
                      <td className={`${TD} whitespace-nowrap`}><RiskBadge risk={e.risk} /></td>
                      <td className={`${TD} text-xs text-slate-500`}>{e.notes ?? t.common.none}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
