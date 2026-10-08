"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactNode } from "react";
import { useLoginHref, useSession } from "@/lib/session";
import { Icon } from "../ui/Icon";

/** Renders children only for a signed-in user; otherwise a login prompt. */
export function RequireLogin({ children, what = "this page" }: { children: ReactNode; what?: string }) {
  const session = useSession();
  const loginLink = useLoginHref();
  // Avoid flashing the prompt before the stored session is read.
  const ready = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  if (!ready) return <div className="min-h-[60svh]" />;
  if (session) return <>{children}</>;
  return (
    <section className="container-x flex min-h-[70svh] flex-col items-start justify-center pt-28">
      <p className="label flex items-center gap-2 text-ember">
        <Icon name="lock" size={13} /> Members only
      </p>
      <h1 className="display mt-4 text-[clamp(2.2rem,min(6vw,7.8svh),4rem)]">Log in to see {what}</h1>
      <p className="mt-4 max-w-md text-silver">Following, likes, your garage and club tools are available once you&apos;re logged in.</p>
      <Link href={loginLink} className="btn btn-primary chamfer mt-8">
        Log in <Icon name="arrow" size={15} />
      </Link>
    </section>
  );
}
