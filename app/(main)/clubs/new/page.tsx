import type { Metadata } from "next";
import { RequireAccount } from "@/components/auth/RequireAccount";
import { FormPage } from "@/components/me/FormPage";
import { NeedsCapability } from "@/components/auth/NeedsCapability";
import { getViewer } from "@/lib/auth";
import { canCreateClub } from "@/lib/capabilities";
import { ClubForm } from "@/components/studio/Forms";
import { cityOptions } from "@/lib/options";

export const metadata: Metadata = { title: "Create a club", robots: { index: false } };

export default async function NewClubPage() {
  const viewer = await getViewer();
  if (!viewer) return <RequireAccount what="create a club" />;
  if (!viewer.admin && !canCreateClub(viewer.capabilities)) return <NeedsCapability what="create a club" options={["club-organizer"]} next="/clubs/new" />;
  return (
    <FormPage eyebrow="Clubs" title="Create a club" back={{ href: "/clubs", label: "Clubs" }} intro="A club is its own page — not you. You become its admin: approve members, add other admins and host club events.">
      <ClubForm cities={cityOptions()} />
    </FormPage>
  );
}
