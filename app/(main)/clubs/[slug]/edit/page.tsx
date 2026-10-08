import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RequireAccount } from "@/components/auth/RequireAccount";
import { FormPage } from "@/components/me/FormPage";
import { getViewer } from "@/lib/auth";
import { ClubForm } from "@/components/studio/Forms";
import { getClub } from "@/lib/data";
import { clubDraft } from "@/lib/drafts";
import { cityOptions } from "@/lib/options";
import { isClubAdmin } from "@/lib/permissions";
import { readDb } from "@/lib/store";

export const metadata: Metadata = { title: "Edit club", robots: { index: false } };

export default async function EditClubPage({ params }: PageProps<"/clubs/[slug]/edit">) {
  const viewer = await getViewer();
  if (!viewer) return <RequireAccount what="edit this club" />;
  const c = getClub((await params).slug);
  if (!c || !isClubAdmin(readDb(), c, viewer)) notFound();
  return (
    <FormPage eyebrow="Club admin" title={c.name} back={{ href: `/clubs/${c.slug}/manage`, label: "Manage club" }}>
      <ClubForm cities={cityOptions()} initial={clubDraft(c)} />
    </FormPage>
  );
}
