import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TicketFlow } from "@/components/event/TicketFlow";
import { Icon } from "@/components/ui/Icon";
import { RequireAccount } from "@/components/auth/RequireAccount";
import { getViewer } from "@/lib/auth";
import { cityName, eventHost, getAnyEvent, getRoute } from "@/lib/data";
import { canSeeEvent } from "@/lib/permissions";
import { readDb } from "@/lib/store";
import { SITE } from "@/lib/site";


export const metadata: Metadata = { title: "Tickets", robots: { index: false } };

export default async function RegisterPage({ params }: PageProps<"/events/[slug]/register">) {
  const e = getAnyEvent((await params).slug);
  const viewer = await getViewer();
  if (!e || !canSeeEvent(readDb(), e, viewer)) notFound();
  // Registering / buying tickets needs an account — you come straight back here after.
  if (!viewer?.id) return <RequireAccount what="register for this event" />;
  const route = e.route ? getRoute(e.route) : undefined;
  return (
    <section className="container-x pb-10 pt-28 md:pt-36">
      <div className="mx-auto max-w-3xl">
        <Link href={`/events/${e.slug}`} className="label flex items-center gap-2 text-silver hover:text-ivory">
          <Icon name="arrowLeft" size={13} /> {e.title}
        </Link>
        <h1 className="display mt-5 text-[clamp(2.2rem,min(6vw,7.8svh),4rem)]">Get tickets</h1>
        <p className="label mb-10 mt-3">{route ? `${route.from} → ${route.to}` : `${e.venue}`}</p>
      </div>
      <TicketFlow e={e} feePct={SITE.platformFeePct} organiser={eventHost(e).name} holder={viewer.name} routeLabel={route ? `${route.from} → ${route.to}` : cityName(e.city)} />
    </section>
  );
}
