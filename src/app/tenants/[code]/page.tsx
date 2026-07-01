import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardBody, CardHeader } from "@/components/Card";
import { StatusBadge } from "@/components/StatusBadge";
import { WarningCallout } from "@/components/WarningCallout";
import { LifecycleTimeline } from "@/components/LifecycleTimeline";
import { TenantIdentityPanel } from "@/components/TenantIdentityPanel";
import { TenantInfrastructurePanel } from "@/components/TenantInfrastructurePanel";
import { TenantDatabasePanel } from "@/components/TenantDatabasePanel";
import { TenantOdooPanel } from "@/components/TenantOdooPanel";
import { TenantDomainsPanel } from "@/components/TenantDomainsPanel";
import { TenantHealthChecksPanel } from "@/components/TenantHealthChecksPanel";
import { TenantOperationsPanel } from "@/components/TenantOperationsPanel";
import { AuditTimeline } from "@/components/AuditTimeline";
import { DataSourceBanner } from "@/components/DataSourceBanner";
import { DataSourceErrorState } from "@/components/DataSourceErrorState";
import { loadTenant, loadInfrastructure, getStaticTenantCodes } from "@/lib/data-source/platform-data-source";
import { getAuditLog } from "@/lib/selectors";
import {
  deriveTenantOverallStatus,
  getLifecycleProgress,
  getTenantWarnings,
} from "@/lib/tenant-status";
import { t } from "@/lib/i18n";

/** Odoo loader uses noStore() — this segment must stay dynamic at runtime. */
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return getStaticTenantCodes().map((code) => ({ code }));
}

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const [{ data: tenant, meta, error }, infraResult] = await Promise.all([
    loadTenant(code),
    loadInfrastructure(),
  ]);
  const infrastructureServers = infraResult.data ?? [];

  if (error) {
    return (
      <div>
        <div className="mb-6 text-xs text-slate-500">
          <Link href="/tenants" className="hover:underline">
            {t.tenants.title}
          </Link>
          <span className="px-1">/</span>
          <span className="font-mono" dir="ltr">{code}</span>
        </div>
        <DataSourceErrorState error={error} />
      </div>
    );
  }

  if (!tenant) notFound();

  const status = deriveTenantOverallStatus(tenant);
  const warnings = getTenantWarnings(tenant);
  const progress = getLifecycleProgress(tenant);
  const audit = getAuditLog([tenant]);

  const linkBtn =
    "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-brand-300 hover:bg-brand-50";

  return (
    <div>
      <DataSourceBanner meta={meta} />

      <div className="mb-6 border-b border-slate-200 pb-5">
        <div className="mb-1 text-xs text-slate-500">
          <Link href="/tenants" className="hover:underline">
            {t.tenants.title}
          </Link>
          <span className="px-1">/</span>
          <span className="font-mono" dir="ltr">{tenant.code}</span>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900 md:text-2xl">{tenant.name}</h1>
              <StatusBadge status={status} />
            </div>
            <div className="mt-2 flex flex-col gap-1 text-sm text-slate-500 sm:flex-row sm:gap-4">
              <span className="font-mono" dir="ltr">↗ {tenant.frontendDomain}</span>
              <span className="font-mono" dir="ltr">⚙ {tenant.apiDomain}</span>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              التقدّم: {progress.done}/{progress.total} مرحلة ({progress.percent}%)
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <a className={linkBtn} href={`https://${tenant.frontendDomain}`} target="_blank" rel="noopener noreferrer">
              {t.tenantDetail.openFrontend} ↗
            </a>
            <a className={linkBtn} href={`https://${tenant.apiDomain}/web/login`} target="_blank" rel="noopener noreferrer">
              {t.tenantDetail.openApiLogin} ↗
            </a>
            <a className={linkBtn} href={tenant.identity.brandingUrl} target="_blank" rel="noopener noreferrer">
              {t.tenantDetail.openBranding} ↗
            </a>
          </div>
        </div>
      </div>

      {warnings.length > 0 ? (
        <div className="mb-6">
          <WarningCallout title={`${warnings.length} ${t.common.warnings}`}>
            <ul className="mt-1 space-y-1">
              {warnings.map((w) => (
                <li key={w} className="list-inside list-disc">{w}</li>
              ))}
            </ul>
          </WarningCallout>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader title={t.tenantDetail.sections.lifecycle} />
            <CardBody>
              <LifecycleTimeline tenant={tenant} />
            </CardBody>
          </Card>
          <TenantIdentityPanel tenant={tenant} />
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <TenantInfrastructurePanel tenant={tenant} servers={infrastructureServers} />
            <TenantDatabasePanel tenant={tenant} />
            <TenantOdooPanel tenant={tenant} />
            <TenantDomainsPanel tenant={tenant} />
          </div>
          <TenantHealthChecksPanel tenant={tenant} />
          <TenantOperationsPanel tenant={tenant} />
        </div>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader title={t.tenantDetail.sections.audit} />
          <CardBody>
            <AuditTimeline entries={audit} showTenant={false} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
