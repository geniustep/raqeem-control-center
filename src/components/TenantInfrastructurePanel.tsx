import Link from "next/link";
import type { InfrastructureServer, Tenant } from "@/types";
import { Card, CardBody, CardHeader, KeyValue } from "@/components/Card";
import { CopyableCode } from "@/components/CopyableCode";
import { InfrastructureSyncBadge } from "@/components/InfrastructureSyncBadge";
import { Pill } from "@/components/Pill";
import { WarningCallout } from "@/components/WarningCallout";
import { t } from "@/lib/i18n";
import {
  deriveTenantInfrastructureSummary,
  displayInfraSyncError,
  displayInfrastructureProviderLabel,
  displayMetric,
  isLocalOrUnlinkedProvider,
  shouldShowInfraSyncWarning,
} from "@/lib/tenant-infrastructure";

function isDisplayableIp(value: string | undefined): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed === "—") return false;
  if (/configured outside control center/i.test(trimmed)) return false;
  return true;
}

function displayProviderStatus(status: string): string {
  const trimmed = status.trim();
  if (trimmed.length === 0 || trimmed === "—") return "—";
  return trimmed;
}

function isHealthyProviderStatus(status: string): boolean {
  return status.trim().toLowerCase() === "active";
}

function ServerMetrics({ server }: { server: InfrastructureServer }) {
  const L = t.tenantDetail.infrastructureSummary;
  const metrics: { label: string; value: string }[] = [];

  if (server.sizeSlug && server.sizeSlug !== "—") {
    metrics.push({ label: L.sizeSlug, value: server.sizeSlug });
  }
  const vcpus = displayMetric(server.vcpus);
  if (vcpus) metrics.push({ label: L.vcpus, value: vcpus });
  const memory = displayMetric(server.memoryMb, " MB");
  if (memory) metrics.push({ label: L.memoryMb, value: memory });
  const disk = displayMetric(server.diskGb, " GB");
  if (disk) metrics.push({ label: L.diskGb, value: disk });

  if (metrics.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
      {metrics.map((metric) => (
        <span key={metric.label}>
          <span className="text-slate-400">{metric.label}: </span>
          <span className="font-mono text-slate-600" dir="ltr">
            {metric.value}
          </span>
        </span>
      ))}
    </div>
  );
}

function RegistryServerBlock({
  server,
  roleLabel,
}: {
  server: InfrastructureServer;
  roleLabel: string;
}) {
  const L = t.tenantDetail.infrastructureSummary;
  const providerLabel = displayInfrastructureProviderLabel(server.provider);
  const providerStatus = displayProviderStatus(server.providerStatus);
  const syncWarning = shouldShowInfraSyncWarning(server.infraSyncStatus);
  const syncError = displayInfraSyncError(server.infraLastError);

  return (
    <section className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-700">{roleLabel}</span>
        <InfrastructureSyncBadge status={server.infraSyncStatus} />
        {isHealthyProviderStatus(providerStatus) ? (
          <Pill tone="green">{providerStatus}</Pill>
        ) : providerStatus !== "—" ? (
          <span className="text-xs text-slate-600">{providerStatus}</span>
        ) : null}
      </div>

      <dl>
        <KeyValue label={L.code} mono>
          <span dir="ltr">{server.code}</span>
        </KeyValue>
        {server.name && server.name !== server.code ? (
          <KeyValue label={L.name}>{server.name}</KeyValue>
        ) : null}
        <KeyValue label={L.provider}>{providerLabel}</KeyValue>
        {server.region && server.region !== "—" ? (
          <KeyValue label={L.region} mono>
            <span dir="ltr">{server.region}</span>
          </KeyValue>
        ) : null}
        {isDisplayableIp(server.publicIp) ? (
          <KeyValue label={L.publicIp}>
            <CopyableCode value={server.publicIp} />
          </KeyValue>
        ) : null}
        {isDisplayableIp(server.privateIp) ? (
          <KeyValue label={L.privateIp}>
            <CopyableCode value={server.privateIp} />
          </KeyValue>
        ) : null}
      </dl>

      <ServerMetrics server={server} />

      {isLocalOrUnlinkedProvider(server.provider) ? (
        <p className="mt-2 text-xs text-slate-500">{L.localNote}</p>
      ) : null}

      {syncWarning ? (
        <div className="mt-3">
          <WarningCallout title={L.syncErrorTitle} variant="danger">
            {syncError ?? L.syncErrorGeneric}
          </WarningCallout>
        </div>
      ) : null}
    </section>
  );
}

function FallbackServerBlock({
  code,
  roleLabel,
  publicIp,
  privateIp,
}: {
  code: string;
  roleLabel: string;
  publicIp?: string;
  privateIp?: string;
}) {
  const L = t.tenantDetail.infrastructureSummary;

  return (
    <section className="rounded-lg border border-dashed border-slate-200 p-3">
      <div className="mb-2 text-xs font-semibold text-slate-700">{roleLabel}</div>
      <dl>
        <KeyValue label={L.code} mono>
          <span dir="ltr">{code}</span>
        </KeyValue>
        {isDisplayableIp(publicIp) ? (
          <KeyValue label={L.publicIp}>
            <CopyableCode value={publicIp!} />
          </KeyValue>
        ) : null}
        {isDisplayableIp(privateIp) ? (
          <KeyValue label={L.privateIp}>
            <CopyableCode value={privateIp!} />
          </KeyValue>
        ) : null}
      </dl>
      <p className="mt-2 text-xs text-slate-500">{L.registryMiss}</p>
    </section>
  );
}

/** Read-only infrastructure summary linked to the tenant's app/data servers. */
export function TenantInfrastructurePanel({
  tenant,
  servers,
}: {
  tenant: Tenant;
  servers: InfrastructureServer[];
}) {
  const L = t.tenantDetail.infrastructureSummary;
  const summary = deriveTenantInfrastructureSummary(tenant, servers);
  const infraLink =
    "text-xs font-medium text-brand-700 hover:text-brand-800 hover:underline";

  const hasRegistry =
    summary.appServer !== null ||
    summary.dataServer !== null ||
    summary.fallbackAppCode !== null ||
    summary.fallbackDataCode !== null;

  return (
    <Card>
      <CardHeader
        title={t.tenantDetail.sections.infrastructure}
        action={
          <Link href="/infrastructure" className={infraLink}>
            {L.viewRegistryLink}
          </Link>
        }
      />
      <CardBody>
        {!hasRegistry ? (
          <p className="text-sm text-slate-500">{L.empty}</p>
        ) : summary.sameServer && summary.appServer ? (
          <RegistryServerBlock server={summary.appServer} roleLabel={L.roleCombined} />
        ) : (
          <div className="space-y-4">
            {(() => {
              const sameFallback =
                !summary.appServer &&
                !summary.dataServer &&
                summary.fallbackAppCode &&
                summary.fallbackDataCode &&
                summary.fallbackAppCode === summary.fallbackDataCode;

              if (sameFallback) {
                return (
                  <FallbackServerBlock
                    code={summary.fallbackAppCode!}
                    roleLabel={L.roleCombined}
                    publicIp={tenant.infrastructure.appServerPublicIp}
                    privateIp={
                      tenant.infrastructure.dataServerPrivateIp ||
                      tenant.infrastructure.appServerPrivateIp
                    }
                  />
                );
              }

              return (
                <>
                  {summary.appServer ? (
                    <RegistryServerBlock
                      server={summary.appServer}
                      roleLabel={L.roleApp}
                    />
                  ) : summary.fallbackAppCode ? (
                    <FallbackServerBlock
                      code={summary.fallbackAppCode}
                      roleLabel={L.roleApp}
                      publicIp={tenant.infrastructure.appServerPublicIp}
                      privateIp={tenant.infrastructure.appServerPrivateIp}
                    />
                  ) : null}

                  {summary.dataServer ? (
                    <RegistryServerBlock
                      server={summary.dataServer}
                      roleLabel={L.roleData}
                    />
                  ) : summary.fallbackDataCode &&
                    summary.fallbackDataCode !== summary.fallbackAppCode ? (
                    <FallbackServerBlock
                      code={summary.fallbackDataCode}
                      roleLabel={L.roleData}
                      privateIp={tenant.infrastructure.dataServerPrivateIp}
                    />
                  ) : null}
                </>
              );
            })()}
          </div>
        )}

        <p className="mt-3 text-xs text-slate-400">{L.noSecrets}</p>
      </CardBody>
    </Card>
  );
}
