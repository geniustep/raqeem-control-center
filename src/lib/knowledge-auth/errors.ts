import type { KnowledgeAuthErrorCode } from "@/lib/knowledge-auth/types";

const ARABIC_MESSAGES: Record<KnowledgeAuthErrorCode, string> = {
  authentication_required: "يلزم تسجيل الدخول للمتابعة.",
  invalid_credentials: "تعذّر التحقق من بيانات الدخول.",
  session_expired: "انتهت صلاحية الجلسة. سجّل الدخول مجددًا.",
  user_inactive: "الحساب غير نشط.",
  internal_user_required: "يلزم حساب مستخدم داخلي.",
  knowledge_role_required: "لا تتوفر صلاحية الوصول إلى المنصة المعرفية.",
  interactive_account_required: "يلزم حساب تفاعلي صالح.",
  mfa_required: "يلزم تفعيل التحقق بخطوتين للمتابعة.",
  permission_denied: "ليس لديك صلاحية تنفيذ هذا الإجراء.",
  rate_limited: "محاولات كثيرة. حاول لاحقًا.",
  upstream_unavailable: "خدمة المصادقة غير متاحة حاليًا.",
  server_error: "حدث خطأ غير متوقع. حاول لاحقًا.",
  validation_error: "البيانات المرسلة غير صالحة.",
  misconfigured: "إعدادات المصادقة غير مكتملة على الخادم.",
  origin_rejected: "رُفض الطلب لأسباب أمنية.",
};

export function knowledgeErrorMessage(code: KnowledgeAuthErrorCode): string {
  return ARABIC_MESSAGES[code];
}

/** Map upstream Odoo error code / HTTP status to a safe BFF code. */
export function mapUpstreamAuthError(input: {
  status?: number;
  code?: string | null;
}): KnowledgeAuthErrorCode {
  const raw = (input.code ?? "").trim().toLowerCase();

  const known: Record<string, KnowledgeAuthErrorCode> = {
    authentication_required: "authentication_required",
    invalid_credentials: "invalid_credentials",
    invalid_login: "invalid_credentials",
    session_expired: "session_expired",
    user_inactive: "user_inactive",
    inactive_user: "user_inactive",
    internal_user_required: "internal_user_required",
    knowledge_role_required: "knowledge_role_required",
    interactive_account_required: "interactive_account_required",
    mfa_required: "mfa_required",
    totp_required: "mfa_required",
    permission_denied: "permission_denied",
    access_denied: "permission_denied",
    rate_limited: "rate_limited",
  };

  if (raw && known[raw]) return known[raw];

  switch (input.status) {
    case 401:
      return raw.includes("session") ? "session_expired" : "invalid_credentials";
    case 403:
      if (raw.includes("mfa")) return "mfa_required";
      if (raw.includes("inactive")) return "user_inactive";
      if (raw.includes("internal")) return "internal_user_required";
      if (raw.includes("role") || raw.includes("knowledge")) {
        return "knowledge_role_required";
      }
      return "permission_denied";
    case 429:
      return "rate_limited";
    case 502:
    case 503:
    case 504:
      return "upstream_unavailable";
    default:
      if (input.status && input.status >= 500) return "server_error";
      return "server_error";
  }
}

export function shouldClearSessionOnError(code: KnowledgeAuthErrorCode): boolean {
  return (
    code === "authentication_required" ||
    code === "session_expired" ||
    code === "user_inactive" ||
    code === "internal_user_required" ||
    code === "knowledge_role_required" ||
    code === "interactive_account_required" ||
    code === "permission_denied"
  );
}
