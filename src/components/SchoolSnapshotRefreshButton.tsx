"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const ERROR_LABELS: Record<string, string> = {
  CONFIGURATION_ERROR: "إعداد نقطة الاتصال غير مكتمل.",
  AUTH_FAILURE: "تعذّرت مصادقة بيانات Snapshot.",
  CONNECTIVITY_FAILURE: "تعذّر الوصول إلى خدمة المدرسة.",
  REMOTE_STATE_ERROR: "حالة خدمة المدرسة لا تسمح بالتحديث الآن.",
  SERVER_ERROR: "حدث خطأ في خدمة Snapshot.",
  CONTRACT_ERROR: "الاستجابة لا تطابق عقد Snapshot المعتمد.",
};

export function SchoolSnapshotRefreshButton({
  tenantCode,
  enabled,
}: {
  tenantCode: string;
  enabled: boolean;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    if (!enabled || state === "loading") return;
    setState("loading");
    setMessage(null);
    try {
      const response = await fetch(
        `/api/tenants/${encodeURIComponent(tenantCode)}/school-snapshot/refresh`,
        { method: "POST" },
      );
      const body = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; category?: string | null }
        | null;
      if (!response.ok || body?.ok !== true) {
        const category = body?.category ?? "";
        setState("error");
        setMessage(
          ERROR_LABELS[category] ??
            (body?.error === "snapshot_refresh_unconfigured"
              ? "صلاحية التحديث الآمن غير مُعدّة على الخادم."
              : "تعذّر تحديث بيانات المدرسة."),
        );
        return;
      }
      setState("success");
      setMessage("تم تحديث بيانات المدرسة بنجاح.");
      router.refresh();
    } catch {
      setState("error");
      setMessage("تعذّر الاتصال بمركز التحكم.");
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={refresh}
        disabled={!enabled || state === "loading"}
        className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
      >
        {state === "loading" ? "جارٍ التحديث…" : "تحديث بيانات المدرسة"}
      </button>
      {!enabled ? (
        <span className="max-w-[260px] text-left text-[11px] text-slate-400">
          يلزم إعداد صلاحية Snapshot المخصّصة على الخادم أولًا.
        </span>
      ) : message ? (
        <span
          className={`max-w-[260px] text-left text-[11px] ${
            state === "success" ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {message}
        </span>
      ) : null}
    </div>
  );
}
