import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RequireAccount } from "@/components/auth/RequireAccount";
import { FormPage } from "@/components/me/FormPage";
import { getViewer } from "@/lib/auth";
import { ProfileForm } from "@/components/studio/Forms";
import { getOwner } from "@/lib/data";
import { profileDraft } from "@/lib/drafts";
import { cityOptions } from "@/lib/options";

export const metadata: Metadata = { title: "Edit profile", robots: { index: false } };

export default async function EditProfilePage() {
  const viewer = await getViewer();
  if (!viewer?.handle) return <RequireAccount what="edit your profile" />;
  const profile = getOwner(viewer.handle);
  if (!profile) notFound();
  return (
    <FormPage eyebrow="Your profile" title="Edit profile" intro="Your one personal profile. Choose who can see your name, photo and city.">
      <ProfileForm cities={cityOptions()} initial={profileDraft(profile)} />
    </FormPage>
  );
}
