import type { CheckStatus, RiskLevel } from "@/types";
import { tCheck, tRisk } from "@/lib/i18n";
import { Pill, type Tone } from "@/components/Pill";

const CHECK_TONE: Record<CheckStatus, Tone> = {
  passed: "green",
  warning: "amber",
  failed: "red",
  pending: "gray",
  recorded: "green",
  unknown: "gray",
  not_configured: "gray",
};

const RISK_TONE: Record<RiskLevel, Tone> = {
  low: "green",
  medium: "amber",
  high: "red",
};

/** Badge for a health-check / smoke result. */
export function HealthBadge({
  status,
  label,
}: {
  status: CheckStatus;
  label?: string;
}) {
  return <Pill tone={CHECK_TONE[status]}>{label ?? tCheck(status)}</Pill>;
}

/** Badge for a boolean flag rendered as ok/not-ok. */
export function BoolBadge({
  value,
  okLabel = "نعم",
  badLabel = "لا",
  badTone = "red",
}: {
  value: boolean;
  okLabel?: string;
  badLabel?: string;
  badTone?: Tone;
}) {
  return (
    <Pill tone={value ? "green" : badTone}>{value ? okLabel : badLabel}</Pill>
  );
}

/** Badge for an operation risk level. */
export function RiskBadge({ risk }: { risk: RiskLevel }) {
  return (
    <Pill tone={RISK_TONE[risk]} dot={false}>
      {tRisk(risk)}
    </Pill>
  );
}
