import type { Metadata, Viewport } from "next";
import { Archivo, Geist_Mono, Inter } from "next/font/google";
import { CommandPalette } from "@/components/nav/CommandPalette";
import { getViewer } from "@/lib/auth";
import { SessionProvider } from "@/lib/session";
import { sessionSnapshot } from "@/lib/social";
import { SITE } from "@/lib/site";
import { THEME_BOOT_SCRIPT } from "@/lib/themes";
import "@/lib/store";
import "./globals.css";

// Archivo's width axis gives the expanded, engineered display voice.
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], axes: ["wdth"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} — ${SITE.tagline}`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  openGraph: { siteName: SITE.name, type: "website", locale: "en_IN" },
};

export const viewport: Viewport = {
  themeColor: "#070708",
  colorScheme: "dark light",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Who is logged in (signed cookie) + their follows / likes / saves, for every page.
  const snapshot = sessionSnapshot(await getViewer());
  return (
    <html lang="en-IN" data-theme="night" suppressHydrationWarning className={`${archivo.variable} ${inter.variable} ${mono.variable} antialiased`}>
      <head>
        {/* Applies the saved theme before first paint — no flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-dvh">
        <SessionProvider snapshot={snapshot}>
          {children}
          <CommandPalette />
        </SessionProvider>
      </body>
    </html>
  );
}
