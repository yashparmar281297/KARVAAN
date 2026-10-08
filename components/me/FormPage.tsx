import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "../ui/Icon";

/** Frame for a create / edit page (title, back link, the form). */
export function FormPage({ eyebrow, title, intro, back = { href: "/me", label: "My account" }, children }: { eyebrow: string; title: string; intro?: string; back?: { href: string; label: string }; children: ReactNode }) {
  return (
    <section className="container-x pb-16 pt-24 md:pt-32">
      <Link href={back.href} className="label flex items-center gap-2 text-silver hover:text-ivory">
        <Icon name="arrowLeft" size={13} /> {back.label}
      </Link>
      <p className="label mt-6 text-ember">{eyebrow}</p>
      <h1 className="display mt-3 text-[clamp(2.2rem,min(6vw,7.8svh),4.2rem)] [overflow-wrap:anywhere]">{title}</h1>
      {intro && <p className="mt-4 max-w-xl text-silver">{intro}</p>}
      <div className="mt-10">{children}</div>
    </section>
  );
}
