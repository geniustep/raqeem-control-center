import type { Tenant } from "@/types";
import { Card, CardBody, CardHeader, KeyValue } from "@/components/Card";
import { HealthBadge, BoolBadge } from "@/components/HealthBadge";
import { CopyableCode } from "@/components/CopyableCode";
import { t } from "@/lib/i18n";

export function TenantDatabasePanel({ tenant }: { tenant: Tenant }) {
  const db = tenant.database;
  const L = t.tenantDetail.database;

  return (
    <Card>
      <CardHeader title={t.tenantDetail.sections.database} />
      <CardBody>
        <dl>
          <KeyValue label={L.reachable}>
            <BoolBadge value={db.reachable} okLabel={t.common.reachable} badLabel={t.common.unreachable} />
          </KeyValue>
          <KeyValue label={t.tenantDetail.infrastructure.dbName} mono>{db.dbName}</KeyValue>
          <KeyValue label={t.tenantDetail.infrastructure.dbUser} mono>{db.dbUser}</KeyValue>
          <KeyValue label={t.common.host}>
            <CopyableCode value={`${db.host}:${db.port}`} />
          </KeyValue>
          <KeyValue label={L.pgHba}>
            <HealthBadge status={db.pgHbaStatus} />
          </KeyValue>
          <KeyValue label={L.tableCount} mono>{db.tableCount}</KeyValue>
          <KeyValue label={L.schoolTables} mono>{db.schoolTables}</KeyValue>
          <KeyValue label={L.modulesInstalled}>
            <BoolBadge value={db.modulesInstalled} />
          </KeyValue>
          <KeyValue label={L.lastSmoke}>
            <HealthBadge status={db.lastSmokeResult} />
          </KeyValue>
        </dl>

        <div className="mt-3">
          <div className="mb-1.5 text-xs font-medium text-slate-500">{L.rules}</div>
          <div className="space-y-1.5">
            {db.pgHbaRules.map((rule) => (
              <div key={rule}>
                <CopyableCode value={rule} />
              </div>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
