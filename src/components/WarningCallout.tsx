import type { ReactNode } from "react";

type Variant = "warning" | "danger" | "info";

const VARIANT: Record<
  Variant,
  { box: string; icon: string; title: string }
> = {
  warning: {
    box: "border-amber-200 bg-amber-50 text-amber-800",
    icon: "text-amber-500",
    title: "text-amber-900",
  },
  danger: {
    box: "border-red-200 bg-red-50 text-red-800",
    icon: "text-red-500",
    title: "text-red-900",
  },
  info: {
    box: "border-brand-200 bg-brand-50 text-brand-800",
    icon: "text-brand-500",
    title: "text-brand-900",
  },
};

/** Inline callout used for warnings, blockers and informational notes. */
export function WarningCallout({
  title,
  variant = "warning",
  children,
}: {
  title?: string;
  variant?: Variant;
  children?: ReactNode;
}) {
  const v = VARIANT[variant];
  return (
    <div className={`flex gap-3 rounded-lg border p-3 ${v.box}`}>
      <svg
        className={`mt-0.5 h-5 w-5 shrink-0 ${v.icon}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      </svg>
      <div className="min-w-0 text-sm">
        {title ? <div className={`mb-0.5 font-semibold ${v.title}`}>{title}</div> : null}
        {children}
      </div>
    </div>
  );
}
