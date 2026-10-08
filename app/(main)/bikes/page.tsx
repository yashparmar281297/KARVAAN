import type { Metadata } from "next";
import { VehicleCollection } from "@/components/directory/VehicleCollection";
import { PageIntro } from "@/components/ui/PageIntro";
import { cardProps, cities, vehicles } from "@/lib/data";

export const metadata: Metadata = {
  title: "Bikes — superbikes, cruisers & street",
  description: "India's owner-ridden motorcycle collection: litre-class superbikes, cruisers and street bikes.",
};

export default async function BikesPage({ searchParams }: PageProps<"/bikes">) {
  const { class: cls } = await searchParams;
  const cards = vehicles.filter((v) => v.kind === "bike").map((v) => cardProps(v));
  return (
    <>
      <PageIntro eyebrow={`${cards.length} bikes in the collection`} title={["The bike", "collection"]} blurb="Superbikes, thumpers and V-twins — and the riders who pilot them." image={vehicles.find((v) => v.kind === "bike")?.image} />
      <section className="container-x">
        <VehicleCollection cards={cards} cityNames={Object.fromEntries(cities.map((c) => [c.slug, c.name]))} initialClass={typeof cls === "string" ? cls : ""} />
      </section>
    </>
  );
}
