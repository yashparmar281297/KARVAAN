import Link from "next/link";
import { capLabel } from "@/lib/capabilities";
import { Icon } from "../ui/Icon";

/**
 * Shown when someone tries to create something their account doesn't cover.
 * What describes a person is chosen once, at sign-up, and can't be changed.
 */
export function NeedsCapability({ what, options }: { what: string; options: string[]; next?: string }) {
  const names = options.map(capLabel);
  const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} or ${names.at(-1)}` : names[0];
  return (
    <section className="container-x flex min-h-[70svh] flex-col items-start justify-center pt-24">
      <p className="label flex items-center gap-2 text-ember">
        <Icon name="lock" size={13} /> Not available for your account
      </p>
      <h1 className="display mt-4 text-[clamp(2rem,min(6vw,7.8svh),3.4rem)]">Only {list} accounts can {what}</h1>
      <p className="mt-4 max-w-md text-silver">What describes you is chosen once, when the account is created, and can&apos;t be changed later. You can still follow, like, save, join clubs and register for events.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/me" className="btn btn-primary chamfer">
          My account <Icon name="arrow" size={15} />
        </Link>
        <Link href="/explore" className="btn btn-ghost chamfer">
          Explore
        </Link>
      </div>
    </section>
  );
}
