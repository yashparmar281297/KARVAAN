import type { Metadata } from "next";
import Link from "next/link";
import { EventDiscovery } from "@/components/directory/EventDiscovery";
import { Icon } from "@/components/ui/Icon";
import { PageIntro } from "@/components/ui/PageIntro";
import { brands, cities, clubs, eventHost, getRoute, upcomingEvents } from "@/lib/data";

export const metadata: Metadata = {
  title: "Car & bike events in India",
  description: "Drives, rides, meetups, track days and concours across India. Book in two taps.",
};

export default async function EventsPage({ searchParams }: PageProps<"/events">) {
  const { category } = await searchParams;
  const events = upcomingEvents();
  // Organiser name + route for each card (the cards render in the browser, which has no database).
  const meta = Object.fromEntries(
    events.map((e) => {
      const r = e.route ? getRoute(e.route) : undefined;
      return [e.slug, { host: eventHost(e).name, route: r ? { from: r.from, to: r.to } : undefined }];
    }),
  );
  return (
    <>
      <PageIntro eyebrow={`${events.length} upcoming`} title={["Events", "& drives"]} blurb="Dawn drives, rides, night meets, track days and concours. Every drive and ride comes with its route. Filter by city, date, club or brand — and book in two taps." image={events[0]?.cover ?? clubs[0]?.hero}>
        <Link href="/events/new" className="btn btn-ghost chamfer mt-8">
          <Icon name="plus" size={15} /> Host an event
        </Link>
      </PageIntro>
      <section className="container-x">
        <EventDiscovery events={events} meta={meta} cities={cities} clubs={clubs} brands={brands} initialCategory={typeof category === "string" ? category : ""} />
      </section>
    </>
  );
}
