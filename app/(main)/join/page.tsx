import type { Metadata } from "next";
import { JoinFlow } from "@/components/flows/JoinFlow";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { readDb } from "@/lib/store";
import { cities } from "@/lib/data";

export const metadata: Metadata = { title: "Join the community", robots: { index: false } };

/** Join the community — create your free account (then choose what describes you). */
export default async function JoinPage({ searchParams }: PageProps<"/join">) {
  const sp = await searchParams;
  const viewer = await getViewer();
  // Capabilities are chosen once — an account that has answered goes to My account.
  if (viewer?.id && readDb().users.find((u) => u.id === viewer.id)?.onboarded) redirect("/me");
  const next = typeof sp.next === "string" ? sp.next : undefined;
  const reason = typeof sp.reason === "string" ? sp.reason : undefined;
  const cityOptions = cities.map((c) => ({ value: c.slug, label: c.name })).sort((a, b) => a.label.localeCompare(b.label));
  return (
    <section className="container-x flex min-h-[100svh] items-start justify-center pb-16 pt-24 md:pt-32">
      <JoinFlow next={next} reason={reason} cities={cityOptions} signedIn={!!viewer?.id} />
    </section>
  );
}
