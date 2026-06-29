import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { TenantStatusCard } from "@/components/TenantStatusCard";
import { Card, CardBody, CardHeader } from "@/components/Card";
import { HealthBadge } from "@/components/HealthBadge";
import { EmptyState } from "@/components/EmptyState";
import { DataSourceBanner } from "@/components/DataSourceBanner";
import { loadDashboardData } from "@/lib/data-source/platform-data-source";
import { formatDateTime } from "@/lib/format";
import { t } from "@/lib/i18n";

export default async function DashboardPage() {
  const { data, meta } = await loadDashboardData();
  const { summary, needsAttention, recentRuns: recent } = data;
  const M = t.dashboard.metrics;

  return (
    <div>
      <DataSourceBanner meta={meta} />
      <PageHeader title={t.dashboard.title} subtitle={t.dashboard.subtitle} />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label={M.totalTenants} value={summary.totalTenants} tone="blue" />
        <StatCard label={M.tenantsLive} value={summary.tenantsLive} total={summary.totalTenants} tone="green" />
        <StatCard label={M.tenantsWithWarnings} value={summary.tenantsWithWarnings} total={summary.totalTenants} tone="amber" />
        <StatCard label={M.backendHealthy} value={summary.backendHealthy} total={summary.totalTenants} tone="green" />
        <StatCard label={M.proxyEnabled} value={summary.proxyEnabled} total={summary.totalTenants} tone="blue" />
        <StatCard label={M.sslReady} value={summary.sslReady} total={summary.totalTenants} tone="green" />
        <StatCard label={M.servicesActive} value={summary.servicesActive} total={summary.totalTenants} tone="green" />
        <StatCard label={M.frontendReady} value={summary.frontendReady} total={summary.totalTenants} tone="blue" />
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              {t.dashboard.needsAttention}
            </h2>
            <Link href="/tenants" className="text-xs font-medium text-brand-700 hover:underline">
              {t.tenants.title} ←
            </Link>
          </div>
          {needsAttention.length === 0 ? (
            <EmptyState title={t.dashboard.allHealthy} />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {needsAttention.map((tn) => (
                <TenantStatusCard key={tn.code} tenant={tn} />
              ))}
            </div>
          )}
        </section>

        <section className="lg:col-span-2">
          <Card>
            <CardHeader
              title={t.dashboard.recentOperations}
              action={
                <Link href="/operations" className="text-xs font-medium text-brand-700 hover:underline">
                  {t.operations.title} ←
                </Link>
              }
            />
            <CardBody className="p-0">
              <ul className="divide-y divide-slate-100">
                {recent.map((run) => (
                  <li key={run.id} className="flex items-start justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-slate-800">{run.title}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                        <span>{run.tenantCode}</span>
                        <span dir="ltr" className="font-mono">
                          {formatDateTime(run.finishedAt ?? run.startedAt)}
                        </span>
                      </div>
                    </div>
                    <HealthBadge status={run.result} />
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </section>
      </div>
    </div>
  );
}
