import type { DryRunReport } from "@/lib/operations-dry-run";

/** Client-safe subset sent to POST /api/audit/simulated-dry-run (no secrets, no server fields). */
export interface SimulatedDryRunClientPayload {
  tenant_code: string;
  operation_code: string;
  source: "ops_ui";
  dry_run_report: {
    would_proceed: boolean;
    summary: string;
    operation_status: string;
    simulated: true;
  };
  preflight_checks: DryRunReport["preflightChecks"];
  theoretical_steps: string[];
  client_request_id: string;
}

export function buildSimulatedDryRunClientPayload(
  report: DryRunReport,
  clientRequestId: string,
): SimulatedDryRunClientPayload {
  return {
    tenant_code: report.tenantCode,
    operation_code: report.operationType,
    source: "ops_ui",
    dry_run_report: {
      would_proceed: report.wouldProceed,
      summary: report.summary,
      operation_status: report.operationStatus,
      simulated: true,
    },
    preflight_checks: report.preflightChecks,
    theoretical_steps: report.theoreticalSteps,
    client_request_id: clientRequestId,
  };
}
