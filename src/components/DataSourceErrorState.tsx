import { WarningCallout } from "@/components/WarningCallout";
import { t } from "@/lib/i18n";
import type { DataSourceErrorInfo } from "@/lib/data-source/types";

export function DataSourceErrorState({ error }: { error: DataSourceErrorInfo }) {
  const copy =
    error.code === "odoo_misconfigured"
      ? {
          title: t.dataSource.misconfiguredTitle,
          description: t.dataSource.misconfiguredDescription,
        }
      : {
          title: t.dataSource.unavailableTitle,
          description: t.dataSource.unavailableDescription,
        };

  return (
    <WarningCallout variant="danger" title={copy.title}>
      <p>{copy.description}</p>
      <p className="mt-2 text-xs opacity-80">{t.dataSource.operatorHint}</p>
    </WarningCallout>
  );
}
