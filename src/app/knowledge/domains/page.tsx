import {
  KnowledgeEmptyState,
  KnowledgeErrorState,
  KnowledgePageHeader,
} from "@/components/knowledge/KnowledgePageChrome";
import { KnowledgeWorkspace } from "@/components/knowledge/KnowledgeWorkspace";
import { Pill } from "@/components/Pill";
import { KnowledgeUpstreamError } from "@/lib/knowledge-auth/client";
import { KNOWLEDGE_UI_PATHS } from "@/lib/knowledge-read/constants";
import { knowledgeUiCopy as t } from "@/lib/knowledge-read/i18n";
import { loadDomainsData } from "@/lib/knowledge-read/loaders";
import type { KnowledgeDomain } from "@/lib/knowledge-read/types";

export const dynamic = "force-dynamic";

function buildTree(domains: KnowledgeDomain[]) {
  const byParent = new Map<number | null, KnowledgeDomain[]>();
  for (const domain of domains) {
    const key = domain.parent_id;
    const list = byParent.get(key) ?? [];
    list.push(domain);
    byParent.set(key, list);
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => a.sequence - b.sequence || a.name.localeCompare(b.name, "ar"));
  }
  return byParent;
}

function DomainNodes({
  parentId,
  byParent,
  depth,
}: {
  parentId: number | null;
  byParent: Map<number | null, KnowledgeDomain[]>;
  depth: number;
}) {
  const nodes = byParent.get(parentId) ?? [];
  if (nodes.length === 0) return null;
  return (
    <ul className={depth === 0 ? "space-y-3" : "mt-2 space-y-2 border-r border-slate-200 pr-3"}>
      {nodes.map((domain) => (
        <li
          key={domain.id}
          className="rounded-xl border border-slate-200 bg-white p-4"
          style={{ marginInlineStart: depth * 12 }}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="font-medium text-slate-900">{domain.name}</div>
              <div className="mt-1 font-mono text-xs text-slate-500" dir="ltr">
                {domain.code}
              </div>
              {domain.description ? (
                <p className="mt-2 text-sm text-slate-600">{domain.description}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Pill tone={domain.active ? "green" : "gray"}>
                {domain.active ? t.domains.active : t.domains.inactive}
              </Pill>
              <Pill tone="gray" dot={false}>
                {t.domains.sequence}: {domain.sequence}
              </Pill>
            </div>
          </div>
          <DomainNodes parentId={domain.id} byParent={byParent} depth={depth + 1} />
        </li>
      ))}
    </ul>
  );
}

export default async function KnowledgeDomainsPage() {
  try {
    const { domains } = await loadDomainsData();
    const byParent = buildTree(domains);

    return (
      <KnowledgeWorkspace>
        <KnowledgePageHeader
          title={t.domains.title}
          subtitle={t.domains.subtitle}
        />
        {domains.length === 0 ? (
          <KnowledgeEmptyState title={t.domains.empty} />
        ) : (
          <DomainNodes parentId={null} byParent={byParent} depth={0} />
        )}
      </KnowledgeWorkspace>
    );
  } catch (error) {
    const message =
      error instanceof KnowledgeUpstreamError
        ? t.states.error
        : t.states.error;
    return (
      <KnowledgeWorkspace>
        <KnowledgePageHeader title={t.domains.title} />
        <KnowledgeErrorState
          message={message}
          retryHref={KNOWLEDGE_UI_PATHS.domains}
        />
      </KnowledgeWorkspace>
    );
  }
}
