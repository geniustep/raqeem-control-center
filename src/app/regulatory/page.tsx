import { PageHeader } from "@/components/PageHeader";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type RegulatorySource = {
  public_id?: string;
  code?: string;
  title?: string;
  source_kind?: string;
  authority?: string;
  reference_number?: string;
  publication_date?: string;
  source_url?: string | null;
};

type RegulatoryItem = {
  public_id?: string;
  code?: string;
  item_type?: string;
  title?: string;
  description?: string | null;
  date_from?: string | null;
  date_to?: string | null;
  date_precision?: string;
  official_date_text?: string | null;
  applicability?: string;
  regulatory_effect?: string;
  source_page_from?: number | null;
  source_page_to?: number | null;
};

type Manifest = {
  ok?: boolean;
  country_code?: string;
  academic_year_code?: string;
  publication?: {
    public_id?: string;
    version?: string;
    compatibility_version?: string;
    effective_from?: string;
    published_at?: string;
  };
  bundle?: {
    bundle_id?: string;
    schema_version?: string;
    content_hash?: string;
    generated_at?: string;
    signature_status?: string;
    path?: string;
  };
};

type BundleResponse = {
  ok?: boolean;
  bundle_id?: string;
  content_hash?: string;
  schema_version?: string;
  signature_status?: string;
  generated_at?: string;
  payload?: {
    country_code?: string;
    academic_year_code?: string;
    effective_from?: string;
    sources?: RegulatorySource[];
    items?: RegulatoryItem[];
    documents?: unknown[];
    clauses?: unknown[];
  };
};

const BASE_URL = (process.env.RAQEEM_REGULATORY_CENTER_URL ?? "https://api-control.raqeem.ma").replace(/\/$/, "");
const COUNTRY = "MA";
const ACADEMIC_YEAR = "2026-2027";

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as T;
}

async function loadRegulatoryData() {
  try {
    const manifest = await getJson<Manifest>(
      `${BASE_URL}/api/v1/regulatory/manifest?country_code=${COUNTRY}&academic_year_code=${ACADEMIC_YEAR}`
    );
    if (!manifest.bundle?.bundle_id) throw new Error("manifest_without_bundle");
    const bundle = await getJson<BundleResponse>(
      `${BASE_URL}/api/v1/regulatory/bundles/${encodeURIComponent(manifest.bundle.bundle_id)}`
    );
    return { manifest, bundle, error: null };
  } catch (error) {
    return { manifest: null, bundle: null, error: error instanceof Error ? error.message : "unreachable" };
  }
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value.includes("T") ? value : `${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("ar-MA", { year: "numeric", month: "short", day: "numeric" }).format(parsed);
}

function itemTypeLabel(type?: string) {
  const labels: Record<string, string> = {
    start_year: "بداية السنة",
    study_start: "الدراسة",
    study_end: "نهاية الدراسة",
    procedure: "إجراء",
    registration_window: "التسجيل",
    inter_term_break: "عطلة بينية",
    national_holiday: "عطلة وطنية",
    religious_holiday: "عطلة دينية",
    mid_year_break: "منتصف السنة",
    assessment_window: "تقويم",
    exam_period: "امتحان",
    competition_window: "نشاط / مسابقة",
  };
  return labels[type ?? ""] ?? type ?? "—";
}

function itemDate(item: RegulatoryItem) {
  if (item.official_date_text) return item.official_date_text;
  if (item.date_from && item.date_to && item.date_from !== item.date_to) {
    return `${formatDate(item.date_from)} ← ${formatDate(item.date_to)}`;
  }
  return formatDate(item.date_from);
}

function StatCard({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-bold text-slate-950">{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
}

export default async function RegulatoryPage() {
  const { manifest, bundle, error } = await loadRegulatoryData();
  const L = t.regulatory;
  const payload = bundle?.payload;
  const sources = payload?.sources ?? [];
  const items = payload?.items ?? [];
  const source = sources[0];

  return (
    <div>
      <PageHeader title={L.title} subtitle={L.subtitle} />

      {error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <div className="text-lg font-bold text-amber-950">{L.unavailable}</div>
          <div className="mt-2 text-sm text-amber-800">{L.unavailableHint}</div>
          <div className="mt-3 font-mono text-xs text-amber-700" dir="ltr">{error}</div>
        </div>
      ) : (
        <>
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">منشور ومعتمد للتوزيع</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">قراءة فقط</span>
                </div>
                <h2 className="mt-4 text-2xl font-bold text-slate-950">{source?.title ?? L.currentPublication}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                  {source?.authority ?? "المركز التنظيمي المركزي لرقيم"} · المرجع {source?.reference_number ?? manifest?.publication?.version ?? "—"}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-950 px-5 py-4 text-white" dir="ltr">
                <div className="text-xs text-slate-400">Publication</div>
                <div className="mt-1 text-xl font-bold">{manifest?.publication?.version ?? "—"}</div>
              </div>
            </div>
          </section>

          <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="السنة الدراسية" value={manifest?.academic_year_code ?? payload?.academic_year_code ?? "—"} />
            <StatCard label="العناصر التنظيمية" value={items.length} hint="مواعيد، عطل، امتحانات وإجراءات" />
            <StatCard label="المصادر الرسمية" value={sources.length} />
            <StatCard label="تاريخ نشر المرجع" value={formatDate(source?.publication_date ?? manifest?.publication?.published_at)} />
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-5">
                <h2 className="text-lg font-bold text-slate-950">المصدر الرسمي</h2>
                <p className="mt-1 text-sm text-slate-500">المرجع الذي بُنيت منه الحزمة التنظيمية الحالية.</p>
              </div>
              <dl className="grid gap-5 p-6 md:grid-cols-2">
                <div><dt className="text-xs text-slate-500">الجهة</dt><dd className="mt-1 font-semibold">{source?.authority ?? "—"}</dd></div>
                <div><dt className="text-xs text-slate-500">رقم المرجع</dt><dd className="mt-1 font-semibold" dir="ltr">{source?.reference_number ?? "—"}</dd></div>
                <div><dt className="text-xs text-slate-500">الدولة</dt><dd className="mt-1 font-semibold">{manifest?.country_code === "MA" ? "المغرب" : manifest?.country_code ?? "—"}</dd></div>
                <div><dt className="text-xs text-slate-500">السريان</dt><dd className="mt-1 font-semibold">{formatDate(manifest?.publication?.effective_from ?? payload?.effective_from)}</dd></div>
              </dl>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950">سلامة الحزمة</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4"><span className="text-slate-500">Schema</span><strong dir="ltr">{bundle?.schema_version ?? "—"}</strong></div>
                <div className="flex items-center justify-between gap-4"><span className="text-slate-500">توليد الحزمة</span><strong>{formatDate(bundle?.generated_at)}</strong></div>
                <div className="flex items-center justify-between gap-4"><span className="text-slate-500">المطابقة</span><strong className="text-emerald-700">تم تحميل الحزمة</strong></div>
              </div>
              <details className="mt-5 border-t border-slate-100 pt-4">
                <summary className="cursor-pointer text-sm font-semibold text-slate-700">تفاصيل تقنية</summary>
                <div className="mt-3 space-y-3 text-xs text-slate-500">
                  <div><span>Bundle ID</span><div className="mt-1 break-all font-mono text-slate-700" dir="ltr">{bundle?.bundle_id}</div></div>
                  <div><span>Content Hash</span><div className="mt-1 break-all font-mono text-slate-700" dir="ltr">{bundle?.content_hash}</div></div>
                </div>
              </details>
            </div>
          </section>

          <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-slate-100 px-6 py-5 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950">محتوى المرجع التنظيمي</h2>
                <p className="mt-1 text-sm text-slate-500">العناصر الفعلية الموزعة على المدارس ضمن الحزمة الحالية.</p>
              </div>
              <div className="text-sm font-semibold text-slate-600">{items.length} عنصرًا</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-right text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">النوع</th>
                    <th className="px-5 py-3 font-semibold">العنوان</th>
                    <th className="px-5 py-3 font-semibold">التاريخ / الفترة</th>
                    <th className="px-5 py-3 font-semibold">الأثر</th>
                    <th className="px-5 py-3 font-semibold">صفحة المصدر</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr key={item.public_id ?? item.code} className="align-top hover:bg-slate-50/70">
                      <td className="px-5 py-4"><span className="whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{itemTypeLabel(item.item_type)}</span></td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">{item.title ?? item.code}</div>
                        {item.description ? <div className="mt-1 max-w-xl text-xs leading-5 text-slate-500">{item.description}</div> : null}
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-700">{itemDate(item)}</td>
                      <td className="px-5 py-4 text-xs text-slate-600">{item.regulatory_effect ?? "—"}</td>
                      <td className="px-5 py-4 text-slate-600">{item.source_page_from ? (item.source_page_to && item.source_page_to !== item.source_page_from ? `${item.source_page_from}–${item.source_page_to}` : item.source_page_from) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950">توزيع المرجع على المدارس</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  المركز يسجل ACK تقنيًا لكل Tenant، لكن الـAPI العام الحالي لا يوفّر قائمة إدارية آمنة لحالات المدارس. لن تعرض الواجهة حالات تقديرية أو بيانات مخترعة.
                </p>
              </div>
              <span className="w-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">عقد الإدارة مطلوب</span>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
