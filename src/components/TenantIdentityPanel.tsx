import type { Tenant } from "@/types";
import { Card, CardBody, CardHeader, KeyValue } from "@/components/Card";
import { Pill } from "@/components/Pill";
import { t } from "@/lib/i18n";

/**
 * Identity panel. Branding is *read-only* here — we surface status and a link
 * into the school app; we never edit logo/colors from the control center.
 */
export function TenantIdentityPanel({ tenant }: { tenant: Tenant }) {
  const id = tenant.identity;
  const L = t.tenantDetail.identity;
  const brandingConfigured = id.brandingStatus === "configured";

  return (
    <Card>
      <CardHeader title={t.tenantDetail.sections.identity} />
      <CardBody>
        <dl>
          <KeyValue label={t.common.schoolName}>{id.schoolName}</KeyValue>
          <KeyValue label={t.common.code} mono>{id.tenantCode}</KeyValue>
          <KeyValue label={L.academicYear} mono>{id.academicYear}</KeyValue>
          <KeyValue label={L.language} mono>{id.language}</KeyValue>
          <KeyValue label={L.timezone} mono>{id.timezone}</KeyValue>
          <KeyValue label={L.currency} mono>{id.currency}</KeyValue>
          <KeyValue label={L.branding}>
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={brandingConfigured ? "green" : "amber"}>
                {brandingConfigured ? "Configured" : "Missing"}
              </Pill>
              <a
                href={id.brandingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-brand-700 underline-offset-2 hover:underline"
              >
                {t.tenantDetail.openBranding} ↗
              </a>
            </div>
          </KeyValue>
        </dl>
        <p className="mt-3 text-xs text-slate-400">{L.brandingNote}</p>
      </CardBody>
    </Card>
  );
}
