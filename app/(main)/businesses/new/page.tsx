import type { Metadata } from "next";
import { RequireAccount } from "@/components/auth/RequireAccount";
import { FormPage } from "@/components/me/FormPage";
import { NeedsCapability } from "@/components/auth/NeedsCapability";
import { getViewer } from "@/lib/auth";
import { canCreateBusiness } from "@/lib/capabilities";
import { BusinessForm } from "@/components/studio/Forms";
import { cityOptions } from "@/lib/options";

export const metadata: Metadata = { title: "List a business", robots: { index: false } };

export default async function NewBusinessPage() {
  const viewer = await getViewer();
  if (!viewer) return <RequireAccount what="list a business" />;
  if (!viewer.admin && !canCreateBusiness(viewer.capabilities)) return <NeedsCapability what="list a business" options={["business"]} next="/businesses/new" />;
  return (
    <FormPage eyebrow="Businesses" title="List a business" back={{ href: "/businesses", label: "Businesses" }} intro="The business gets its own profile, separate from yours — you manage it from your account.">
      <BusinessForm cities={cityOptions()} />
    </FormPage>
  );
}
