import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { dir, t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: `${t.app.name} · ${t.app.tagline}`,
  description: t.app.tagline,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir={dir}>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
