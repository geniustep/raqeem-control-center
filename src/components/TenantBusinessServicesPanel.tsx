import { Card, CardBody, CardHeader, KeyValue } from "@/components/Card";
import { WhatsAppEntitlementToggle } from "@/components/WhatsAppEntitlementToggle";
import type { PlatformEntitlement } from "@/lib/data-source/types";
import { WHATSAPP_SERVICE_KEY } from "@/lib/entitlements/whatsapp";

function statusLabel(entitlement: PlatformEntitlement): string {
  if (entitlement.reasonCode === "no_entitlement_record") return "غير مهيأة";
  if (!entitlement.enabled) return "متوقفة إداريًا";
  if (entitlement.effective) return "مفعّلة";
  return "غير متاحة حاليًا";
}

function subscriptionLabel(value: string | null): string {
  switch (value) {
    case "active":
      return "نشط";
    case "suspended":
      return "معلّق";
    case "expired":
      return "منتهي";
    case "cancelled":
      return "ملغى";
    default:
      return "—";
  }
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ar-MA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function TenantBusinessServicesPanel({
  tenantCode,
  entitlement,
  unavailable = false,
  allowMutation = false,
}: {
  tenantCode: string;
  entitlement: PlatformEntitlement | null;
  unavailable?: boolean;
  allowMutation?: boolean;
}) {
  return (
    <Card>
      <CardHeader title="الخدمات التجارية" />
      <CardBody>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-3">
              <h3 className="text-base font-semibold text-slate-900">WhatsApp</h3>
              <p className="mt-1 text-xs text-slate-500">
                خدمة المراسلة المركزية لهذه المؤسسة
              </p>
            </div>

            {unavailable || !entitlement ? (
              <p className="text-sm text-red-600">تعذّر قراءة حالة الخدمة من Raqeem Center.</p>
            ) : (
              <dl>
                <KeyValue label="الحالة">{statusLabel(entitlement)}</KeyValue>
                <KeyValue label="الاشتراك">
                  {subscriptionLabel(entitlement.subscriptionStatus)}
                </KeyValue>
                <KeyValue label="الخطة">{entitlement.planKey ?? "—"}</KeyValue>
                <KeyValue label="الحصة">
                  {entitlement.quotaUnlimited === true
                    ? "غير محدودة"
                    : entitlement.quota ?? "—"}
                </KeyValue>
                <KeyValue label="سارية من">{formatDate(entitlement.effectiveFrom)}</KeyValue>
                <KeyValue label="سارية إلى">{formatDate(entitlement.effectiveUntil)}</KeyValue>
              </dl>
            )}
          </div>

          {allowMutation &&
          !unavailable &&
          entitlement?.serviceKey === WHATSAPP_SERVICE_KEY &&
          entitlement.reasonCode !== "no_entitlement_record" ? (
            <WhatsAppEntitlementToggle
              tenantCode={tenantCode}
              enabled={entitlement.enabled}
            />
          ) : null}
        </div>
      </CardBody>
    </Card>
  );
}
