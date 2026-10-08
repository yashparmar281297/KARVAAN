import type { Metadata } from "next";
import { RequireAccount } from "@/components/auth/RequireAccount";
import { FormPage } from "@/components/me/FormPage";
import { NeedsCapability } from "@/components/auth/NeedsCapability";
import { getViewer } from "@/lib/auth";
import { garageKinds } from "@/lib/capabilities";
import { VehicleForm } from "@/components/studio/Forms";
import { myClubOptions } from "@/lib/options";

export const metadata: Metadata = { title: "Add a vehicle", robots: { index: false } };

export default async function NewVehiclePage() {
  const viewer = await getViewer();
  if (!viewer?.handle) return <RequireAccount what="add a vehicle to your garage" />;
  const kinds = viewer.admin ? (["car", "bike"] as const) : garageKinds(viewer.capabilities);
  if (!kinds.length) return <NeedsCapability what="create your garage" options={["supercar-owner", "superbike-owner", "custom-owner"]} next="/me/vehicles/new" />;
  return (
    <FormPage eyebrow="My garage" title="Add a vehicle" intro="Each vehicle gets its own page, linked to your profile. Its category is worked out from the make and model — change it if needed.">
      <VehicleForm clubs={myClubOptions(viewer)} kinds={[...kinds]} />
    </FormPage>
  );
}
