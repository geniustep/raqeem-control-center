import { StatCard } from "@/components/StatCard";
import { Card, CardBody, CardHeader } from "@/components/Card";
import type { ReleaseDashboard } from "@/lib/release-snapshot/types";

export function ReleaseReadinessSummary({ data }: { data: ReleaseDashboard }) {
  return (
    <section className="mt-6">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-slate-900">
          جاهزية وتوافق الإصدارات
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          حالة التوافق مع الإصدار المستهدف لكل مدرسة، مستقلة عن فحوص الصحة التشغيلية.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard
          label="محدّثة ومتوافقة"
          value={data.currentCompatibleCount}
          total={data.tenantCount}
          tone="green"
        />
        <StatCard
          label="متأخرة لكن متوافقة"
          value={data.behindButCompatibleCount}
          total={data.tenantCount}
          tone="amber"
        />
        <StatCard
          label="غير متوافقة"
          value={data.incompatibleCount}
          total={data.tenantCount}
          tone="red"
        />
        <StatCard
          label="تحتاج تحققًا"
          value={data.verifyRequiredCount}
          total={data.tenantCount}
          tone="gray"
        />
        <StatCard
          label="إصدار جزئي"
          value={data.partialReleaseCount}
          total={data.tenantCount}
          tone="amber"
        />
        <StatCard
          label="أمام الهدف — غير متحقق"
          value={data.aheadUnverifiedCount}
          total={data.tenantCount}
          tone="blue"
        />
        <StatCard
          label="ترقية متاحة"
          value={data.upgradeAvailableCount}
          total={data.tenantCount}
          tone="blue"
        />
      </div>

      <Card className="mt-3">
        <CardHeader title="الإصدارات المستهدفة" />
        <CardBody>
          <div className="flex flex-wrap gap-2">
            {data.targetReleases.map((item) => (
              <div
                key={item.code ?? "unassigned"}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600"
              >
                <span className="font-medium text-slate-800">
                  {item.code ?? "غير معيّن"}
                </span>
                <span className="mx-2 text-slate-300">•</span>
                <span>{item.tenantCount} مدرسة</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </section>
  );
}
