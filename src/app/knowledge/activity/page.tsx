import {
  KnowledgeEmptyState,
  KnowledgePageHeader,
} from "@/components/knowledge/KnowledgePageChrome";
import { KnowledgeWorkspace } from "@/components/knowledge/KnowledgeWorkspace";
import { knowledgeUiCopy as t } from "@/lib/knowledge-read/i18n";

export const dynamic = "force-dynamic";

export default async function KnowledgeActivityPage() {
  return (
    <KnowledgeWorkspace>
      <KnowledgePageHeader
        title={t.activity.title}
        subtitle={t.activity.subtitle}
      />
      <KnowledgeEmptyState title={t.activity.deferred} />
    </KnowledgeWorkspace>
  );
}
