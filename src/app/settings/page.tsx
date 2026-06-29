import { PageHeader } from "@/components/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/Card";
import { WarningCallout } from "@/components/WarningCallout";
import { getPublicDataSourceInfo } from "@/lib/data-source/config";
import { t } from "@/lib/i18n";

export default function SettingsPage() {
  const dataSource = getPublicDataSourceInfo();

  return (
    <div>
      <PageHeader title={t.settings.title} subtitle={t.settings.subtitle} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="مصدر البيانات (Data Source)" />
          <CardBody className="space-y-3">
            <dl className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
                <dt className="text-slate-500">Data source</dt>
                <dd className="font-mono font-medium text-slate-900" dir="ltr">
                  {dataSource.configuredSource}
                </dd>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
                <dt className="text-slate-500">API configured</dt>
                <dd className="font-medium text-slate-900">
                  {dataSource.apiConfigured ? "yes" : "no"}
                </dd>
              </div>
            </dl>
            <WarningCallout variant="info" title="قراءة فقط — بدون أسرار">
              لا يُعرض عنوان API الكامل ولا أي token في الواجهة. الاتصال بـ Odoo يتم
              server-side فقط عند ضبط المتغيرات البيئية على الخادم.
            </WarningCallout>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="المصادقة (Auth)" />
          <CardBody className="space-y-3">
            <WarningCallout variant="info" title="مكان مخصّص للمرحلة القادمة">
              {t.settings.authPlaceholder}
            </WarningCallout>
            <div className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400">
              تسجيل الدخول والصلاحيات — قيد التطوير
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t.settings.securityTitle} />
          <CardBody>
            <p className="mb-3 text-sm text-slate-600">{t.settings.securityNote}</p>
            <ul className="space-y-2 text-sm text-slate-600">
              {[
                "لا تخزين كلمات مرور أو tokens أو مفاتيح خاصة",
                "لا تنفيذ أوامر SSH أو production تلقائيًا",
                "لا ربط فعلي بـ Cloudflare / Vercel / PostgreSQL",
                "كل العمليات للقراءة / المحاكاة فقط (Dry-run)",
                'القيم الحساسة تُعرض كـ "configured outside control center" أو REDACTED',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader title="حول مركز التحكّم" />
          <CardBody className="text-sm text-slate-600">
            <p>
              {t.app.name} هو لوحة تحكّم داخلية لـ {t.app.operator} لإدارة دورة حياة
              المدارس المستضافة على منصة رقيم — البنية التحتية، قواعد البيانات، Odoo،
              النطاقات، SSL، Cloudflare، فحوصات الصحة، والعمليات الآمنة.
            </p>
            <p className="mt-2 text-xs text-slate-400">
              الإصدار 0.1.0 · المرحلة الأولى (Read-only / Mock + Odoo adapter)
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
