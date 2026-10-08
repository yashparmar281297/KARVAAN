import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RequireAccount } from "@/components/auth/RequireAccount";
import { MemberActions } from "@/components/club/MemberActions";
import { FormPage } from "@/components/me/FormPage";
import { Icon } from "@/components/ui/Icon";
import { getViewer } from "@/lib/auth";
import { cityName, getClub } from "@/lib/data";
import { isClubAdmin } from "@/lib/permissions";
import { readDb } from "@/lib/store";

export const metadata: Metadata = { title: "Manage club", robots: { index: false } };

/**
 * Club admin tools: approve / reject join requests, remove members, add or
 * remove admins, edit the club, host club events. Admins only.
 */
export default async function ManageClubPage({ params }: PageProps<"/clubs/[slug]/manage">) {
  const viewer = await getViewer();
  if (!viewer) return <RequireAccount what="manage this club" />;
  const c = getClub((await params).slug);
  const db = readDb();
  if (!c || !isClubAdmin(db, c, viewer)) notFound();
  const rows = db.memberships
    .filter((m) => m.club === c.slug && m.status !== "rejected")
    .map((m) => {
      const user = db.users.find((u) => u.id === m.userId);
      const profile = user ? db.owners.find((o) => o.handle === user.handle) : undefined;
      const garage = profile ? db.vehicles.filter((v) => v.owner === profile.handle) : [];
      return { m, user, profile, garage };
    })
    .filter((r) => r.user);
  const pending = rows.filter((r) => r.m.status === "pending");
  const members = rows.filter((r) => r.m.status === "approved");
  const isAdminRow = (userId: string) => c.admins.includes(userId);

  const Person = ({ r }: { r: (typeof rows)[number] }) => (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <span className="relative aspect-[4/5] w-10 shrink-0 overflow-hidden rounded-[2px] bg-charcoal">{r.profile && <Image src={r.profile.portrait} alt="" fill sizes="40px" className="object-cover" />}</span>
      <span className="min-w-0">
        {r.profile ? (
          <Link href={`/owners/${r.profile.handle}`} className="block truncate text-sm text-ivory hover:underline">
            {r.user!.name}
          </Link>
        ) : (
          <span className="block truncate text-sm text-ivory">{r.user!.name}</span>
        )}
        <span className="label mt-0.5 block truncate !text-[9px]">
          {r.profile?.city ? cityName(r.profile.city) : "—"} · {r.garage.length} in garage
          {r.garage[0] ? ` · ${r.garage.map((v) => `${v.make} ${v.model}`).slice(0, 2).join(", ")}` : ""}
        </span>
        {r.m.message && <span className="mt-1 block text-xs text-silver">“{r.m.message}”</span>}
      </span>
    </div>
  );

  return (
    <FormPage eyebrow="Club admin" title={c.name} back={{ href: `/clubs/${c.slug}`, label: "Club page" }}>
      <div className="-mt-4 flex flex-wrap gap-2">
        <Link href={`/clubs/${c.slug}/edit`} className="btn btn-ghost chamfer">
          <Icon name="wrench" size={14} /> Edit club
        </Link>
        <Link href={`/events/new?club=${c.slug}`} className="btn btn-primary chamfer">
          <Icon name="plus" size={14} /> Create club event
        </Link>
      </div>
      <p className="mt-4 text-sm text-silver">
        Joining: {(c.joinPolicy ?? "approval") === "open" ? "anyone can join instantly" : "you approve each member"} · {c.isPrivate ? "Private — member list hidden from non-members" : "Public club"}
      </p>

      <section className="mt-10">
        <p className="label mb-3">
          Join requests <span className="readout text-ivory">{pending.length}</span>
        </p>
        {pending.length ? (
          <ul className="divide-y divide-line border-y border-line">
            {pending.map((r) => (
              <li key={r.m.id} className="flex flex-wrap items-center gap-3 py-3">
                <Person r={r} />
                <MemberActions slug={c.slug} id={r.m.id} actions={["approve", "reject"]} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-silver">No requests waiting.</p>
        )}
      </section>

      <section className="mt-10">
        <p className="label mb-3">
          Members <span className="readout text-ivory">{members.length}</span>
        </p>
        {members.length ? (
          <ul className="divide-y divide-line border-y border-line">
            {members.map((r) => (
              <li key={r.m.id} className="flex flex-wrap items-center gap-3 py-3">
                <Person r={r} />
                {isAdminRow(r.m.userId) && <span className="chip shrink-0">Admin</span>}
                <MemberActions slug={c.slug} id={r.m.id} actions={isAdminRow(r.m.userId) ? ["remove-admin"] : ["make-admin", "remove"]} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-silver">No members on KARVAAN yet.</p>
        )}
      </section>
    </FormPage>
  );
}
