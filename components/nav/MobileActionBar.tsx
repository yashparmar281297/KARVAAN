import type { ReactNode } from "react";

/**
 * Page actions on phones/tablets (e.g. "Owner's garage", "Reserve"). Fixed
 * flush to the bottom edge, full width, so it never floats or drifts while scrolling.
 */
export function MobileActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-carbon/95 px-3 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-md items-center gap-2">{children}</div>
    </div>
  );
}
