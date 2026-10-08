"use client";

import Link from "next/link";
import { useLoginHref } from "@/lib/session";
import { Icon } from "../ui/Icon";

/**
 * The login wall for creating / interacting. Browsing never needs an account;
 * this appears only when someone tries to act. Both buttons bring them back to
 * this page afterwards.
 */
export function RequireAccount({ what = "continue" }: { what?: string }) {
  const join = useLoginHref(); // /join?next=<this page>
  const login = join.replace("/join?", "/login?");
  return (
    <section className="container-x flex min-h-[70svh] flex-col items-start justify-center pt-24">
      <p className="label flex items-center gap-2 text-ember">
        <Icon name="lock" size={13} /> Free account
      </p>
      <h1 className="display mt-4 text-[clamp(2rem,min(6vw,7.8svh),3.6rem)]">Create your free account to {what}</h1>
      <p className="mt-4 max-w-md text-silver">Browsing is always open. An account lets you follow, like, save, join clubs, register for events and add your own garage — one account for everything you do.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={join} className="btn btn-primary chamfer">
          Create free account <Icon name="arrow" size={15} />
        </Link>
        <Link href={login} className="btn btn-ghost chamfer">
          I have an account
        </Link>
      </div>
    </section>
  );
}
