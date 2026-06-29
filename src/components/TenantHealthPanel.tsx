import type { Tenant } from "@/types";
import { Card, CardBody, CardHeader } from "@/components/Card";
import { HealthBadge } from "@/components/HealthBadge";

/** Grid of named health/smoke checks for a tenant. */
export function TenantHealthPanel({ tenant }: { tenant: Tenant }) {
  return (
    <Card>
      <CardHeader title="فحوصات الصحة" />
      <CardBody>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {tenant.healthChecks.map((c) => (
            <li
              key={c.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 p-3"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-800">{c.label}</div>
                {c.detail ? (
                  <div className="mt-0.5 text-xs text-slate-500">{c.detail}</div>
                ) : null}
              </div>
              <HealthBadge status={c.status} />
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
