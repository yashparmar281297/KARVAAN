import type { Metadata } from "next";
import { VehicleCollection } from "@/components/directory/VehicleCollection";
import { PageIntro } from "@/components/ui/PageIntro";
import { cardProps, cities, vehicles } from "@/lib/data";

export const metadata: Metadata = {
  title: "Cars — supercars, sleepers, JDM & classics",
  description: "India's owner-driven car collection: supercars, performance, JDM, classics and off-roaders.",
};

export default async function CarsPage({ searchParams }: PageProps<"/cars">) {
  const { class: cls } = await searchParams;
  const cards = vehicles.filter((v) => v.kind === "car").map((v) => cardProps(v));
  return (
    <>
      <PageIntro eyebrow={`${cards.length} cars in the collection`} title={["The car", "collection"]} blurb="Every card is a real car with a real owner — flip it to meet them. Owners choose how much of themselves you see." image={vehicles.find((v) => v.kind === "car" && !v.image.endsWith(".svg"))?.image} />
      <section className="container-x">
        <VehicleCollection cards={cards} cityNames={Object.fromEntries(cities.map((c) => [c.slug, c.name]))} initialClass={typeof cls === "string" ? cls : ""} />
      </section>
    </>
  );
}
