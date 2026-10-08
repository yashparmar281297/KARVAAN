import type { Metadata } from "next";
import { ClubDirectory } from "@/components/directory/ClubDirectory";
import { PageIntro } from "@/components/ui/PageIntro";
import { cities, clubs, states } from "@/lib/data";

export const metadata: Metadata = {
  title: "Car & bike clubs in India",
  description: "Supercar, superbike, JDM, classic and modification clubs across India, by state and city.",
};

export default async function ClubsPage({ searchParams }: PageProps<"/clubs">) {
  const { category } = await searchParams;
  return (
    <>
      <PageIntro eyebrow="Club directory" title={["Find your", "people"]} blurb="Every club, state by state and city by city. Verified clubs have confirmed organisers and a track record of events." image={clubs[0]?.hero} />
      <section className="container-x">
        <ClubDirectory clubs={clubs} cities={cities} states={states} initialCategory={typeof category === "string" ? category : ""} />
      </section>
    </>
  );
}
