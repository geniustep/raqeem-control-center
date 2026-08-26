import { Pill, type Tone } from "@/components/Pill";
import type { ReleaseReadinessStatus } from "@/lib/release-snapshot/types";

const LABELS: Record<ReleaseReadinessStatus, string> = {
  CURRENT_COMPATIBLE: "محدّثة ومتوافقة",
  BEHIND_BUT_COMPATIBLE: "متأخرة لكن متوافقة",
  INCOMPATIBLE: "غير متوافقة",
  PARTIAL_RELEASE: "إصدار جزئي",
  AHEAD_UNVERIFIED: "أمام الهدف — غير متحقق",
  VERIFY_REQUIRED: "تحتاج تحققًا",
};

const TONES: Record<ReleaseReadinessStatus, Tone> = {
  CURRENT_COMPATIBLE: "green",
  BEHIND_BUT_COMPATIBLE: "amber",
  INCOMPATIBLE: "red",
  PARTIAL_RELEASE: "amber",
  AHEAD_UNVERIFIED: "blue",
  VERIFY_REQUIRED: "gray",
};

export function ReleaseReadinessBadge({
  status,
}: {
  status: ReleaseReadinessStatus;
}) {
  return <Pill tone={TONES[status]}>{LABELS[status]}</Pill>;
}
