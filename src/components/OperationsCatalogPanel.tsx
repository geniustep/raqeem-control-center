"use client";

import { useMemo, useState } from "react";
import type { OperationType, Tenant, TenantOperation } from "@/types";
import { Card, CardBody } from "@/components/Card";
import { RiskBadge } from "@/components/HealthBadge";
import { OperationBadge } from "@/components/StatusBadge";
import { OperationDialog } from "@/components/OperationDialog";
import { Pill } from "@/components/Pill";
import { WarningCallout } from "@/components/WarningCallout";
import { canRunOperation } from "@/lib/tenant-status";
import { t } from "@/lib/i18n";

/** Interactive operations catalog with tenant-scoped dry-run dialog. No real execution. */
export function OperationsCatalogPanel({
  catalog,
  tenants,
}: {
  catalog: TenantOperation[];
  tenants: Tenant[];
}) {
  const [selectedTenantCode, setSelectedTenantCode] = useState(
    () => tenants[0]?.code ?? "",
  );
  const [openType, setOpenType] = useState<OperationType | null>(null);

  const selectedTenant = useMemo(
    () => tenants.find((tn) => tn.code === selectedTenantCode) ?? null,
    [tenants, selectedTenantCode],
  );

  const openOperation = openType
    ? catalog.find((op) => op.type === openType) ?? null
    : null;
  const openStatus =
    selectedTenant && openType
      ? canRunOperation(selectedTenant, openType)
      : "disabled";
  const externalUrl =
    selectedTenant && openType === "open_branding_settings"
      ? selectedTenant.identity.brandingUrl
      : undefined;

  const O = t.operations.interactive;

  return (
    <section className="mb-8">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-sm font-semibold text-slate-900">{t.operations.catalog}</h2>
        {tenants.length > 0 ? (
          <label className="flex flex-col gap-1 text-right">
            <span className="text-xs font-medium text-slate-500">{O.targetTenant}</span>
            <select
              value={selectedTenantCode}
              onChange={(e) => setSelectedTenantCode(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              {tenants.map((tn) => (
                <option key={tn.code} value={tn.code}>
                  {tn.name} ({tn.code})
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className="mb-4">
        <WarningCallout variant="warning" title={O.simulationOnly}>
          <p>{O.noRealExecution}</p>
          <p className="mt-1">{O.previewPhaseOnly}</p>
        </WarningCallout>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {catalog.map((op) => {
          const status = selectedTenant
            ? canRunOperation(selectedTenant, op.type)
            : "disabled";
          return (
            <Card key={op.type} className="flex flex-col">
              <CardBody className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">{op.title}</h3>
                  <RiskBadge risk={op.riskLevel} />
                </div>
                <p className="mt-1.5 flex-1 text-xs leading-relaxed text-slate-500">
                  {op.description}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {selectedTenant ? (
                    <OperationBadge status={status} />
                  ) : null}
                  {op.isDryRunOnly ? (
                    <Pill tone="gray" dot={false}>{t.common.dryRun}</Pill>
                  ) : null}
                  {op.isExternalLink ? (
                    <Pill tone="blue" dot={false}>{O.externalLink}</Pill>
                  ) : null}
                  <span className="font-mono text-[11px] text-slate-400" dir="ltr">
                    {op.type}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenType(op.type)}
                  disabled={!selectedTenant}
                  className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-brand-300 hover:bg-brand-50/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {O.viewDetails}
                </button>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {openOperation && selectedTenant ? (
        <OperationDialog
          operation={openOperation}
          status={openStatus}
          tenant={selectedTenant}
          externalUrl={externalUrl}
          onClose={() => setOpenType(null)}
        />
      ) : null}
    </section>
  );
}
