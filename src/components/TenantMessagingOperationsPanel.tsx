import { Card, CardBody, CardHeader } from "@/components/Card";
import {
  MESSAGE_STATES,
  type MessageState,
  type MessagingOperationsResult,
  type MessagingOperationsSnapshot,
} from "@/lib/messaging/operations";

const STATE_LABELS: Record<MessageState, string> = {
  queued: "في الانتظار",
  processing: "قيد المعالجة",
  sent: "أُرسلت",
  delivered: "تم التسليم",
  read: "قُرئت",
  failed: "فشلت",
};

const STATE_STYLES: Record<MessageState, string> = {
  queued: "bg-slate-100 text-slate-700",
  processing: "bg-amber-50 text-amber-700",
  sent: "bg-blue-50 text-blue-700",
  delivered: "bg-emerald-50 text-emerald-700",
  read: "bg-teal-50 text-teal-700",
  failed: "bg-red-50 text-red-700",
};

function formatTimestamp(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

function eventLabel(eventKey: string): string {
  switch (eventKey) {
    case "ACCOUNT_CREATED":
      return "معلومات الحساب";
    case "LOGIN_OTP":
      return "رمز الدخول";
    default:
      return eventKey;
  }
}

function errorText(error: MessagingOperationsResult["error"]): string {
  switch (error) {
    case "unconfigured":
      return "قناة القراءة التشغيلية لـ Raqeem Messaging غير مهيأة بعد في Control Center.";
    case "invalid_tenant":
      return "رمز المؤسسة غير صالح لقراءة سجل المراسلات.";
    case "invalid_response":
      return "أعاد Raqeem Messaging استجابة تشغيلية غير متوقعة.";
    default:
      return "تعذّر الوصول إلى بيانات Raqeem Messaging التشغيلية حاليًا.";
  }
}

function StateBadge({ state }: { state: MessageState }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-semibold ${STATE_STYLES[state]}`}
    >
      {STATE_LABELS[state]}
    </span>
  );
}

function TimingLines({
  message,
}: {
  message: MessagingOperationsSnapshot["messages"][number];
}) {
  const rows = [
    ["إنشاء", message.createdAt],
    ["إرسال", message.sentAt],
    ["تسليم", message.deliveredAt],
    ["قراءة", message.readAt],
    ["فشل", message.failedAt],
  ] as const;

  return (
    <div className="min-w-[170px] space-y-1 text-[11px] leading-4 text-slate-600">
      {rows.map(([label, value]) =>
        value ? (
          <div key={label} className="flex items-center justify-between gap-3">
            <span className="text-slate-400">{label}</span>
            <span
              dir="ltr"
              className="inline-block min-w-[142px] whitespace-nowrap text-left font-mono text-[10px] tabular-nums text-slate-700 [unicode-bidi:isolate]"
            >
              {formatTimestamp(value)}
            </span>
          </div>
        ) : null,
      )}
    </div>
  );
}

export function TenantMessagingOperationsPanel({
  result,
}: {
  result: MessagingOperationsResult;
}) {
  const snapshot = result.data;

  return (
    <Card>
      <CardHeader
        title="مراقبة WhatsApp"
        action={
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
            قراءة فقط
          </span>
        }
      />
      <CardBody>
        {!snapshot ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600">
            {errorText(result.error)}
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    دورة الرسائل
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    إجمالي الرسائل المسجلة: {snapshot.total}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <span>آخر قراءة:</span>
                  <span
                    dir="ltr"
                    className="inline-block whitespace-nowrap font-mono tabular-nums text-slate-500 [unicode-bidi:isolate]"
                  >
                    {formatTimestamp(snapshot.generatedAt)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
                {MESSAGE_STATES.map((state) => (
                  <div
                    key={state}
                    className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5"
                  >
                    <div className="text-[11px] font-medium text-slate-500">
                      {STATE_LABELS[state]}
                    </div>
                    <div className="mt-1 text-xl font-bold tabular-nums text-slate-900">
                      {snapshot.counts[state]}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900">آخر الرسائل</h3>
                <span className="text-[11px] text-slate-400">
                  {snapshot.messages.length} معروضة
                </span>
              </div>

              {snapshot.messages.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                  لا توجد رسائل مسجلة لهذه المؤسسة بعد.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-right text-xs">
                    <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500">
                      <tr>
                        <th className="px-3 py-2.5">الرسالة</th>
                        <th className="px-3 py-2.5">المستلم</th>
                        <th className="px-3 py-2.5">الحالة</th>
                        <th className="px-3 py-2.5">المحاولات</th>
                        <th className="px-3 py-2.5">التوقيتات</th>
                        <th className="px-3 py-2.5">الخطأ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {snapshot.messages.map((message) => (
                        <tr key={message.internalMessageId} className="align-top">
                          <td className="px-3 py-3">
                            <div className="font-medium text-slate-800">
                              {eventLabel(message.eventKey)}
                            </div>
                            <div
                              className="mt-1 max-w-[170px] truncate font-mono text-[10px] text-slate-400"
                              dir="ltr"
                              title={message.internalMessageId}
                            >
                              {message.internalMessageId}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 font-mono text-[11px] text-slate-700" dir="ltr">
                            {message.recipientMasked}
                          </td>
                          <td className="px-3 py-3">
                            <StateBadge state={message.state} />
                          </td>
                          <td className="px-3 py-3 text-center font-semibold tabular-nums text-slate-700">
                            {message.attempts}
                          </td>
                          <td className="px-3 py-3">
                            <TimingLines message={message} />
                          </td>
                          <td className="px-3 py-3">
                            {message.errorCode ? (
                              <span className="font-mono text-[11px] text-red-600" dir="ltr">
                                {message.errorCode}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
