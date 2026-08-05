"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";

/** Hide the Platform admin shell on login and Knowledge surfaces. */
export function ConditionalAppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (
    pathname === "/login" ||
    pathname === "/knowledge" ||
    pathname.startsWith("/knowledge/")
  ) {
    return <>{children}</>;
  }
  return <AppShell>{children}</AppShell>;
}
