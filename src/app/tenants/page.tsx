import { PageHeader } from "@/components/PageHeader";
import { TenantTable } from "@/components/TenantTable";
import { EmptyState } from "@/components/EmptyState";
import { tenants } from "@/data/tenants";
import { t } from "@/lib/i18n";

export default function TenantsPage() {
  return (
    <div>
      <PageHeader title={t.tenants.title} subtitle={t.tenants.subtitle} />
      {tenants.length === 0 ? (
        <EmptyState title={t.tenants.empty} />
      ) : (
        <TenantTable tenants={tenants} />
      )}
    </div>
  );
}
