import { Pill, type Tone } from "@/components/Pill";
import {
  labelIntent,
  labelState,
  labelType,
  toneForState,
  knowledgeUiCopy as t,
} from "@/lib/knowledge-read/i18n";

export function KnowledgeStatusBadge({ state }: { state: string }) {
  return <Pill tone={toneForState(state)}>{labelState(state)}</Pill>;
}

export function KnowledgeIntentBadge({ intent }: { intent: string }) {
  return (
    <Pill tone="blue" dot={false}>
      {labelIntent(intent)}
    </Pill>
  );
}

export function KnowledgeTypeBadge({ type }: { type: string }) {
  return (
    <Pill tone="gray" dot={false}>
      {labelType(type)}
    </Pill>
  );
}

export function KnowledgeLanguageBadge({ language }: { language: string }) {
  return (
    <Pill tone="gray" dot={false}>
      {language.toUpperCase()}
    </Pill>
  );
}

export function KnowledgeDomainBadge({
  name,
  code,
}: {
  name: string;
  code?: string;
}) {
  return (
    <Pill tone="blue" dot={false}>
      {name || code || "—"}
    </Pill>
  );
}

export function NeedsReviewBadge({ needsReview }: { needsReview: boolean }) {
  const tone: Tone = needsReview ? "amber" : "green";
  return (
    <Pill tone={tone}>
      {needsReview ? t.badges.needsReview : t.badges.no}
    </Pill>
  );
}
