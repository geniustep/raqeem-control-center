import type { Tenant } from "@/types";
import { Card, CardBody, CardHeader, KeyValue } from "@/components/Card";
import { CopyableCode } from "@/components/CopyableCode";
import { t } from "@/lib/i18n";

/** Infrastructure overview. No secrets — IPs/hosts only, never credentials. */
export function TenantInfrastructurePanel({ tenant }: { tenant: Tenant }) {
  const i = tenant.infrastructure;
  const L = t.tenantDetail.infrastructure;

  return (
    <Card>
      <CardHeader title={t.tenantDetail.sections.infrastructure} />
      <CardBody>
        <dl>
          <KeyValue label={L.appServer} mono>{i.appServer}</KeyValue>
          <KeyValue label={L.appServerPrivateIp}>
            <CopyableCode value={i.appServerPrivateIp} />
          </KeyValue>
          <KeyValue label={L.appServerPublicIp}>
            <CopyableCode value={i.appServerPublicIp} />
          </KeyValue>
          <KeyValue label={L.dataServer} mono>{i.dataServer}</KeyValue>
          <KeyValue label={L.dataServerPrivateIp}>
            <CopyableCode value={i.dataServerPrivateIp} />
          </KeyValue>
          <KeyValue label={L.dbHost}>
            <CopyableCode value={i.dbHost} />
          </KeyValue>
          <KeyValue label={L.dbName} mono>{i.dbName}</KeyValue>
          <KeyValue label={L.dbUser} mono>{i.dbUser}</KeyValue>
          <KeyValue label={L.odooLocalPort} mono>{i.odooLocalPort}</KeyValue>
          <KeyValue label={L.serviceName} mono>{i.serviceName}</KeyValue>
        </dl>
        <p className="mt-3 text-xs text-slate-400">{L.noSecrets}</p>
      </CardBody>
    </Card>
  );
}
