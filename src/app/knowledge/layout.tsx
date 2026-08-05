import type { ReactNode } from "react";

/** Isolated Knowledge shell — no Platform AppShell / sidebar in 2E. */
export default function KnowledgeLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-slate-50">{children}</div>;
}
