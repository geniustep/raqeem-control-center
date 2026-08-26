import { Card, CardBody, CardHeader, KeyValue } from "@/components/Card";
import { Pill } from "@/components/Pill";
import { ReleaseReadinessBadge } from "@/components/ReleaseReadinessBadge";
import { formatOptionalDateTime } from "@/lib/format";
import { emptyReleaseReadiness } from "@/lib/release-snapshot/contract";
import type { ReleaseReadiness, TargetRelease } from "@/lib/release-snapshot/types";

const COMPONENT_LABELS: Record<string, string> = {
  odoo: "Odoo",
  nextjs: "Next.js",
  flutter_ios: "Flutter iOS",
  flutter_android: "Flutter Android",
  messaging: "Messaging",
};

function value(value: string | null | undefined) {
  return value || "—";
}

export function TenantReleaseReadinessPanel({
  targetRelease,
  readiness: rawReadiness,
}: {
  targetRelease?: TargetRelease | null;
  readiness?: ReleaseReadiness;
}) {
  const readiness = rawReadiness ?? emptyReleaseReadiness();
  const noTarget = readiness.reasons.includes("no_target_release") || !targetRelease;

  return (
    <Card>
      <CardHeader
        title="جاهزية وتوافق الإصدار"
        action={<ReleaseReadinessBadge status={readiness.status} />}
      />
      <CardBody>
        {noTarget ? (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            لم يُعيّن الإصدار المستهدف لهذه المدرسة بعد؛ لذلك لا يمكن الحكم على حداثة الحزمة.
          </div>
        ) : null}

        <dl>
          <KeyValue label="الإصدار المستهدف" mono>
            {targetRelease?.code ?? "غير معيّن"}
          </KeyValue>
          <KeyValue label="التوافق">
            {readiness.compatibilityStatus === "COMPATIBLE"
              ? "متوافق"
              : readiness.compatibilityStatus === "INCOMPATIBLE"
                ? "غير متوافق"
                : "يحتاج تحققًا"}
          </KeyValue>
          <KeyValue label="حداثة الحزمة">
            {readiness.currencyStatus === "CURRENT"
              ? "الحزمة الحالية"
              : readiness.currencyStatus === "BEHIND"
                ? "خلف الإصدار المستهدف"
                : readiness.currencyStatus === "PARTIAL"
                  ? "إصدار جزئي"
                  : readiness.currencyStatus === "AHEAD_UNVERIFIED"
                    ? "أمام الهدف — غير متحقق"
                    : "تحتاج تحققًا"}
          </KeyValue>
          <KeyValue label="حالة التحقق">
            {readiness.verificationState === "CONFIRMED"
              ? "مؤكدة"
              : readiness.verificationState === "LAST_CONFIRMED"
                ? "آخر حالة مؤكدة"
                : "تحتاج تحققًا"}
          </KeyValue>
          <KeyValue label="آخر تحقق للحزمة" mono>
            {formatOptionalDateTime(readiness.stackVerifiedAt ?? undefined)}
          </KeyValue>
          <KeyValue label="ترقية متاحة">
            {readiness.upgradeAvailable ? (
              <Pill tone="blue" dot={false}>نعم — معلومات فقط</Pill>
            ) : (
              "لا"
            )}
          </KeyValue>
        </dl>

        {readiness.components.length > 0 ? (
          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[760px] text-right text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-semibold">المكوّن</th>
                  <th className="px-3 py-2 font-semibold">المثبت</th>
                  <th className="px-3 py-2 font-semibold">المستهدف</th>
                  <th className="px-3 py-2 font-semibold">عقد API المرصود</th>
                  <th className="px-3 py-2 font-semibold">الثقة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {readiness.components.map((component) => (
                  <tr key={component.componentType}>
                    <td className="px-3 py-2 font-medium text-slate-800">
                      {COMPONENT_LABELS[component.componentType] ?? component.componentType}
                    </td>
                    <td className="px-3 py-2 font-mono text-slate-600" dir="ltr">
                      {value(component.installedVersion)}
                    </td>
                    <td className="px-3 py-2 font-mono text-slate-600" dir="ltr">
                      {value(component.targetVersion)}
                    </td>
                    <td className="px-3 py-2 font-mono text-slate-600" dir="ltr">
                      {value(component.apiContract)}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {component.trustState === "confirmed"
                        ? "مؤكد"
                        : component.trustState === "last_confirmed"
                          ? "آخر حالة مؤكدة"
                          : "يحتاج تحققًا"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
