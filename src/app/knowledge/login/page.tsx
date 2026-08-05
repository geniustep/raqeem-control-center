import { Card, CardBody, CardHeader } from "@/components/Card";
import { KnowledgeLoginForm } from "@/components/knowledge/KnowledgeLoginForm";
import { knowledgeAuthCopy as t } from "@/lib/knowledge-auth/i18n";

export default function KnowledgeLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-lg font-bold text-white">
            ر
          </div>
          <h1 className="text-xl font-bold text-slate-900">{t.productName}</h1>
          <p className="mt-1 text-sm text-slate-500">{t.loginSubtitle}</p>
        </div>

        <Card>
          <CardHeader title={t.loginTitle} />
          <CardBody>
            <KnowledgeLoginForm />
          </CardBody>
        </Card>

        <p className="mt-4 text-center text-xs text-slate-400">{t.footer}</p>
      </div>
    </div>
  );
}
