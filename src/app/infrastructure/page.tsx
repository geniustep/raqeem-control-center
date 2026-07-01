import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { BoolBadge } from "@/components/HealthBadge";
import { InfrastructureSyncNoticeCallout } from "@/components/InfrastructureSyncNoticeCallout";
import { InfrastructureSyncBadge } from "@/components/InfrastructureSyncBadge";
import { DataSourceBanner } from "@/components/DataSourceBanner";
import { DataSourceErrorState } from "@/components/DataSourceErrorState";
import { EmptyState } from "@/components/EmptyState";
import { loadInfrastructure } from "@/lib/data-source/platform-data-source";
import { deriveInfrastructureSyncNotice } from "@/lib/infrastructure-sync-notice";
import { formatOptionalDateTime } from "@/lib/format";
import { t } from "@/lib/i18n";

const TH =
  "px-3 py-2.5 text-right text-xs font-semibold text-slate-500 whitespace-nowrap";
const TD = "px-3 py-3 text-sm text-slate-700 whitespace-nowrap";

function displayProviderResourceId(id: string | null): string {
  if (!id || id.trim().length === 0) return t.infrastructure.notSyncedYet;
  return id;
}

function LinkedTenantCodes({ codes }: { codes: string[] }) {
  if (codes.length === 0) {
    return <span className="text-slate-400">{t.infrastructure.linkedNone}</span>;
  }
  return (
    <span className="inline-flex flex-wrap gap-1">
      {codes.map((code, index) => (
        <span key={code}>
          {index > 0 ? ", " : null}
          <Link
            href={`/tenants/${code}`}
            className="font-mono text-xs text-brand-700 hover:underline"
            dir="ltr"
          >
            {code}
          </Link>
        </span>
      ))}
    </span>
  );
}

function displayMetric(value: number | null, suffix = ""): string {
  if (value === null) return t.infrastructure.unavailable;
  return `${value}${suffix}`;
}

export default async function InfrastructurePage() {
  const result = await loadInfrastructure();
  const L = t.infrastructure;

  if (result.error) {
    return (
      <div>
        <PageHeader title={L.title} subtitle={L.subtitle} />
        <DataSourceErrorState error={result.error} />
      </div>
    );
  }

  const { data: servers, meta } = result;
  const syncNotice = deriveInfrastructureSyncNotice(servers);

  return (
    <div>
      <DataSourceBanner meta={meta} />
      <PageHeader title={L.title} subtitle={L.subtitle} />

      <div className="mb-4">
        <InfrastructureSyncNoticeCallout notice={syncNotice} />
      </div>

      {servers.length === 0 ? (
        <EmptyState title={L.empty} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[1400px] border-collapse text-right">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className={TH}>{L.columns.code}</th>
                <th className={TH}>{L.columns.name}</th>
                <th className={TH}>{L.columns.provider}</th>
                <th className={TH}>{L.columns.providerStatus}</th>
                <th className={TH}>{L.columns.providerResourceId}</th>
                <th className={TH}>{L.columns.infraSyncStatus}</th>
                <th className={TH}>{L.columns.publicIp}</th>
                <th className={TH}>{L.columns.privateIp}</th>
                <th className={TH}>{L.columns.region}</th>
                <th className={TH}>{L.columns.serverRole}</th>
                <th className={TH}>{L.columns.monitoringEnabled}</th>
                <th className={TH}>{L.columns.sizeSlug}</th>
                <th className={TH}>{L.columns.vcpus}</th>
                <th className={TH}>{L.columns.memoryMb}</th>
                <th className={TH}>{L.columns.diskGb}</th>
                <th className={TH}>{L.columns.lastInfraCheckAt}</th>
                <th className={TH}>{L.columns.linkedTenantsApp}</th>
                <th className={TH}>{L.columns.linkedTenantsData}</th>
                <th className={TH}>{L.columns.infraLastError}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {servers.map((server) => (
                <tr key={server.code} className="hover:bg-slate-50/60">
                  <td
                    className={`${TD} font-mono text-xs text-slate-800`}
                    dir="ltr"
                  >
                    {server.code}
                  </td>
                  <td className={TD}>{server.name}</td>
                  <td className={`${TD} font-mono text-xs`} dir="ltr">
                    {server.provider}
                  </td>
                  <td className={TD}>{server.providerStatus}</td>
                  <td
                    className={`${TD} max-w-[140px] truncate font-mono text-xs text-slate-500`}
                    dir="ltr"
                    title={displayProviderResourceId(server.providerResourceId)}
                  >
                    {displayProviderResourceId(server.providerResourceId)}
                  </td>
                  <td className={TD}>
                    <InfrastructureSyncBadge status={server.infraSyncStatus} />
                  </td>
                  <td className={`${TD} font-mono text-xs`} dir="ltr">
                    {server.publicIp}
                  </td>
                  <td className={`${TD} font-mono text-xs`} dir="ltr">
                    {server.privateIp}
                  </td>
                  <td className={`${TD} font-mono text-xs`} dir="ltr">
                    {server.region}
                  </td>
                  <td className={TD}>{server.serverRole}</td>
                  <td className={TD}>
                    <BoolBadge
                      value={server.monitoringEnabled}
                      okLabel={t.common.enabled}
                      badLabel={t.common.disabled}
                      badTone="gray"
                    />
                  </td>
                  <td className={`${TD} font-mono text-xs`} dir="ltr">
                    {server.sizeSlug}
                  </td>
                  <td className={TD}>{displayMetric(server.vcpus)}</td>
                  <td className={TD}>{displayMetric(server.memoryMb)}</td>
                  <td className={TD}>{displayMetric(server.diskGb)}</td>
                  <td className={TD}>
                    {formatOptionalDateTime(server.lastInfraCheckAt)}
                  </td>
                  <td className={TD}>
                    <LinkedTenantCodes codes={server.linkedTenants.app} />
                  </td>
                  <td className={TD}>
                    <LinkedTenantCodes codes={server.linkedTenants.data} />
                  </td>
                  <td
                    className={`${TD} max-w-[220px] truncate text-xs text-slate-500`}
                    title={server.infraLastError}
                  >
                    {server.infraLastError ?? t.infrastructure.linkedNone}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
