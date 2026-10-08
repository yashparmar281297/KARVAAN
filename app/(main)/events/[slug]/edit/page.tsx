import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RequireAccount } from "@/components/auth/RequireAccount";
import { FormPage } from "@/components/me/FormPage";
import { getViewer } from "@/lib/auth";
import { EventBuilder } from "@/components/flows/EventBuilder";
import { getAnyEvent, getOwner, getRoute } from "@/lib/data";
import { eventDraft } from "@/lib/drafts";
import { cityOptions, hostOptions } from "@/lib/options";
import { canManageEvent } from "@/lib/permissions";
import { readDb } from "@/lib/store";

export const metadata: Metadata = { title: "Edit event", robots: { index: false } };

export default async function EditEventPage({ params }: PageProps<"/events/[slug]/edit">) {
  const viewer = await getViewer();
  if (!viewer) return <RequireAccount what="edit this event" />;
  const e = getAnyEvent((await params).slug);
  if (!e || !canManageEvent(readDb(), e, viewer)) notFound();
  const hosts = hostOptions(viewer, (viewer.handle && getOwner(viewer.handle)?.city) || e.city);
  // Keep the current host selectable even if the editor isn't its admin (e.g. site admin).
  if (e.organizer && !hosts.some((h) => h.slug === e.organizer)) hosts.push({ slug: e.organizer, name: `${readDb().clubs.find((c) => c.slug === e.organizer)?.name ?? e.organizer} (club event)`, city: e.city });
  if (!e.organizer && !hosts.some((h) => h.slug === "me")) hosts.unshift({ slug: "me", name: "Personal event", city: e.city });
  return (
    <FormPage eyebrow="Manage event" title={e.title} back={{ href: `/events/${e.slug}/manage`, label: "Manage event" }}>
      <div className="-mt-14">
        <EventBuilder hosts={hosts} initialHost={e.organizer ?? "me"} cities={cityOptions().map((c) => ({ slug: c.value, name: c.label }))} initial={eventDraft(e, e.route ? getRoute(e.route) : undefined)} />
      </div>
    </FormPage>
  );
}
