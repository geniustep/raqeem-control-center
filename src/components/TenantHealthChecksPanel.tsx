import type { Tenant, TenantHealthCheck } from "@/types";
import { Card, CardBody, CardHeader } from "@/components/Card";
import { HealthBadge } from "@/components/HealthBadge";
import { formatOptionalDateTime } from "@/lib/format";
import { t, tHealthCheckName, tHealthCheckSource } from "@/lib/i18n";
import { latestHealthChecksPerType } from "@/lib/tenant-health-checks";

const TH = "px-3 py-2.5 text-right text-xs font-semibold text-slate-500 whitespace-nowrap";
const TD = "px-3 py-3 text-sm text-slate-700 align-top";

function checkMessage(check: TenantHealthCheck): string | undefined {
  return check.message ?? check.detail;
}

/** Table of Odoo health probes for a single tenant detail page. */
export function TenantHealthChecksPanel({ tenant }: { tenant: Tenant }) {
  const L = t.tenantDetail.healthChecks;
  const checks = latestHealthChecksPerType(tenant.healthChecks);

  return (
    <Card>
      <CardHeader title={t.tenantDetail.sections.health} />
      <CardBody>
        {checks.length === 0 ? (
          <p className="text-sm text-slate-500">{L.empty}</p>
        ) : (
          <>
            <p className="mb-1 text-xs text-slate-500">{L.latestOnlyNote}</p>
            <p className="mb-3 text-xs text-slate-500">{L.note}</p>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[720px] border-collapse text-right">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className={TH}>الفحص</th>
                    <th className={TH}>{t.common.status}</th>
                    <th className={TH}>{L.checkedAt}</th>
                    <th className={TH}>{L.message}</th>
                    <th className={TH}>{L.source}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {checks.map((check) => {
                    const message = checkMessage(check);
                    return (
                      <tr
                        key={`${check.id}-${check.checkedAt ?? "no-ts"}`}
                        className="hover:bg-slate-50/60"
                      >
                        <td className={`${TD} font-medium text-slate-800`}>
                          {tHealthCheckName(check.id, check.label)}
                        </td>
                        <td className={TD}>
                          <HealthBadge status={check.status} />
                        </td>
                        <td
                          className={`${TD} font-mono text-xs text-slate-500 whitespace-nowrap`}
                          dir="ltr"
                        >
                          {formatOptionalDateTime(check.checkedAt)}
                        </td>
                        <td className={`${TD} max-w-xs text-xs text-slate-600`}>
                          {message ? (
                            <span className="break-words">{message}</span>
                          ) : (
                            <span className="text-slate-400">{t.common.none}</span>
                          )}
                        </td>
                        <td className={TD}>
                          {check.source ? (
                            <span className="font-mono text-xs text-slate-500" dir="ltr">
                              {tHealthCheckSource(check.source)}
                            </span>
                          ) : (
                            <span className="text-slate-400">{t.common.none}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}
