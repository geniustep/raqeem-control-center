"use client";

import { useState } from "react";
import type { OperationType, Tenant } from "@/types";
import { Card, CardBody, CardHeader } from "@/components/Card";
import { OperationBadge } from "@/components/StatusBadge";
import { RiskBadge } from "@/components/HealthBadge";
import { OperationDialog } from "@/components/OperationDialog";
import { WarningCallout } from "@/components/WarningCallout";
import { OPERATION_ORDER, getOperation } from "@/lib/operation-catalog";
import { canRunOperation } from "@/lib/tenant-status";
import { t } from "@/lib/i18n";

/** Grid of operation buttons; each opens a dry-run dialog. No real execution. */
export function TenantOperationsPanel({ tenant }: { tenant: Tenant }) {
  const [openType, setOpenType] = useState<OperationType | null>(null);

  const open = openType ? getOperation(openType) : null;
  const openStatus = openType ? canRunOperation(tenant, openType) : "disabled";
  const externalUrl =
    openType === "open_branding_settings" ? tenant.identity.brandingUrl : undefined;

  return (
    <Card>
      <CardHeader title={t.tenantDetail.sections.operations} />
      <CardBody className="space-y-3">
        <WarningCallout variant="info" title={t.common.dryRun}>
          {t.operations.phaseBanner}
        </WarningCallout>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {OPERATION_ORDER.map((type) => {
            const op = getOperation(type);
            const status = canRunOperation(tenant, type);
            const interactive = status !== "disabled";
            return (
              <button
                key={type}
                type="button"
                disabled={!interactive}
                onClick={() => setOpenType(type)}
                className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 p-3 text-right transition-colors hover:border-brand-300 hover:bg-brand-50/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-800">{op.title}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <OperationBadge status={status} />
                    <RiskBadge risk={op.riskLevel} />
                  </div>
                </div>
                <span className="mt-1 text-slate-300">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m14 6-6 6 6 6" />
                  </svg>
                </span>
              </button>
            );
          })}
        </div>
      </CardBody>

      {open ? (
        <OperationDialog
          operation={open}
          status={openStatus}
          externalUrl={externalUrl}
          onClose={() => setOpenType(null)}
        />
      ) : null}
    </Card>
  );
}
