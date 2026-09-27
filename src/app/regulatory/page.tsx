import { PageHeader } from "@/components/PageHeader";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type Manifest = {
  publication?: {
    version?: string;
    country_code?: string;
    academic_year_code?: string;
    published_at?: string;
  };
  bundle?: {
    bundle_id?: string;
    content_hash?: string;
    item_count?: number;
    source_count?: number;
  };
};

async function loadManifest(): Promise<{ data: Manifest | null; error: string | null }> {
  const baseUrl = (process.env.RAQEEM_REGULATORY_CENTER_URL ?? "https://api-control.raqeem.ma").replace(/\/$/, "");
  const url = `${baseUrl}/api/v1/regulatory/manifest?country_code=MA&academic_year_code=2026-2027`;

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return { data: null, error: `HTTP ${response.status}` };
    return { data: (await response.json()) as Manifest, error: null };
  } catch {
    return { data: null, error: "unreachable" };
  }
}

function Value({ children, ltr = false }: { children: React.ReactNode; ltr?: boolean }) {
  return (
    <div className="mt-1 text-sm font-semibold text-slate-900" dir={ltr ? "ltr" : undefined}>
      {children || "—"}
    </div>
  );
}

export default async function RegulatoryPage() {
  const { data, error } = await loadManifest();
  const L = t.regulatory;
  const publication = data?.publication;
  const bundle = data?.bundle;

  return (
    <div>
      <PageHeader title={L.title} subtitle={L.subtitle} />

      <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        {L.readOnlyNotice}
      </div>

      {error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="font-semibold text-amber-900">{L.unavailable}</div>
          <div className="mt-1 text-sm text-amber-800">{L.unavailableHint}</div>
          <div className="mt-2 font-mono text-xs text-amber-700" dir="ltr">{error}</div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-medium text-slate-500">{L.currentPublication}</div>
              <Value ltr>{publication?.version}</Value>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-medium text-slate-500">{L.academicYear}</div>
              <Value ltr>{publication?.academic_year_code}</Value>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-medium text-slate-500">{L.items}</div>
              <Value>{bundle?.item_count?.toString()}</Value>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs font-medium text-slate-500">{L.sources}</div>
              <Value>{bundle?.source_count?.toString()}</Value>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-semibold text-slate-900">{L.releaseDetails}</h2>
            </div>
            <dl className="grid gap-x-8 gap-y-5 p-5 md:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-500">{L.country}</dt>
                <dd><Value ltr>{publication?.country_code}</Value></dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">{L.publishedAt}</dt>
                <dd><Value ltr>{publication?.published_at}</Value></dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">{L.bundleId}</dt>
                <dd><Value ltr>{bundle?.bundle_id}</Value></dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">{L.contentHash}</dt>
                <dd className="break-all"><Value ltr>{bundle?.content_hash}</Value></dd>
              </div>
            </dl>
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">{L.deliveryStatus}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{L.deliveryStatusHint}</p>
          </div>
        </>
      )}
    </div>
  );
}
