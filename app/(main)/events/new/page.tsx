import type { Metadata } from "next";
import { RequireAccount } from "@/components/auth/RequireAccount";
import { FormPage } from "@/components/me/FormPage";
import { NeedsCapability } from "@/components/auth/NeedsCapability";
import { getViewer } from "@/lib/auth";
import { canCreateEvent } from "@/lib/capabilities";
import { EventBuilder } from "@/components/flows/EventBuilder";
import { getOwner } from "@/lib/data";
import { cityOptions, hostOptions } from "@/lib/options";

export const metadata: Metadata = { title: "Create an event", robots: { index: false } };

/** Event organisers (and club organisers) can create events — no car, bike or club needed. */
export default async function NewEventPage({ searchParams }: PageProps<"/events/new">) {
  const viewer = await getViewer();
  if (!viewer) return <RequireAccount what="create an event" />;
  if (!viewer.admin && !canCreateEvent(viewer.capabilities)) return <NeedsCapability what="create an event" options={["event-organizer", "club-organizer"]} next="/events/new" />;
  const { club } = await searchParams;
  const hosts = hostOptions(viewer, (viewer.handle && getOwner(viewer.handle)?.city) || "");
  const initialHost = typeof club === "string" && hosts.some((h) => h.slug === club) ? club : hosts[0]?.slug ?? "me";
  return (
    <FormPage eyebrow="Events" title="Create an event" back={{ href: "/events", label: "Events" }} intro="Drives, rides, meets, track days, exhibitions. Drives and rides get a route; tickets can be free or paid, with or without a slot limit. Save a draft or publish now.">
      <div className="-mt-14">
        <EventBuilder hosts={hosts} initialHost={initialHost} cities={cityOptions().map((c) => ({ slug: c.value, name: c.label }))} />
      </div>
    </FormPage>
  );
}
