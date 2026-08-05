import type { ReactNode } from "react";

import { KnowledgeShell } from "@/components/knowledge/KnowledgeShell";
import { loadReadySessionOrRedirect } from "@/lib/knowledge-read/loaders";

export async function KnowledgeWorkspace({ children }: { children: ReactNode }) {
  const session = await loadReadySessionOrRedirect();
  return (
    <KnowledgeShell userName={session.display_name}>{children}</KnowledgeShell>
  );
}
