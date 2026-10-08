import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

/**
 * Floating "Edit" / "Manage" button for whoever may change this page — the
 * owner, a club admin or the event organiser. (The site admin gets AdminEdit.)
 */
export function OwnerEdit({ href, label = "Edit", show }: { href: string; label?: string; show: boolean }) {
  if (!show) return null;
  return (
    <Link href={href} className="btn btn-primary chamfer fixed bottom-[calc(76px+env(safe-area-inset-bottom))] left-4 z-40 !h-11 shadow-[0_20px_40px_-12px_#000] lg:bottom-6 lg:left-6">
      <Icon name="wrench" size={14} /> {label}
    </Link>
  );
}
