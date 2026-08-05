import type { ReactNode } from "react";

/** Root Knowledge layout — auth pages and workspace share this minimal wrapper. */
export default function KnowledgeRootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="min-h-screen bg-slate-50">{children}</div>;
}
