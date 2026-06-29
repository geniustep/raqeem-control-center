import type { Tenant } from "@/types";
import { Card, CardBody, CardHeader, KeyValue } from "@/components/Card";
import { HealthBadge } from "@/components/HealthBadge";
import { Pill } from "@/components/Pill";
import { CopyableCode } from "@/components/CopyableCode";
import { getAllDomains } from "@/lib/selectors";
import { t } from "@/lib/i18n";

/** Per-tenant domains (API + frontend) with DNS / SSL / proxy / origin. */
export function TenantDomainsPanel({ tenant }: { tenant: Tenant }) {
  const domains = getAllDomains([tenant]);
  const L = t.tenantDetail.domains;

  return (
    <Card>
      <CardHeader title={t.tenantDetail.sections.domains} />
      <CardBody className="space-y-4">
        {domains.map((d) => (
          <div
            key={d.domain}
            className="rounded-lg border border-slate-100 p-3"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <code className="font-mono text-sm text-slate-800" dir="ltr">
                {d.domain}
              </code>
              <Pill tone={d.type === "api" ? "blue" : "gray"} dot={false}>
                {d.type}
              </Pill>
            </div>
            <dl>
              <KeyValue label={L.dns}><HealthBadge status={d.dnsStatus} /></KeyValue>
              <KeyValue label={t.common.ssl}><HealthBadge status={d.sslStatus} /></KeyValue>
              <KeyValue label={t.common.proxy}><HealthBadge status={d.proxyStatus} /></KeyValue>
              <KeyValue label={L.origin}>
                <CopyableCode value={d.target} />
              </KeyValue>
              <KeyValue label={t.common.lastSmoke}><HealthBadge status={d.lastSmoke} /></KeyValue>
            </dl>
          </div>
        ))}

        <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500 ring-1 ring-inset ring-slate-100">
          <div className="font-medium text-slate-600">Cloudflare</div>
          <div className="mt-1">
            وضع SSL المتوقع: <span className="font-mono" dir="ltr">{tenant.cloudflare.sslModeExpected}</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
