import { redirect } from "next/navigation";

import { Card, CardBody, CardHeader } from "@/components/Card";
import { KnowledgeMfaOnboardingPanel } from "@/components/knowledge/KnowledgeMfaOnboardingPanel";
import { KNOWLEDGE_AUTH_PATHS } from "@/lib/knowledge-auth/constants";
import { readKnowledgeSessionFromCookies } from "@/lib/knowledge-auth/cookie-store";
import { knowledgeAuthCopy as t } from "@/lib/knowledge-auth/i18n";

export const dynamic = "force-dynamic";

export default async function KnowledgeMfaOnboardingPage() {
  const session = await readKnowledgeSessionFromCookies();
  if (!session) {
    redirect(KNOWLEDGE_AUTH_PATHS.loginPage);
  }
  if (session.knowledge_access_ready) {
    redirect(KNOWLEDGE_AUTH_PATHS.home);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-slate-900">{t.productName}</h1>
          <p className="mt-1 text-sm text-slate-500">{t.mfaTitle}</p>
        </div>
        <Card>
          <CardHeader title={t.mfaTitle} />
          <CardBody>
            <KnowledgeMfaOnboardingPanel
              displayName={session.display_name}
              login={session.login}
            />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
