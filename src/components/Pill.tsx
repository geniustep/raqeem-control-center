import type { ReactNode } from "react";

export type Tone = "green" | "amber" | "red" | "gray" | "blue";

const TONE_CLASSES: Record<Tone, string> = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
  red: "bg-red-50 text-red-700 ring-red-600/20",
  gray: "bg-slate-100 text-slate-600 ring-slate-500/20",
  blue: "bg-brand-50 text-brand-700 ring-brand-600/20",
};

const DOT_CLASSES: Record<Tone, string> = {
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  gray: "bg-slate-400",
  blue: "bg-brand-500",
};

/** Small status pill used by all badges. Direction-agnostic (uses gap). */
export function Pill({
  tone,
  children,
  dot = true,
}: {
  tone: Tone;
  children: ReactNode;
  dot?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TONE_CLASSES[tone]}`}
    >
      {dot ? (
        <span className={`h-1.5 w-1.5 rounded-full ${DOT_CLASSES[tone]}`} />
      ) : null}
      {children}
    </span>
  );
}
