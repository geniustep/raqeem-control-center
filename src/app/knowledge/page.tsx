import { redirect } from "next/navigation";

import { KNOWLEDGE_UI_PATHS } from "@/lib/knowledge-read/constants";

export const dynamic = "force-dynamic";

export default function KnowledgeIndexPage() {
  redirect(KNOWLEDGE_UI_PATHS.dashboard);
}
