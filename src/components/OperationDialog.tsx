"use client";

import { useEffect, useState } from "react";
import type { DryRunReport } from "@/lib/operations-dry-run";
import { buildDryRunReport } from "@/lib/operations-dry-run";
import type { OperationStatus, Tenant, TenantOperation } from "@/types";
import { OperationBadge } from "@/components/StatusBadge";
import { RiskBadge } from "@/components/HealthBadge";
import { WarningCallout } from "@/components/WarningCallout";
import { formatDateTime } from "@/lib/format";
import { t, tOperationStatus } from "@/lib/i18n";

function Section({
  title,
  items,
  tone = "slate",
}: {
  title: string;
  items: string[];
  tone?: "slate" | "red" | "emerald";
}) {
  if (items.length === 0) return null;
  const marker =
    tone === "red" ? "text-red-400" : tone === "emerald" ? "text-emerald-500" : "text-slate-400";
  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold text-slate-700">{title}</div>
      <ul className="space-y-1">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-2 text-sm text-slate-600">
            <span className={`mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current ${marker}`} />
            <span className="min-w-0">{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const PREFLIGHT_TONE: Record<
  DryRunReport["preflightChecks"][number]["status"],
  string
> = {
  pass: "text-emerald-600",
  fail: "text-red-600",
  warning: "text-amber-600",
  skipped: "text-slate-400",
};

function DryRunReportPanel({ report }: { report: DryRunReport }) {
  const D = t.operations.dialog;
  return (
    <div className="space-y-3 rounded-lg border border-brand-200 bg-brand-50/50 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold text-brand-900">{D.dryRunReport}</div>
        <span className="font-mono text-[10px] text-slate-400" dir="ltr">
          {formatDateTime(report.generatedAt)}
        </span>
      </div>
      <p className="text-sm text-slate-700">{report.summary}</p>
      <div>
        <div className="mb-1.5 text-xs font-semibold text-slate-700">{D.preflightResults}</div>
        <ul className="space-y-1">
          {report.preflightChecks.map((check) => (
            <li
              key={check.label}
              className={`flex items-start gap-2 text-sm ${PREFLIGHT_TONE[check.status]}`}
            >
              <span className="mt-0.5 shrink-0">•</span>
              <span className="min-w-0">{check.label}</span>
            </li>
          ))}
        </ul>
      </div>
      <Section title={D.theoreticalSteps} items={report.theoreticalSteps} tone="emerald" />
      <WarningCallout variant="info" title={t.operations.interactive.simulationOnly}>
        {D.reportFooter}
      </WarningCallout>
    </div>
  );
}

/** Modal describing an operation's pre-checks and expected steps (dry-run). */
export function OperationDialog({
  operation,
  status,
  tenant,
  externalUrl,
  onClose,
}: {
  operation: TenantOperation;
  status: OperationStatus;
  tenant?: Tenant;
  externalUrl?: string;
  onClose: () => void;
}) {
  const [report, setReport] = useState<DryRunReport | null>(null);
  const D = t.operations.dialog;
  const I = t.operations.interactive;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const canSimulate = status === "available" || status === "manual_required" || status === "completed";

  function handleSimulate() {
    if (tenant) {
      setReport(buildDryRunReport(tenant, operation.type));
    } else {
      setReport(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={operation.title}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">{operation.title}</h2>
              <OperationBadge status={status} />
            </div>
            <p className="mt-1 text-sm text-slate-500">{operation.description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label={D.close}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          <WarningCallout variant="warning" title={I.simulationOnly}>
            <p>{I.noRealExecution}</p>
            <p className="mt-1">{I.previewPhaseOnly}</p>
          </WarningCallout>

          {tenant ? (
            <div className="rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-inset ring-slate-100">
              <div className="text-xs font-medium text-slate-500">{I.targetTenant}</div>
              <div className="mt-0.5 text-sm font-semibold text-slate-800">{tenant.name}</div>
              <div className="font-mono text-xs text-slate-500" dir="ltr">{tenant.code}</div>
            </div>
          ) : null}

          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-inset ring-slate-100">
            <span className="text-xs font-medium text-slate-500">{D.risk}</span>
            <RiskBadge risk={operation.riskLevel} />
          </div>

          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-inset ring-slate-100">
            <span className="text-xs font-medium text-slate-500">{D.operationStatus}</span>
            <span className="text-sm font-medium text-slate-700">{tOperationStatus(status)}</span>
          </div>

          <Section title={D.preChecks} items={operation.preconditions} />

          <div>
            <div className="mb-1.5 text-xs font-semibold text-slate-700">{D.expected}</div>
            <p className="text-sm text-slate-600">{operation.expectedResult}</p>
          </div>

          <Section title={D.manualSteps} items={operation.manualSteps} tone="emerald" />
          <Section title={D.forbidden} items={operation.forbiddenActions} tone="red" />

          {operation.isDryRunOnly ? (
            <WarningCallout variant="info" title={t.common.dryRun}>
              {D.dryRunOnly}
            </WarningCallout>
          ) : null}

          {report ? <DryRunReportPanel report={report} /> : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            {D.close}
          </button>

          {operation.isExternalLink && externalUrl ? (
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              {D.openLink} ↗
            </a>
          ) : (
            <button
              type="button"
              disabled={!canSimulate || !!report}
              onClick={handleSimulate}
              className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              {report ? I.simulationDone : I.simulationOnly}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
