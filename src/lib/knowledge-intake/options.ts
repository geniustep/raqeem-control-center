import type { KnowledgeIntakeOption } from "@/lib/knowledge-intake/types";

function option(value: string, label: string): KnowledgeIntakeOption {
  return { value, label };
}

export const INTAKE_OPTION_FALLBACKS = {
  sourceTypes: [
    option("human_ui", "واجهة بشرية"),
    option("gpt", "GPT"),
    option("import", "استيراد"),
    option("api", "واجهة برمجية داخلية"),
    option("internal", "أداة داخلية"),
  ],
  actorTypes: [
    option("human", "مستخدم بشري"),
    option("ai", "ذكاء اصطناعي"),
    option("importer", "أداة استيراد"),
    option("system", "النظام"),
  ],
  riskLevels: [
    option("low", "منخفض"),
    option("medium", "متوسط"),
    option("high", "مرتفع"),
    option("prohibited", "محظور"),
  ],
  states: [
    option("received", "مستلم"),
    option("validated", "تم التحقق"),
    option("draft_created", "أُنشئت مسودة"),
    option("needs_review", "تحتاج مراجعة"),
    option("rejected", "مرفوض"),
    option("cancelled", "ملغى"),
    option("failed", "فشل تقني"),
  ],
  proposedActions: [
    option("create", "إنشاء مادة"),
    option("update", "اقتراح تحديث"),
    option("no_change", "لا تغيير"),
    option("reject", "رفض"),
    option("needs_human_review", "تحتاج مراجعة بشرية"),
  ],
  policyDecisions: [
    option("not_evaluated", "لم تُقيّم"),
    option("allow_draft", "السماح بمسودة"),
    option("needs_human_review", "تحتاج مراجعة بشرية"),
    option("reject", "رفض"),
    option("auto_publish_not_supported", "النشر الآلي غير مدعوم"),
  ],
} satisfies Record<string, KnowledgeIntakeOption[]>;

type IntakeOptionSet = typeof INTAKE_OPTION_FALLBACKS;

function preferUpstream(
  upstream: KnowledgeIntakeOption[],
  fallback: KnowledgeIntakeOption[],
): KnowledgeIntakeOption[] {
  return upstream.length > 0 ? upstream : fallback;
}

export function withIntakeOptionFallbacks(input: IntakeOptionSet): IntakeOptionSet {
  return {
    sourceTypes: preferUpstream(input.sourceTypes, INTAKE_OPTION_FALLBACKS.sourceTypes),
    actorTypes: preferUpstream(input.actorTypes, INTAKE_OPTION_FALLBACKS.actorTypes),
    riskLevels: preferUpstream(input.riskLevels, INTAKE_OPTION_FALLBACKS.riskLevels),
    states: preferUpstream(input.states, INTAKE_OPTION_FALLBACKS.states),
    proposedActions: preferUpstream(
      input.proposedActions,
      INTAKE_OPTION_FALLBACKS.proposedActions,
    ),
    policyDecisions: preferUpstream(
      input.policyDecisions,
      INTAKE_OPTION_FALLBACKS.policyDecisions,
    ),
  };
}
