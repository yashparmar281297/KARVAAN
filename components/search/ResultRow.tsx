import Image from "next/image";
import type { SearchKind, SearchResult } from "@/lib/types";
import { Icon, type IconName } from "../ui/Icon";

export const KIND_LABEL: Record<SearchKind, string> = {
  vehicle: "Vehicles",
  owner: "Owners",
  club: "Clubs",
  event: "Events",
  business: "Businesses",
};

export const KIND_ONE: Record<SearchKind, string> = {
  vehicle: "Vehicle",
  owner: "Owner",
  club: "Club",
  event: "Event",
  business: "Business",
};

export const KIND_ICON: Record<SearchKind, IconName> = {
  vehicle: "gauge",
  owner: "user",
  club: "users",
  event: "calendar",
  business: "shield",
};

/** Places to jump to straight from an empty search. */
export const BROWSE: { href: string; label: string; icon: IconName }[] = [
  { href: "/cars", label: "Cars", icon: "gauge" },
  { href: "/bikes", label: "Bikes", icon: "bolt" },
  { href: "/clubs", label: "Clubs", icon: "users" },
  { href: "/events", label: "Events", icon: "calendar" },
  { href: "/businesses", label: "Businesses", icon: "shield" },
];

/** One search result: picture, name, details and what kind of thing it is. */
export function ResultBody({ r, active }: { r: SearchResult; active?: boolean }) {
  return (
    <>
      <span className={`relative h-14 w-14 shrink-0 overflow-hidden bg-charcoal ${r.kind === "owner" ? "rounded-full" : "rounded-[6px]"}`}>
        {r.image ? <Image src={r.image} alt="" fill sizes="56px" className="object-cover" /> : <Icon name={KIND_ICON[r.kind]} size={18} className="absolute inset-0 m-auto text-mute" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium text-ivory">{r.title}</span>
        <span className="mt-0.5 block truncate text-[13px] text-silver">{r.subtitle}</span>
      </span>
      <span className="label hidden shrink-0 rounded-full px-2 py-1 !text-[9px] text-mute hairline min-[400px]:inline">{KIND_ONE[r.kind]}</span>
      <Icon name="arrow" size={14} className={`shrink-0 transition ${active ? "text-ivory" : "text-mute"}`} />
    </>
  );
}
