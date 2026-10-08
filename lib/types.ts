// Domain model. Mirrors supabase/schema.sql so the mock data layer in
// lib/data can be swapped for Supabase queries without touching the UI.

export type Privacy = "public" | "club" | "private";
export type VehicleKind = "car" | "bike";
export type VehicleClass =
  | "Supercar"
  | "Superbike"
  | "Performance"
  | "Luxury"
  | "JDM"
  | "Classic"
  | "Off-road"
  | "Cruiser"
  | "Street"
  | "Sleeper";

export interface State {
  code: string; // "MP"
  name: string;
}

export interface City {
  slug: string;
  name: string;
  state: string; // State.code
  rto: string; // "MP 09" — used as a collectible serial prefix on cards
}

/**
 * What a person does on the platform. One account can hold any mix of these;
 * they're chosen at sign-up and added automatically as the person acts
 * (adding a car → car-owner, creating an event → event-organizer, …).
 */
export type Capability =
  | "enthusiast"
  | "supercar-owner"
  | "superbike-owner"
  | "custom-owner" // custom / modified cars or bikes
  | "club-organizer"
  | "event-organizer"
  | "business"
  | "club-member" // earned by joining a club (not picked)
  | "car-owner" // legacy — treated like a car garage
  | "bike-owner"; // legacy — treated like a bike garage

/** One person = one account. The profile (Owner) is the person's public face. */
export interface User {
  id: string;
  name: string;
  /** Email or 10-digit mobile, normalised (lower-case email / digits only). */
  identifier: string;
  passwordHash: string; // scrypt, "salt:hash" hex
  capabilities: Capability[];
  /** Set once "What describes you?" is answered at sign-up — capabilities are then fixed. */
  onboarded?: boolean;
  handle: string; // Owner.handle of this person's profile
  createdAt: string;
}

/** A "kind:id" key — e.g. "club:malwa-supercar-club", "vehicle:…". */
export interface SocialRow {
  userId: string;
  key: string;
  createdAt: string;
}

export type MembershipStatus = "pending" | "approved" | "rejected";

/** Joining a club (≠ following it). Admin rows are approved members with role "admin". */
export interface Membership {
  id: string;
  club: string; // Club.slug
  userId: string;
  role: "member" | "admin";
  status: MembershipStatus;
  message?: string;
  createdAt: string;
}

/** Who can see a vehicle. */
export type Visibility = "public" | "club" | "followers" | "private";

export interface Owner {
  /** The account this profile belongs to (absent for admin-managed profiles). */
  userId?: string;
  handle: string;
  name: string;
  city: string; // City.slug — optional; "" when the owner hasn't set one
  portrait: string;
  bio: string;
  privacy: Privacy;
  joined: string; // ISO date
  clubs: string[]; // Club.slug
  instagram?: string;
  followers: number;
  following: number;
}

export interface Spec {
  engine: string;
  power: number; // hp
  /** Power is a lower bound ("1,600+ hp"). */
  powerPlus?: boolean;
  torque: number; // Nm
  transmission?: string;
  drivetrain: string;
  /** Best quarter-mile time, seconds. */
  quarterMile?: number;
  zeroToHundred?: number; // seconds
  topSpeed?: number; // km/h
}

export interface BuildStep {
  date?: string;
  title: string;
  detail: string;
}

export interface Vehicle {
  /** Who can see it (default public). Private vehicles stay in the owner's garage only. */
  visibility?: Visibility;
  /** Show "Private owner" instead of the owner's identity on this vehicle. */
  ownerHidden?: boolean;
  createdAt?: string;
  slug: string;
  serial: number; // collectible number shown on the card
  kind: VehicleKind;
  class: VehicleClass;
  make: string;
  model: string;
  variant?: string;
  /** Model year, when known. */
  year?: number;
  colour: string;
  image: string;
  gallery: string[];
  owner: string; // Owner.handle
  club?: string; // Club.slug
  city: string; // City.slug
  spec: Spec;
  mods: string[];
  history: BuildStep[];
  events: string[]; // Event.slug attended
  featured?: boolean;
  videos?: { title: string; poster: string; duration: string }[];
  /** Where published figures come from, shown under the spec sheet. */
  sources?: string[];
}

export type ClubCategory =
  | "Supercar"
  | "Superbike"
  | "Car"
  | "Bike"
  | "Modification"
  | "Classic"
  | "JDM"
  | "Performance";

export interface Club {
  slug: string;
  name: string;
  short: string; // monogram fallback when there's no logo
  logo?: string;
  tagline?: string;
  category: ClubCategory;
  kind: VehicleKind | "mixed";
  city: string;
  founded?: number;
  verified: boolean;
  hero: string;
  /** CSS object-position for the hero crop, e.g. "50% 80%". */
  heroFocus?: string;
  gallery: string[];
  about: string;
  members: number;
  vehicles: number;
  eventsHosted?: number;
  /** Member count is a lower bound ("15+"). */
  membersPlus?: boolean;
  /** Vehicle count is a lower bound ("35+"). */
  vehiclesPlus?: boolean;
  sponsor?: string; // Brand.slug
  socials: { instagram?: string; youtube?: string; website?: string };
  /** Owner handles with admin rights: approve join requests, add members, host events. */
  admins: string[]; // User.id of club admins (legacy entries may be profile handles)
  followers: number;
  /** "open" = join instantly; "approval" = an admin approves each request. */
  joinPolicy?: "open" | "approval";
  /** Private clubs hide their member list from non-members. */
  isPrivate?: boolean;
  createdBy?: string; // User.id
  createdAt?: string;
}

export type RequestStatus = "pending" | "approved" | "declined";

/**
 * A card owner asking to join a club. Until an admin approves, the card
 * stays independent; on approval the vehicle is filed under the club.
 */
export interface JoinRequest {
  id: string;
  club: string; // Club.slug
  ownerName: string;
  ownerHandle?: string;
  city: string;
  vehicle: { make: string; model: string; year?: number; kind: VehicleKind; image: string };
  message?: string;
  createdAt: string;
  status: RequestStatus;
}

export type EventCategory =
  | "Meetup"
  | "Drive"
  | "Ride"
  | "Track Day"
  | "Brand Experience"
  | "Launch"
  | "Exhibition"
  | "Modification Meet"
  | "Road Trip"
  | "Community";

export interface TicketType {
  id: string;
  name: string;
  price: number; // INR, 0 = free
  perks: string[];
  /** Capacity. Omit for open-entry tickets with no slot limit. */
  total?: number;
  sold: number;
}

/** One person's registration for an event. Contact details are private (organiser only). */
export interface Registration {
  id: string; // booking reference shown on the ticket
  event: string; // Event.slug
  name: string;
  phone: string;
  email: string;
  vehicleReg?: string;
  userId?: string; // the account that registered
  checkedIn?: boolean;
  tickets: { id: string; qty: number }[];
  createdAt: string;
}

export interface Event {
  slug: string;
  title: string;
  category: EventCategory;
  kind: VehicleKind | "mixed";
  cover: string;
  city: string;
  date: string; // ISO datetime
  /** Start time not announced yet — show "Time TBA". */
  timeTbc?: boolean;
  endTime?: string; // "18:30"
  /** Hosting club (optional — anyone can organise an event personally). */
  organizer?: string; // Club.slug
  /** The person who organises it — always a user, never an "event account". */
  createdBy?: string; // User.id
  status?: "published" | "draft";
  createdAt?: string;
  route?: string; // Route.slug
  venue: string;
  summary: string;
  rules: string[];
  tickets: TicketType[];
  participants: number;
  sponsors: string[]; // Brand.slug
  attendingVehicles: string[]; // Vehicle.slug
}

export type StopKind = "start" | "fuel" | "food" | "scenic" | "photo" | "end";

export interface RouteStop {
  name: string;
  kind: StopKind;
  km?: number; // distance from start, when known
  note?: string;
  /** Coordinates, when known — needed for the traced map. */
  lat?: number;
  lng?: number;
}

export interface Route {
  slug: string;
  from: string;
  to: string;
  state: string;
  distanceKm?: number;
  durationMin?: number;
  difficulty?: "Easy" | "Moderate" | "Technical";
  surface?: string;
  bestTime?: string;
  cover: string;
  gallery: string[];
  summary: string;
  /** [lat, lng] waypoints. Without them the route shows start → end only. */
  path?: [number, number][];
  stops: RouteStop[];
  elevation?: number[]; // metres, sampled evenly along the route
  suitedFor: VehicleKind | "mixed";
}

export interface ModSlot {
  slot:
    | "ECU"
    | "Intake"
    | "Exhaust"
    | "Downpipe"
    | "Turbo"
    | "Wheels"
    | "Suspension"
    | "Brakes"
    | "Aero"
    | "Interior"
    | "Wrap"
    | "Lighting";
  part: string;
  brand: string;
  cost?: number;
}

export type BusinessCategory =
  | "Detailing"
  | "PPF"
  | "Ceramic Coating"
  | "Performance Tuning"
  | "Modification"
  | "Servicing"
  | "Luxury Dealership"
  | "Supercar Rental"
  | "Photography"
  | "Insurance"
  | "Accessories"
  | "Workshop";

export interface Review {
  author: string;
  rating: number;
  text: string;
  vehicle: string; // what they drive (may be "")
  userId?: string; // the account that wrote it (one review per person)
  createdAt?: string;
}

export interface Business {
  slug: string;
  name: string;
  categories: BusinessCategory[];
  city: string;
  area: string;
  verified: boolean;
  rating: number;
  reviewCount: number;
  cover: string;
  gallery: string[];
  about: string;
  services: { name: string; from: number }[];
  workedOn: string[]; // Vehicle.slug
  reviews: Review[];
  phone: string;
  email?: string;
  website?: string;
  instagram?: string;
  /** Opening hours, once confirmed. */
  hours?: string;
  sponsored?: boolean;
  ownerUserId?: string; // the account that manages this business
  createdAt?: string;
}

export interface Brand {
  slug: string;
  name: string;
  line: string; // one-line positioning
  kind: "Lubricants" | "Tyres" | "Coatings" | "Audio" | "Apparel" | "Fuel" | "Insurance" | "Eyewear";
}

export type SearchKind = "vehicle" | "owner" | "club" | "event" | "business";

export interface SearchResult {
  kind: SearchKind;
  href: string;
  title: string;
  subtitle: string;
  image?: string;
  score: number;
}
