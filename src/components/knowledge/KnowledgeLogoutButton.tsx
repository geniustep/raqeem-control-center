"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { KNOWLEDGE_AUTH_PATHS } from "@/lib/knowledge-auth/constants";
import { knowledgeAuthCopy as t } from "@/lib/knowledge-auth/i18n";

export function KnowledgeLogoutButton({
  className,
}: {
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    setLoading(true);
    try {
      await fetch(KNOWLEDGE_AUTH_PATHS.logoutApi, {
        method: "POST",
        headers: { Accept: "application/json" },
        credentials: "same-origin",
      });
    } finally {
      router.replace(KNOWLEDGE_AUTH_PATHS.loginPage);
      router.refresh();
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={loading}
      className={
        className ??
        "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-70"
      }
    >
      {t.logout}
    </button>
  );
}
