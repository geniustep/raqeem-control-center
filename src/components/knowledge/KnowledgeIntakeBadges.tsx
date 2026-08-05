const STATE_TONES: Record<string, string> = {
  received: "bg-slate-100 text-slate-700",
  validated: "bg-blue-50 text-blue-700",
  needs_review: "bg-amber-50 text-amber-800",
  draft_created: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
  cancelled: "bg-slate-100 text-slate-500",
  failed: "bg-red-50 text-red-700",
};

const RISK_TONES: Record<string, string> = {
  low: "bg-green-50 text-green-700",
  medium: "bg-amber-50 text-amber-800",
  high: "bg-orange-50 text-orange-800",
  prohibited: "bg-red-50 text-red-700",
};

const STATE_LABELS: Record<string, string> = {
  received: "مستلم",
  validated: "تم التحقق",
  needs_review: "تحتاج مراجعة",
  draft_created: "أُنشئت كمسودة",
  rejected: "مرفوض",
  cancelled: "ملغى",
  failed: "فشل تقني",
};

const RISK_LABELS: Record<string, string> = {
  low: "منخفض",
  medium: "متوسط",
  high: "مرتفع",
  prohibited: "محظور",
};

function Badge({ children, className }: { children: string; className: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

export function KnowledgeIntakeStateBadge({ state }: { state: string }) {
  return (
    <Badge className={STATE_TONES[state] ?? "bg-slate-100 text-slate-700"}>
      {(STATE_LABELS[state] ?? state) || "—"}
    </Badge>
  );
}

export function KnowledgeIntakeRiskBadge({ risk }: { risk: string }) {
  return (
    <Badge className={RISK_TONES[risk] ?? "bg-slate-100 text-slate-700"}>
      {(RISK_LABELS[risk] ?? risk) || "—"}
    </Badge>
  );
}

export function KnowledgeIntakeSourceBadge({ source }: { source: string }) {
  const labels: Record<string, string> = {
    human_ui: "واجهة بشرية",
    gpt: "GPT",
    import: "استيراد",
    api: "API",
    internal: "أداة داخلية",
  };
  return (
    <Badge className="bg-brand-50 text-brand-800">
      {(labels[source] ?? source) || "—"}
    </Badge>
  );
}
