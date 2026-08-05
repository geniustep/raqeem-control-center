import { NextResponse, type NextRequest } from "next/server";

import { createRequestId } from "@/lib/knowledge-auth/envelope";
import { isAllowedKnowledgeMutationOrigin } from "@/lib/knowledge-auth/origin";
import {
  KnowledgeSessionGateError,
  clearKnowledgeSessionCookie,
  requireReadyKnowledgeSession,
} from "@/lib/knowledge-read/session-gate";
import {
  KnowledgeIntakeUpstreamError,
  type KnowledgeIntakeErrorCode,
} from "@/lib/knowledge-intake/client";
import type { KnowledgeSessionPayload } from "@/lib/knowledge-auth/types";

const ARABIC_MESSAGES: Record<KnowledgeIntakeErrorCode | "origin_rejected", string> = {
  authentication_required: "يلزم تسجيل الدخول للمتابعة.",
  session_expired: "انتهت صلاحية الجلسة. سجّل الدخول مجددًا.",
  permission_denied: "ليس لديك صلاحية تنفيذ هذا الإجراء.",
  intake_not_found: "طلب الإدخال المعرفي غير موجود.",
  validation_failed: "تعذّر التحقق من بيانات الطلب.",
  invalid_transition: "لا يمكن تنفيذ هذا الانتقال في الحالة الحالية.",
  duplicate_detected: "تم اكتشاف مادة متكررة أو شديدة التشابه.",
  possible_update_requires_review: "يبدو أن الطلب تحديث لمادة موجودة ويحتاج مراجعة بشرية.",
  prohibited_content: "رُفض المحتوى وفق سياسة الأمان.",
  mutation_gate_closed: "إنشاء المسودة متوقف حاليًا بقرار تشغيلي.",
  idempotency_conflict: "استُخدم مفتاح العملية سابقًا مع بيانات مختلفة.",
  stale_write: "تغيّر الطلب منذ فتح الصفحة. حدّث الصفحة وحاول مجددًا.",
  version_conflict: "تعارض إصدار الطلب.",
  rate_limited: "محاولات كثيرة. حاول لاحقًا.",
  upstream_unavailable: "خدمة Intake غير متاحة حاليًا.",
  server_error: "حدث خطأ غير متوقع.",
  origin_rejected: "رُفض الطلب لأسباب أمنية.",
};

export function intakeRequestId(request: NextRequest): string {
  return createRequestId(request.headers.get("x-request-id"));
}

export function intakeJsonOk<T>(
  data: T,
  requestId: string,
  init?: { status?: number; meta?: Record<string, unknown>; headers?: HeadersInit },
) {
  const response = NextResponse.json(
    { ok: true, data, meta: init?.meta ?? {}, request_id: requestId, error: null },
    { status: init?.status ?? 200 },
  );
  response.headers.set("X-Request-ID", requestId);
  if (init?.headers) {
    const headers = new Headers(init.headers);
    headers.forEach((value, key) => response.headers.set(key, value));
  }
  return response;
}

export function intakeJsonError(
  code: KnowledgeIntakeErrorCode | "origin_rejected",
  requestId: string,
  init?: { status?: number; meta?: Record<string, unknown>; headers?: HeadersInit },
) {
  const response = NextResponse.json(
    {
      ok: false,
      data: null,
      meta: init?.meta ?? {},
      request_id: requestId,
      error: { code, message: ARABIC_MESSAGES[code] },
    },
    { status: init?.status ?? 400 },
  );
  response.headers.set("X-Request-ID", requestId);
  if (init?.headers) {
    const headers = new Headers(init.headers);
    headers.forEach((value, key) => response.headers.set(key, value));
  }
  return response;
}

export async function requireIntakeSession(
  request: NextRequest,
  mutation = false,
): Promise<{ session: KnowledgeSessionPayload; requestId: string } | NextResponse> {
  const requestId = intakeRequestId(request);
  if (mutation && !isAllowedKnowledgeMutationOrigin(request)) {
    return intakeJsonError("origin_rejected", requestId, { status: 403 });
  }
  try {
    const session = await requireReadyKnowledgeSession();
    return { session, requestId };
  } catch (error) {
    const code: KnowledgeIntakeErrorCode =
      error instanceof KnowledgeSessionGateError
        ? error.code === "authentication_required"
          ? "authentication_required"
          : error.code === "mfa_required"
            ? "permission_denied"
            : "server_error"
        : "server_error";
    return intakeJsonError(code, requestId, {
      status: code === "authentication_required" ? 401 : code === "permission_denied" ? 403 : 503,
    });
  }
}

export function intakeErrorResponse(
  error: unknown,
  requestId: string,
): NextResponse {
  if (error instanceof KnowledgeIntakeUpstreamError) {
    const clearSession =
      error.code === "authentication_required" || error.code === "session_expired";
    const response = intakeJsonError(error.code, requestId, {
      status: error.status,
      headers: error.retryAfterSeconds
        ? { "Retry-After": String(error.retryAfterSeconds) }
        : undefined,
    });
    if (clearSession) clearKnowledgeSessionCookie(response.cookies);
    return response;
  }
  return intakeJsonError("server_error", requestId, { status: 500 });
}

export async function readJsonObject(
  request: NextRequest,
  maxBytes = 64_000,
): Promise<Record<string, unknown> | null> {
  const length = Number.parseInt(request.headers.get("content-length") ?? "0", 10);
  if (Number.isFinite(length) && length > maxBytes) return null;
  try {
    const value = (await request.json()) as unknown;
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}
