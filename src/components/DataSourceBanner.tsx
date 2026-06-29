import type { DataSourceMeta } from "@/lib/data-source/types";
import { WarningCallout } from "@/components/WarningCallout";

export function DataSourceBanner({ meta }: { meta: DataSourceMeta }) {
  if (!meta.warning && !meta.usedFallback && meta.configuredSource === "mock") {
    return null;
  }

  const sourceLabel =
    meta.effectiveSource === "odoo" ? "Odoo API" : "Mock (seed data)";

  const detail = meta.warning ?? (
    meta.configuredSource === "odoo" && meta.effectiveSource === "odoo"
      ? `مصدر البيانات: ${sourceLabel}`
      : undefined
  );

  if (!detail && meta.configuredSource === meta.effectiveSource) {
    return null;
  }

  return (
    <div className="mb-6">
      <WarningCallout
        variant={meta.usedFallback ? "warning" : "info"}
        title={
          meta.usedFallback
            ? "Fallback إلى mock"
            : `مصدر البيانات: ${meta.configuredSource}`
        }
      >
        <p>{detail}</p>
        <p className="mt-2 text-xs opacity-80">
          مُعد: {meta.configuredSource} · فعّال: {meta.effectiveSource}
          {meta.apiConfigured ? " · API مُعد" : " · API غير مُعد"}
        </p>
      </WarningCallout>
    </div>
  );
}
