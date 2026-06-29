import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <div className="text-5xl font-bold text-slate-300">404</div>
      <h1 className="text-lg font-semibold text-slate-800">الصفحة غير موجودة</h1>
      <p className="text-sm text-slate-500">
        تعذّر العثور على المورد المطلوب داخل مركز التحكّم.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        العودة إلى لوحة المعلومات
      </Link>
    </div>
  );
}
