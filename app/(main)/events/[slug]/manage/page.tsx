import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RequireAccount } from "@/components/auth/RequireAccount";
import { DeleteButton } from "@/components/me/Buttons";
import { CheckInByRef, CheckInToggle, StatusToggle } from "@/components/me/EventTools";
import { FormPage } from "@/components/me/FormPage";
import { Icon } from "@/components/ui/Icon";
import { getViewer } from "@/lib/auth";
import { eventHost, getAnyEvent } from "@/lib/data";
import { inr } from "@/lib/format";
import { canManageEvent } from "@/lib/permissions";
import { SITE } from "@/lib/site";
import { readDb } from "@/lib/store";

export const metadata: Metadata = { title: "Manage event", robots: { index: false } };

/** Organiser dashboard for one event — organiser / hosting-club admins / site admin only. */
export default async function ManageEventPage({ params }: PageProps<"/events/[slug]/manage">) {
  const viewer = await getViewer();
  if (!viewer) return <RequireAccount what="manage this event" />;
  const e = getAnyEvent((await params).slug);
  const db = readDb();
  if (!e || !canManageEvent(db, e, viewer)) notFound();
  const regs = db.registrations.filter((r) => r.event === e.slug).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const priceOf = (id: string) => e.tickets.find((t) => t.id === id)?.price ?? 0;
  const people = regs.reduce((n, r) => n + r.tickets.reduce((m, t) => m + t.qty, 0), 0);
  const revenue = regs.reduce((n, r) => n + r.tickets.reduce((m, t) => m + priceOf(t.id) * t.qty, 0), 0);
  const fees = Math.round(revenue * (SITE.platformFeePct / 100));
  const checked = regs.filter((r) => r.checkedIn).length;
  const status = e.status ?? "published";
  const past = e.date < new Date().toISOString();
  const host = eventHost(e);

  return (
    <FormPage eyebrow={`Manage event · ${status === "draft" ? "Draft" : past ? "Past" : "Upcoming"}`} title={e.title} back={{ href: "/me#manage-events", label: "My account" }}>
      <p className="-mt-6 text-sm text-silver">
        {e.date.slice(0, 10)} · {e.venue} · Organised by {host.personName ?? "you"}
        {host.club ? ` for ${host.club.name}` : ""}
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <StatusToggle slug={e.slug} status={status} />
        <Link href={`/events/${e.slug}/edit`} className="btn btn-ghost chamfer">
          <Icon name="wrench" size={14} /> Edit event
        </Link>
        <Link href={`/events/${e.slug}`} className="btn btn-ghost chamfer">
          View page
        </Link>
        <DeleteButton kind="event" id={e.slug} name={e.title} />
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-px bg-line hairline sm:grid-cols-4">
        {[
          ["Registrations", String(regs.length)],
          ["Participants", String(people)],
          ["Checked in", `${checked}/${regs.length}`],
          ["Revenue", inr(revenue)],
        ].map(([k, v]) => (
          <div key={k} className="bg-ink p-4">
            <dd className="readout text-2xl">{v}</dd>
            <dt className="label mt-1 !text-[9.5px]">{k}</dt>
          </div>
        ))}
      </dl>
      {revenue > 0 && (
        <p className="mt-2 text-xs text-mute">
          Buyers also paid {inr(fees)} in platform fees ({SITE.platformFeePct}%) — not part of your revenue. Payments are a demo in test mode.
        </p>
      )}

      <section className="mt-10">
        <p className="label mb-3">Ticket sales</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {e.tickets.map((t) => (
            <li key={t.id} className="flex items-center justify-between rounded-[3px] bg-graphite p-3 text-sm hairline">
              <span>
                {t.name} · {t.price ? inr(t.price) : "Free"}
              </span>
              <span className="readout">
                {t.sold}
                {t.total !== undefined ? ` / ${t.total}` : ""} sold
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <CheckInByRef slug={e.slug} />
      </section>

      <section className="mt-10">
        <p className="label mb-3">Participants · contact details are visible only to organisers</p>
        {regs.length ? (
          <ul className="divide-y divide-line border-y border-line">
            {regs.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ivory">
                    {r.name} <span className="label !text-[9px]">· {r.tickets.map((t) => `${t.qty}× ${e.tickets.find((x) => x.id === t.id)?.name ?? t.id}`).join(", ")}</span>
                  </p>
                  <p className="label mt-1 !text-[9px] normal-case !tracking-normal">
                    {r.phone} · {r.email}
                    {r.vehicleReg ? ` · ${r.vehicleReg}` : ""} · Ref {r.id}
                  </p>
                </div>
                <CheckInToggle slug={e.slug} id={r.id} checked={!!r.checkedIn} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-silver">No registrations yet.</p>
        )}
      </section>
    </FormPage>
  );
}
