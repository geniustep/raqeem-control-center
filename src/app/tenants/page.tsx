import { PageHeader } from "@/components/PageHeader";
import { TenantTable } from "@/components/TenantTable";
import { EmptyState } from "@/components/EmptyState";
import { DataSourceBanner } from "@/components/DataSourceBanner";
import { DataSourceErrorState } from "@/components/DataSourceErrorState";
import { loadTenants } from "@/lib/data-source/platform-data-source";
import { t } from "@/lib/i18n";

export default async function TenantsPage() {
  const result = await loadTenants();
  if (result.error) {
    return (
      <div>
        <PageHeader title={t.tenants.title} subtitle={t.tenants.subtitle} />
        <DataSourceErrorState error={result.error} />
      </div>
    );
  }

  const { data: tenants, meta } = result;

  return (
    <div>
      <DataSourceBanner meta={meta} />
      <PageHeader title={t.tenants.title} subtitle={t.tenants.subtitle} />
      {tenants.length === 0 ? (
        <EmptyState title={t.tenants.empty} />
      ) : (
        <TenantTable tenants={tenants} />
      )}
    </div>
  );
}
