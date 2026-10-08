// What each capability lets a person do. One account can hold several; they
// are chosen once at sign-up ("What describes you?") and can't be changed.
// Checked on the server for every create action, and used by the UI to show
// only what the person can do.
import type { Capability, VehicleKind } from "./types";

export const CAPABILITIES: { id: Capability; label: string; hint: string }[] = [
  { id: "enthusiast", label: "Automotive enthusiast", hint: "Follow, like, save and attend events — no vehicle needed." },
  { id: "supercar-owner", label: "Supercar owner", hint: "Create your garage and add your cars." },
  { id: "superbike-owner", label: "Superbike owner", hint: "Create your garage and add your bikes." },
  { id: "custom-owner", label: "Custom mods · cars or bikes", hint: "Garage for your modified cars and bikes." },
  { id: "club-organizer", label: "Club organizer", hint: "Create and run clubs, approve members, create events." },
  { id: "event-organizer", label: "Event organizer", hint: "Create and manage drives, rides, meets and track days." },
  { id: "business", label: "Automotive business", hint: "List your business and services; get followers and reviews." },
];

/** Capabilities a person can pick (club-member is earned by joining a club). */
export const SELECTABLE = CAPABILITIES.map((c) => c.id);

export const capLabel = (c: string) => CAPABILITIES.find((x) => x.id === c)?.label ?? (c === "club-member" ? "Club member" : c === "car-owner" ? "Car owner" : c === "bike-owner" ? "Bike owner" : c);

type Caps = readonly string[];

/** Which kinds of vehicle the person may add to a garage. */
export function garageKinds(caps: Caps): VehicleKind[] {
  const car = caps.some((c) => c === "supercar-owner" || c === "custom-owner" || c === "car-owner");
  const bike = caps.some((c) => c === "superbike-owner" || c === "custom-owner" || c === "bike-owner");
  return [...(car ? (["car"] as const) : []), ...(bike ? (["bike"] as const) : [])];
}

export const hasGarage = (caps: Caps) => garageKinds(caps).length > 0;
export const canCreateClub = (caps: Caps) => caps.includes("club-organizer");
/** Event organisers — and club organisers, who can create any event. */
export const canCreateEvent = (caps: Caps) => caps.includes("event-organizer") || caps.includes("club-organizer");
export const canCreateBusiness = (caps: Caps) => caps.includes("business");
