import type { Metadata } from "next";
import { BusinessDirectory } from "@/components/directory/BusinessDirectory";
import { PageIntro } from "@/components/ui/PageIntro";
import { businesses, cities } from "@/lib/data";

export const metadata: Metadata = {
  title: "Automotive businesses in India",
  description: "Detailing, PPF, ceramic coating, tuning, workshops, dealerships and rentals — rated by owners.",
};

export default async function BusinessesPage({ searchParams }: PageProps<"/businesses">) {
  const { category } = await searchParams;
  return (
    <>
      <PageIntro eyebrow="Directory" title={["Trusted by", "the garage"]} blurb="Detailers, tuners, workshops and dealers — rated by the owners whose cars they've worked on." image={businesses[0]?.cover} />
      <section className="container-x">
        <BusinessDirectory businesses={businesses} cities={cities} initialCategory={typeof category === "string" ? category : ""} />
      </section>
    </>
  );
}
