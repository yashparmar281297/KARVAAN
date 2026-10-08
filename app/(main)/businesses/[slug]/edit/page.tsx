import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RequireAccount } from "@/components/auth/RequireAccount";
import { FormPage } from "@/components/me/FormPage";
import { getViewer } from "@/lib/auth";
import { BusinessForm } from "@/components/studio/Forms";
import { getBusiness } from "@/lib/data";
import { businessDraft } from "@/lib/drafts";
import { cityOptions } from "@/lib/options";
import { canManageBusiness } from "@/lib/permissions";

export const metadata: Metadata = { title: "Edit business", robots: { index: false } };

export default async function EditBusinessPage({ params }: PageProps<"/businesses/[slug]/edit">) {
  const viewer = await getViewer();
  if (!viewer) return <RequireAccount what="edit this business" />;
  const b = getBusiness((await params).slug);
  if (!b || !canManageBusiness(b, viewer)) notFound();
  return (
    <FormPage eyebrow="Manage business" title={b.name} back={{ href: `/businesses/${b.slug}`, label: b.name }}>
      <BusinessForm cities={cityOptions()} initial={businessDraft(b)} />
    </FormPage>
  );
}
