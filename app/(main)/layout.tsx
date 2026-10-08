import { Footer } from "@/components/nav/Footer";
import { SiteHeader } from "@/components/nav/SiteHeader";
import "@/lib/store";

// Content comes from the local test database and changes as you upload — render per request.
export const dynamic = "force-dynamic";

/** Site chrome: header, footer and mobile nav. */
export default function MainLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <a href="#main" className="label sr-only z-[90] bg-ivory px-4 py-3 !text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
