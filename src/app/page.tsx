import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { TenantStatusCard } from "@/components/TenantStatusCard";
import { Card, CardBody, CardHeader } from "@/components/Card";
import { HealthBadge } from "@/components/HealthBadge";
import { EmptyState } from "@/components/EmptyState";
import { DataSourceBanner } from "@/components/DataSourceBanner";
import { DataSourceErrorState } from "@/components/DataSourceErrorState";
import { WarningCallout } from "@/components/WarningCallout";
import { loadDashboardData } from "@/lib/data-source/platform-data-source";
import { formatOptionalDateTime } from "@/lib/format";
import { t } from "@/lib/i18n";

export default async function DashboardPage() {
  const result = await loadDashboardData();
  if (result.error) {
    return (
      <div>
        <PageHeader title={t.dashboard.title} subtitle={t.dashboard.subtitle} />
        <DataSourceErrorState error={result.error} />
      </div>
    );
  }

  const { data, meta } = result;
  const { summary, needsAttention, recentRuns: recent } = data;
  const M = t.dashboard.metrics;

  return (
    <div>
      <DataSourceBanner meta={meta} />
      <PageHeader title={t.dashboard.title} subtitle={t.dashboard.subtitle} />

      <div className="mb-4">
        <WarningCallout variant="info">{t.dashboard.healthChecksNote}</WarningCallout>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label={M.totalTenants} value={summary.totalTenants} tone="blue" />
        <StatCard
          label={M.tenantsWithWarnings}
          value={summary.tenantsWithWarnings}
          total={summary.totalTenants}
          tone="amber"
        />
        <StatCard
          label={M.criticalCount}
          value={summary.criticalCount}
          total={summary.totalTenants}
          tone="red"
        />
        <StatCard
          label={M.sslReady}
          value={summary.sslReady}
          total={summary.totalTenants}
          tone="green"
        />
        <StatCard
          label={M.proxyReady}
          value={summary.proxyReady}
          total={summary.totalTenants}
          tone="blue"
        />
        <StatCard
          label={M.servicesActive}
          value={summary.servicesActive}
          total={summary.totalTenants}
          tone="green"
        />
        <StatCard
          label={M.frontendReady}
          value={summary.frontendReady}
          total={summary.totalTenants}
          tone="blue"
        />
        <StatCard
          label={M.backendDbHealthy}
          value={summary.backendDbHealthy}
          total={summary.totalTenants}
          tone="green"
        />
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
                          {formatOptionalDateTime(run.finishedAt ?? run.startedAt)}
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
