import type { Tenant } from "@/types";
import { Card, CardBody, CardHeader, KeyValue } from "@/components/Card";
import { HealthBadge, BoolBadge } from "@/components/HealthBadge";
import { CopyableCode } from "@/components/CopyableCode";
import { t } from "@/lib/i18n";

export function TenantOdooPanel({ tenant }: { tenant: Tenant }) {
  const o = tenant.odoo;
  const L = t.tenantDetail.odoo;

  return (
    <Card>
      <CardHeader title={t.tenantDetail.sections.odoo} />
      <CardBody>
        <dl>
          <KeyValue label={L.serviceName} mono>{o.serviceName}</KeyValue>
          <KeyValue label={L.activeEnabled}>
            <div className="flex items-center gap-2">
              <BoolBadge value={o.active} okLabel={t.common.active} badLabel={t.common.inactive} />
              <BoolBadge value={o.enabled} okLabel={t.common.enabled} badLabel={t.common.disabled} />
            </div>
          </KeyValue>
          <KeyValue label={L.localPort} mono>{o.localPort}</KeyValue>
          <KeyValue label={L.localOnly}>
            <BoolBadge value={o.localOnly} />
          </KeyValue>
          <KeyValue label={L.backendDomain}>
            <CopyableCode value={o.backendDomain} />
          </KeyValue>
          <KeyValue label={L.modulesState}>
            <HealthBadge status={o.modulesState} />
          </KeyValue>
        </dl>

        <div className="mt-3 rounded-lg bg-slate-50 p-3 ring-1 ring-inset ring-slate-100">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">{L.ssc}</span>
            <BoolBadge value={o.smartSchoolConnectInstalled} />
          </div>
          <dl>
            <KeyValue label={t.common.version} mono>{o.smartSchoolConnectVersion}</KeyValue>
            <KeyValue label={t.common.commit}>
              <CopyableCode value={o.smartSchoolConnectCommit} />
            </KeyValue>
          </dl>
        </div>
      </CardBody>
    </Card>
  );
}
