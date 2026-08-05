import Link from "next/link";

import { KnowledgeIntakeCreateForm } from "@/components/knowledge/KnowledgeIntakeCreateForm";
import { KnowledgePageHeader } from "@/components/knowledge/KnowledgePageChrome";
import { KnowledgeWorkspace } from "@/components/knowledge/KnowledgeWorkspace";
import { KNOWLEDGE_INTAKE_UI_PATHS } from "@/lib/knowledge-intake/constants";
import { knowledgeIntakeCopy as t } from "@/lib/knowledge-intake/i18n";
import { loadIntakeOptions } from "@/lib/knowledge-intake/loaders";
import { loadFilterOptions } from "@/lib/knowledge-read/loaders";

export const dynamic = "force-dynamic";

export default async function KnowledgeIntakeCreatePage() {
  const [intakeOptions, knowledgeOptions] = await Promise.all([
    loadIntakeOptions(),
    loadFilterOptions(),
  ]);
  return (
    <KnowledgeWorkspace>
      <KnowledgePageHeader
        title={t.createTitle}
        subtitle={t.createSubtitle}
        actions={
          <Link href={KNOWLEDGE_INTAKE_UI_PATHS.inbox} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white">
            العودة إلى الصندوق
          </Link>
        }
      />
      <KnowledgeIntakeCreateForm
        sourceTypes={intakeOptions.sourceTypes}
        riskLevels={intakeOptions.riskLevels}
        itemTypes={knowledgeOptions.itemTypes}
        intents={knowledgeOptions.intents}
        languages={knowledgeOptions.languages}
        domains={knowledgeOptions.domains}
      />
    </KnowledgeWorkspace>
  );
}
