import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { isAdmin } from "@/lib/admin";

/** Floating "Edit" button on a detail page — rendered only for the logged-in admin. */
export async function AdminEdit({ tab, id }: { tab: "profile" | "vehicle" | "club" | "event" | "business"; id: string }) {
  if (!(await isAdmin())) return null;
  return (
    <Link
      href={`/studio?tab=${tab}&edit=${encodeURIComponent(id)}`}
      className="btn btn-primary chamfer fixed bottom-[calc(76px+env(safe-area-inset-bottom))] right-4 z-40 !h-11 shadow-[0_20px_40px_-12px_#000] lg:bottom-6 lg:right-6"
    >
      <Icon name="wrench" size={14} /> Edit
    </Link>
  );
}
