import { redirect } from "next/navigation";

import { Card, CardBody, CardHeader } from "@/components/Card";
import { KnowledgeLogoutButton } from "@/components/knowledge/KnowledgeLogoutButton";
import { Pill } from "@/components/Pill";
import { KNOWLEDGE_AUTH_PATHS } from "@/lib/knowledge-auth/constants";
import { readKnowledgeSessionFromCookies } from "@/lib/knowledge-auth/cookie-store";
import { knowledgeAuthCopy as t } from "@/lib/knowledge-auth/i18n";

export const dynamic = "force-dynamic";

export default async function KnowledgeHomePage() {
  const session = await readKnowledgeSessionFromCookies();
  if (!session) {
    redirect(KNOWLEDGE_AUTH_PATHS.loginPage);
  }
  if (!session.knowledge_access_ready) {
    redirect(KNOWLEDGE_AUTH_PATHS.mfaOnboarding);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.productName}</h1>
          <p className="mt-1 text-sm text-slate-500" dir="auto">
            {session.display_name}
          </p>
        </div>
        <KnowledgeLogoutButton />
      </div>

      <Card>
        <CardHeader title="جلسة معرفة جاهزة" />
        <CardBody>
          <dl className="space-y-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <dt className="text-slate-500">{t.rolesLabel}</dt>
              <dd className="flex flex-wrap gap-2">
                {session.roles.length > 0 ? (
                  session.roles.map((role) => (
                    <Pill key={role} tone="blue">
                      {role}
                    </Pill>
                  ))
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <dt className="text-slate-500">{t.mfaLabel}</dt>
              <dd>
                <Pill tone={session.mfa_enabled ? "green" : "amber"}>
                  {session.mfa_enabled ? t.mfaEnabled : t.mfaDisabled}
                </Pill>
              </dd>
            </div>
          </dl>

          <p className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {t.shellPlaceholder}
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
