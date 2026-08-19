"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function WhatsAppEntitlementToggle({
  tenantCode,
  enabled,
}: {
  tenantCode: string;
  enabled: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/tenants/${encodeURIComponent(tenantCode)}/services/whatsapp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled: !enabled }),
        },
      );
      if (!response.ok) {
        setError("تعذّر تحديث الخدمة. حاول مرة أخرى.");
        return;
      }
      router.refresh();
    } catch {
      setError("تعذّر الاتصال بالخدمة.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          enabled
            ? "border border-red-200 bg-white text-red-700 hover:bg-red-50"
            : "bg-brand-600 text-white hover:bg-brand-700"
        }`}
      >
        {pending ? "جارٍ الحفظ..." : enabled ? "إيقاف الخدمة" : "تفعيل الخدمة"}
      </button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
