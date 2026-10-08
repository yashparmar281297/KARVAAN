import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RequireAccount } from "@/components/auth/RequireAccount";
import { FormPage } from "@/components/me/FormPage";
import { getViewer } from "@/lib/auth";
import { garageKinds } from "@/lib/capabilities";
import { VehicleForm } from "@/components/studio/Forms";
import { getAnyVehicle } from "@/lib/data";
import { vehicleDraft } from "@/lib/drafts";
import { myClubOptions } from "@/lib/options";
import { canEditVehicle } from "@/lib/permissions";

export const metadata: Metadata = { title: "Edit vehicle", robots: { index: false } };

export default async function EditVehiclePage({ params }: PageProps<"/me/vehicles/[slug]/edit">) {
  const viewer = await getViewer();
  if (!viewer) return <RequireAccount what="edit your vehicle" />;
  const v = getAnyVehicle((await params).slug);
  if (!v || !canEditVehicle(v, viewer)) notFound();
  return (
    <FormPage eyebrow="My garage" title={`${v.make} ${v.model}`}>
      <VehicleForm clubs={myClubOptions(viewer)} initial={vehicleDraft(v)} kinds={viewer.admin ? ["car", "bike"] : garageKinds(viewer.capabilities)} />
    </FormPage>
  );
}
