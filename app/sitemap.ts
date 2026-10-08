import type { MetadataRoute } from "next";
import { businesses, clubs, events, owners, vehicles } from "@/lib/data";
import { SITE } from "@/lib/site";
import "@/lib/store";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const u = (path: string, priority = 0.6) => ({ url: `${SITE.url}${path}`, priority });
  return [
    u("/", 1),
    ...["/explore", "/cars", "/bikes", "/clubs", "/events", "/businesses"].map((p) => u(p, 0.8)),
    ...vehicles.map((v) => u(`/vehicles/${v.slug}`)),
    // Only public owners are indexable.
    ...owners.filter((o) => o.privacy === "public").map((o) => u(`/owners/${o.handle}`, 0.5)),
    ...clubs.map((c) => u(`/clubs/${c.slug}`, 0.7)),
    ...events.map((e) => u(`/events/${e.slug}`, 0.8)),
    ...businesses.map((b) => u(`/businesses/${b.slug}`)),
  ];
}
