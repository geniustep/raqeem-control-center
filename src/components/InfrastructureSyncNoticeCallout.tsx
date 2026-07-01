import { formatOptionalDateTime } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { InfrastructureSyncNotice } from "@/lib/infrastructure-sync-notice";
import { WarningCallout } from "@/components/WarningCallout";

export function InfrastructureSyncNoticeCallout({
  notice,
}: {
  notice: InfrastructureSyncNotice;
}) {
  const L = t.infrastructure.syncNotice;

  return (
    <WarningCallout variant={notice.variant} title={notice.title}>
      <p>{notice.message}</p>
      {notice.lastSyncAt ? (
        <p className="mt-1 text-xs opacity-90">
          {L.lastSyncAt}: {formatOptionalDateTime(notice.lastSyncAt)}
        </p>
      ) : null}
      {notice.errorCount && notice.errorCount > 1 ? (
        <p className="mt-1 text-xs opacity-90">
          {L.errorCount.replace("{count}", String(notice.errorCount))}
        </p>
      ) : null}
    </WarningCallout>
  );
}
