"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";

/** Inline monospace value with a copy-to-clipboard button. */
export function CopyableCode({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard not available (e.g. insecure context) — ignore silently.
    }
  }

  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-md bg-slate-50 px-2 py-1 ring-1 ring-inset ring-slate-200">
      <code className="min-w-0 break-all font-mono text-[12.5px] text-slate-700" dir="ltr">
        {value}
      </code>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 rounded p-0.5 text-slate-400 transition-colors hover:text-brand-600"
        aria-label={copied ? t.common.copied : t.common.copy}
        title={copied ? t.common.copied : t.common.copy}
      >
        {copied ? (
          <svg className="h-4 w-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15V5a2 2 0 0 1 2-2h10" />
          </svg>
        )}
      </button>
    </span>
  );
}
