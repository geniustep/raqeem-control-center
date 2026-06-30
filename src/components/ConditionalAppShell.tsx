"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";

/** Hide the admin shell on the public login page. */
export function ConditionalAppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/login") {
    return <>{children}</>;
  }
  return <AppShell>{children}</AppShell>;
}
