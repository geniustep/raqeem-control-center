import { PageHeader } from "@/components/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/Card";
import { HealthBadge, RiskBadge } from "@/components/HealthBadge";
import { OperationsCatalogPanel } from "@/components/OperationsCatalogPanel";
import { WarningCallout } from "@/components/WarningCallout";
import { DataSourceBanner } from "@/components/DataSourceBanner";
import { DataSourceErrorState } from "@/components/DataSourceErrorState";
import {
  loadOperationsPageData,
  loadTenants,
} from "@/lib/data-source/platform-data-source";
import { formatDateTime } from "@/lib/format";
import { t } from "@/lib/i18n";
import Link from "next/link";

const TH = "px-3 py-2.5 text-right text-xs font-semibold text-slate-500 whitespace-nowrap";
const TD = "px-3 py-3 text-sm text-slate-700";

export default async function OperationsPage() {
  const [result, tenantsResult] = await Promise.all([
    loadOperationsPageData(),
    loadTenants(),
  ]);

  if (result.error) {
    return (
      <div>
        <PageHeader title={t.operations.title} subtitle={t.operations.subtitle} />
        <DataSourceErrorState error={result.error} />
      </div>
    );
  }

  const { data, meta } = result;
  const { catalog, runs } = data;
  const tenants = tenantsResult.data ?? [];

  return (
    <div>
      <DataSourceBanner meta={meta} />
      <PageHeader title={t.operations.title} subtitle={t.operations.subtitle} />

      <div className="mb-6">
        <WarningCallout variant="info" title={t.common.dryRun}>
          {t.operations.phaseBanner}
        </WarningCallout>
      </div>

      <OperationsCatalogPanel catalog={catalog} tenants={tenants} />

      <section>
        <Card>
          <CardHeader title={t.operations.runs} />
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-right">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className={TH}>{t.common.date}</th>
                    <th className={TH}>{t.common.tenant}</th>
                    <th className={TH}>{t.common.action}</th>
                    <th className={TH}>{t.common.risk}</th>
                    <th className={TH}>{t.common.result}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {runs.map((run) => (
                    <tr key={run.id} className="hover:bg-slate-50/60">
                      <td className={`${TD} whitespace-nowrap font-mono text-xs text-slate-500`} dir="ltr">
                        {formatDateTime(run.finishedAt ?? run.startedAt)}
                      </td>
                      <td className={`${TD} whitespace-nowrap`}>
                        <Link href={`/tenants/${run.tenantCode}`} className="font-mono text-xs text-brand-700 hover:underline" dir="ltr">
                          {run.tenantCode}
                        </Link>
                      </td>
                      <td className={TD}>
                        <div className="font-medium text-slate-800">{run.title}</div>
                        <div className="font-mono text-[10px] text-slate-400" dir="ltr">{run.id}</div>
                      </td>
                      <td className={`${TD} whitespace-nowrap`}><RiskBadge risk={run.riskLevel} /></td>
                      <td className={`${TD} whitespace-nowrap`}><HealthBadge status={run.result} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
