import { Card, CardBody, CardHeader, KeyValue } from "@/components/Card";
import { Pill, type Tone } from "@/components/Pill";
import { SchoolSnapshotRefreshButton } from "@/components/SchoolSnapshotRefreshButton";
import { formatOptionalDateTime } from "@/lib/format";
import { neverObservedSnapshot } from "@/lib/release-snapshot/contract";
import type {
  SchoolSnapshot,
  SchoolSnapshotObservationStatus,
} from "@/lib/release-snapshot/types";

const STATUS: Record<
  SchoolSnapshotObservationStatus,
  { label: string; tone: Tone }
> = {
  FRESH: { label: "حديثة", tone: "green" },
  STALE: { label: "قديمة", tone: "amber" },
  FAILED: { label: "فشل آخر تحديث", tone: "red" },
  NEVER_OBSERVED: { label: "لم تُرصد بعد", tone: "gray" },
};

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-bold text-slate-800">{value}</div>
    </div>
  );
}

export function TenantSchoolSnapshotPanel({
  snapshot: rawSnapshot,
  tenantCode,
  allowRefresh,
}: {
  snapshot?: SchoolSnapshot;
  tenantCode: string;
  allowRefresh: boolean;
}) {
  const snapshot = rawSnapshot ?? neverObservedSnapshot();
  const status = STATUS[snapshot.observationStatus];
  const hasFacts = Boolean(
    snapshot.students || snapshot.classes || snapshot.teachers || snapshot.accounts,
  );

  return (
    <Card>
      <CardHeader
        title="لقطة المدرسة التشغيلية"
        action={
          <div className="flex flex-wrap items-start gap-3">
            <Pill tone={status.tone}>{status.label}</Pill>
            <SchoolSnapshotRefreshButton
              tenantCode={tenantCode}
              enabled={allowRefresh}
            />
          </div>
        }
      />
      <CardBody>
        {snapshot.observationStatus === "NEVER_OBSERVED" ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
            لم تصل لقطة موثوقة لهذه المدرسة بعد. لا تُعرض أرقام صفرية بديلة عن بيانات غير مرصودة.
          </div>
        ) : null}
        {snapshot.observationStatus === "FAILED" ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            فشل آخر تحديث. إن كانت هناك أرقام أدناه فهي آخر لقطة ناجحة محفوظة وليست نتيجة المحاولة الفاشلة.
          </div>
        ) : null}
        {snapshot.observationStatus === "STALE" ? (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            البيانات أقدم من حدّ الجِدّة المعتمد في مركز التحكم؛ يلزم تحديثها قبل الاعتماد التشغيلي عليها.
          </div>
        ) : null}

        <dl className="mb-4">
          <KeyValue label="آخر نجاح" mono>
            {formatOptionalDateTime(snapshot.lastSuccessAt ?? undefined)}
          </KeyValue>
          <KeyValue label="آخر محاولة" mono>
            {formatOptionalDateTime(snapshot.lastRefreshAttemptAt ?? undefined)}
          </KeyValue>
          <KeyValue label="آخر فشل" mono>
            {formatOptionalDateTime(snapshot.lastFailureAt ?? undefined)}
          </KeyValue>
          {snapshot.lastErrorCategory ? (
            <KeyValue label="فئة آخر خطأ" mono>
              {snapshot.lastErrorCategory}
            </KeyValue>
          ) : null}
        </dl>

        {hasFacts ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {snapshot.students ? (
                <Metric label="التلاميذ النشطون" value={snapshot.students.activeTotal} />
              ) : null}
              {snapshot.classes ? (
                <Metric label="الأقسام النشطة" value={snapshot.classes.activeTotal} />
              ) : null}
              {snapshot.teachers ? (
                <Metric label="الأساتذة النشطون" value={snapshot.teachers.activeTotal} />
              ) : null}
              {snapshot.accounts ? (
                <Metric label="إجمالي الحسابات" value={snapshot.accounts.totalUsers} />
              ) : null}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-3">
                <h3 className="mb-2 text-xs font-semibold text-slate-700">
                  المدرسة والسنة الدراسية
                </h3>
                <dl>
                  <KeyValue label="المدرسة">{snapshot.school?.name ?? "—"}</KeyValue>
                  <KeyValue label="رمز المدرسة" mono>{snapshot.school?.code ?? "—"}</KeyValue>
                  <KeyValue label="Tenant" mono>{snapshot.school?.tenantCode ?? "—"}</KeyValue>
                  <KeyValue label="السنة الدراسية">
                    {snapshot.academic?.year.name ?? snapshot.academic?.year.code ?? "—"}
                  </KeyValue>
                </dl>
              </div>

              {snapshot.accounts ? (
                <div className="rounded-lg border border-slate-200 p-3">
                  <h3 className="mb-2 text-xs font-semibold text-slate-700">
                    مؤشرات الحسابات
                  </h3>
                  <div className="grid grid-cols-2 gap-x-4 text-xs">
                    <KeyValue label="حسابات الأولياء">{snapshot.accounts.parentAccounts}</KeyValue>
                    <KeyValue label="أولياء بلا حساب">{snapshot.accounts.parentNoAccount}</KeyValue>
                    <KeyValue label="أولياء لم يدخلوا بعد">{snapshot.accounts.parentNeverLoggedIn}</KeyValue>
                    <KeyValue label="حسابات التلاميذ">{snapshot.accounts.studentAccounts}</KeyValue>
                    <KeyValue label="حسابات الموظفين">{snapshot.accounts.staffAccounts}</KeyValue>
                    <KeyValue label="موظفون لم يدخلوا بعد">{snapshot.accounts.staffNeverLoggedIn}</KeyValue>
                  </div>
                </div>
              ) : null}
            </div>

            {snapshot.students?.byLevel.length ? (
              <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full min-w-[520px] text-right text-xs">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-semibold">المستوى</th>
                      <th className="px-3 py-2 font-semibold">الرمز</th>
                      <th className="px-3 py-2 font-semibold">عدد التلاميذ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {snapshot.students.byLevel.map((level) => (
                      <tr key={`${level.levelCode}-${level.sequence ?? "x"}`}>
                        <td className="px-3 py-2 text-slate-800">{level.levelName}</td>
                        <td className="px-3 py-2 font-mono text-slate-500" dir="ltr">
                          {level.levelCode}
                        </td>
                        <td className="px-3 py-2 font-semibold text-slate-800">
                          {level.studentCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {snapshot.platform ? (
              <div className="mt-4 rounded-lg border border-slate-200 p-3">
                <h3 className="mb-2 text-xs font-semibold text-slate-700">
                  بصمة المنصة المرصودة
                </h3>
                <dl className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
                  <KeyValue label="Odoo" mono>{snapshot.platform.odooVersion ?? "—"}</KeyValue>
                  <KeyValue label="smart_school_connect" mono>
                    {snapshot.platform.moduleVersionInstalled ?? "—"}
                  </KeyValue>
                  <KeyValue label="School API Contract" mono>
                    {snapshot.platform.schoolApiContract ?? "—"}
                  </KeyValue>
                  <KeyValue label="Snapshot Schema" mono>
                    {snapshot.platform.snapshotSchema ?? snapshot.schemaVersion ?? "—"}
                  </KeyValue>
                </dl>
              </div>
            ) : null}
          </>
        ) : null}
      </CardBody>
    </Card>
  );
}
