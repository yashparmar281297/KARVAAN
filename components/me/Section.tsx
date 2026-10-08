import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "../ui/Icon";

/** One block of the dashboard ("My garage", "Manage events", …). */
export function MeSection({ id, title, count, action, children }: { id: string; title: string; count?: number; action?: { href: string; label: string }; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-line pt-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="display text-[1.5rem] leading-none">
          {title}
          {count !== undefined && <span className="readout ml-3 text-base text-mute">{count}</span>}
        </h2>
        {action && (
          <Link href={action.href} className="btn btn-ghost chamfer !h-10">
            <Icon name="plus" size={14} /> {action.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
