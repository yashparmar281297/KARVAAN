"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { createBusiness, createClub, createProfile, createVehicle, updateBusiness, updateClub, updateProfile, updateVehicle, type Result } from "@/app/(main)/studio/actions";
import { Icon } from "@/components/ui/Icon";
import { GalleryField, ImageField } from "@/components/upload/ImageField";
import { suggestClass } from "@/lib/classify";
import type { BusinessCategory, ClubCategory, Privacy, VehicleClass, VehicleKind, Visibility } from "@/lib/types";

export interface Option {
  value: string;
  label: string;
}

/* ------------------------------ building blocks ------------------------------ */

function Field({ label, required, hint, children, className = "" }: { label: string; required?: boolean; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="label mb-2 block !text-[9.5px] text-mute">
        {label} {required && <span className="text-ember">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-mute">{hint}</span>}
    </label>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-5 border-t border-line pt-8 first:border-0 first:pt-0">
      <legend className="label mb-5 flex items-center gap-3">
        <span className="text-ember">{n}</span> <span className="h-px w-6 bg-line-strong" /> {title}
      </legend>
      {children}
    </fieldset>
  );
}

function Chips<T extends string>({ options, value, onChange, multi }: { options: readonly T[] | { value: T; label: string }[]; value: T | T[]; onChange: (v: T) => void; multi?: boolean }) {
  const list = (options as (T | { value: T; label: string })[]).map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <div className="flex flex-wrap gap-2" role={multi ? "group" : "radiogroup"}>
      {list.map((o) => {
        const on = Array.isArray(value) ? value.includes(o.value) : value === o.value;
        return (
          <button type="button" key={o.value} className="chip" data-active={on} aria-pressed={on} onClick={() => onChange(o.value)}>
            {on && multi && <Icon name="check" size={11} />} {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Select({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: Option[]; placeholder?: string }) {
  return (
    <select className="field" value={value} onChange={(e) => onChange(e.target.value)}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** Form shell: saves through a server action, then opens the new page. */
function StudioForm({ save, submit, ready, missing, children }: { save: () => Promise<Result>; submit: string; ready: boolean; missing: string; children: ReactNode }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, start] = useTransition();
  return (
    <form
      className="max-w-2xl space-y-10"
      onSubmit={(e) => {
        e.preventDefault();
        if (!ready) return;
        setError(null);
        start(async () => {
          const res = await save();
          if (res.ok) router.push(res.href);
          else setError(res.error);
        });
      }}
    >
      {children}
      <div className="space-y-3 border-t border-line pt-8">
        {error && (
          <p role="alert" className="text-sm text-ember">
            {error}
          </p>
        )}
        <button disabled={!ready || saving} className="btn btn-primary chamfer w-full disabled:opacity-50 sm:w-auto">
          {saving ? "Saving…" : submit} <Icon name="arrow" size={15} />
        </button>
        {!ready && <p className="text-xs text-mute">Still needed: {missing}</p>}
      </div>
    </form>
  );
}

const missingList = (checks: [boolean, string][]) =>
  checks
    .filter(([ok]) => !ok)
    .map(([, name]) => name)
    .join(", ");

const digits = (v: string) => v.replace(/[^\d.]/g, "");

/* ------------------------------ Profile ------------------------------ */

const PRIVACY: { value: Privacy; label: string }[] = [
  { value: "public", label: "Public" },
  { value: "club", label: "Club members only" },
  { value: "private", label: "Private" },
];

export interface ProfileDraft {
  id: string;
  name: string;
  city: string;
  bio: string;
  instagram: string;
  privacy: Privacy;
  portrait: string;
}

export function ProfileForm({ cities, initial }: { cities: Option[]; initial?: ProfileDraft }) {
  const [f, setF] = useState({ name: initial?.name ?? "", city: initial?.city ?? "", bio: initial?.bio ?? "", instagram: initial?.instagram ?? "", privacy: initial?.privacy ?? ("public" as Privacy) });
  const [portrait, setPortrait] = useState<string | undefined>(initial?.portrait);
  const set = (k: keyof typeof f) => (v: string) => setF({ ...f, [k]: v });
  const checks: [boolean, string][] = [
    [!!f.name.trim(), "name"],
    [!!portrait, "profile photo"],
  ];
  return (
    <StudioForm save={() => (initial ? updateProfile(initial.id, { ...f, portrait }) : createProfile({ ...f, portrait }))} submit={initial ? "Save changes" : "Create profile"} ready={checks.every(([ok]) => ok)} missing={missingList(checks)}>
      <Section n="01" title="Photo">
        <ImageField kind="portrait" value={portrait} onChange={setPortrait} required />
      </Section>
      <Section n="02" title="About">
        <Field label="Full name" required>
          <input className="field" value={f.name} onChange={(e) => set("name")(e.target.value)} placeholder="Honey Bhatia" maxLength={60} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City">
            <Select value={f.city} onChange={set("city")} options={cities} placeholder="Not set" />
          </Field>
          <Field label="Instagram" hint="Just the username">
            <input className="field" value={f.instagram} onChange={(e) => set("instagram")(e.target.value)} placeholder="username" maxLength={40} />
          </Field>
        </div>
        <Field label="Bio">
          <textarea className="field !h-24 py-3" value={f.bio} onChange={(e) => set("bio")(e.target.value)} maxLength={280} placeholder="Two lines about you and your machines" />
        </Field>
      </Section>
      <Section n="03" title="Who can see you">
        <Chips options={PRIVACY} value={f.privacy} onChange={set("privacy")} />
        <p className="text-xs text-mute">Public shows your name, photo and city. Club only shows them to fellow members. Private hides them everywhere — your vehicles still appear.</p>
      </Section>
    </StudioForm>
  );
}

/* ------------------------------ Vehicle ------------------------------ */

const CLASSES: Record<VehicleKind, VehicleClass[]> = {
  car: ["Supercar", "Performance", "Sleeper", "Luxury", "JDM", "Classic", "Off-road", "Street"],
  bike: ["Superbike", "Cruiser", "Street", "Off-road", "Classic"],
};
const DRIVE: Record<VehicleKind, string[]> = { car: ["RWD", "AWD", "FWD", "4WD"], bike: ["Chain", "Belt", "Shaft"] };

export interface VehicleDraft {
  id: string;
  kind: VehicleKind;
  fields: { owner: string; class: VehicleClass; make: string; model: string; variant: string; year: string; colour: string; engine: string; power: string; torque: string; transmission: string; drivetrain: string; zeroToHundred: string; topSpeed: string; mods: string; club: string };
  image: string;
  gallery: string[];
  visibility: Visibility;
  ownerHidden: boolean;
}

const VISIBILITY: { value: Visibility; label: string; hint: string }[] = [
  { value: "public", label: "Public", hint: "Anyone can see it." },
  { value: "club", label: "Club members", hint: "Only members of the vehicle's club." },
  { value: "followers", label: "Followers", hint: "Only people who follow you." },
  { value: "private", label: "Private", hint: "Stays in your garage — not publicly discoverable." },
];

/**
 * Add / edit a vehicle. Members: it always goes into their own garage (no
 * owner picker). Site admin (Studio): `owners` lists every profile to pick from.
 */
export function VehicleForm({ owners, clubs, initial, kinds = ["car", "bike"] }: { owners?: Option[]; clubs: Option[]; initial?: VehicleDraft; kinds?: VehicleKind[] }) {
  const [kind, setKind] = useState<VehicleKind>(initial?.kind ?? kinds[0] ?? "car");
  const [f, setF] = useState(initial?.fields ?? { owner: owners?.[0]?.value ?? "", class: "Performance" as VehicleClass, make: "", model: "", variant: "", year: "", colour: "", engine: "", power: "", torque: "", transmission: "", drivetrain: "RWD", zeroToHundred: "", topSpeed: "", mods: "", club: "" });
  const [image, setImage] = useState<string | undefined>(initial?.image);
  const [gallery, setGallery] = useState<string[]>(initial?.gallery ?? []);
  const [visibility, setVisibility] = useState<Visibility>(initial?.visibility ?? "public");
  const [ownerHidden, setOwnerHidden] = useState(initial?.ownerHidden ?? false);
  // Category follows make/model automatically until the owner picks one by hand.
  const [classTouched, setClassTouched] = useState(!!initial);
  const set = (k: keyof typeof f) => (v: string) => {
    const next = { ...f, [k]: v };
    if (!classTouched && (k === "make" || k === "model")) {
      const guess = suggestClass(kind, next.make, next.model);
      if (guess) next.class = guess;
    }
    setF(next);
  };

  if (owners && !owners.length) return <NeedFirst what="a profile" tab="profile" why="Every vehicle belongs to an owner." />;

  const checks: [boolean, string][] = [
    [!owners || !!f.owner, "owner"],
    [!!image, "main photo"],
    [!!f.make.trim(), "make"],
    [!!f.model.trim(), "model"],
    [!!f.engine.trim(), "engine"],
    [Number(f.power) > 0, "power"],
    [visibility !== "club" || !!f.club, "a club (for club-members-only)"],
  ];
  const input = { ...f, kind, image, gallery, visibility, ownerHidden };
  return (
    <StudioForm save={() => (initial ? updateVehicle(initial.id, input) : createVehicle(input))} submit={initial ? "Save changes" : "Add to garage"} ready={checks.every(([ok]) => ok)} missing={missingList(checks)}>
      <Section n="01" title={owners ? "Owner" : "Car or bike"}>
        {owners && (
          <Field label="Owner" required>
            <Select value={f.owner} onChange={set("owner")} options={owners} />
          </Field>
        )}
        <Chips
          options={(
            [
              { value: "car" as VehicleKind, label: "Car" },
              { value: "bike" as VehicleKind, label: "Bike" },
            ] as const
          ).filter((o) => kinds.includes(o.value) || initial?.kind === o.value)}
          value={kind}
          onChange={(k) => {
            setKind(k);
            setF({ ...f, class: suggestClass(k, f.make, f.model) ?? CLASSES[k][0], drivetrain: DRIVE[k][0] });
          }}
        />
      </Section>
      <Section n="02" title="Photos">
        <ImageField kind="vehicle" label="Main photo" value={image} onChange={setImage} required />
        <GalleryField kind="vehicle" value={gallery} onChange={setGallery} />
      </Section>
      <Section n="03" title="The machine">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Make" required>
            <input className="field" value={f.make} onChange={(e) => set("make")(e.target.value)} placeholder={kind === "car" ? "Lamborghini" : "Ducati"} maxLength={40} />
          </Field>
          <Field label="Model" required>
            <input className="field" value={f.model} onChange={(e) => set("model")(e.target.value)} placeholder={kind === "car" ? "Huracán Tecnica" : "Panigale V4"} maxLength={60} />
          </Field>
          <Field label="Variant">
            <input className="field" value={f.variant} onChange={(e) => set("variant")(e.target.value)} placeholder="S" maxLength={40} />
          </Field>
          <Field label="Year">
            <input className="field" inputMode="numeric" value={f.year} onChange={(e) => set("year")(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="2024" />
          </Field>
          <Field label="Colour">
            <input className="field" value={f.colour} onChange={(e) => set("colour")(e.target.value)} placeholder="Verde Mantis" maxLength={40} />
          </Field>
          <Field label="Category" hint={`${kind === "bike" ? "Bike" : "Car"} → ${f.class}${f.make ? ` → ${f.make}` : ""}`}>
            <Select
              value={f.class}
              onChange={(v) => {
                setClassTouched(true);
                setF({ ...f, class: v as VehicleClass });
              }}
              options={CLASSES[kind].map((c) => ({ value: c, label: c }))}
            />
          </Field>
        </div>
      </Section>
      <Section n="04" title="Specs">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Engine" required className="sm:col-span-2">
            <input className="field" value={f.engine} onChange={(e) => set("engine")(e.target.value)} placeholder="5.2L V10" maxLength={60} />
          </Field>
          <Field label="Power (hp)" required>
            <input className="field" inputMode="numeric" value={f.power} onChange={(e) => set("power")(digits(e.target.value))} placeholder="631" />
          </Field>
          <Field label="Torque (Nm)">
            <input className="field" inputMode="numeric" value={f.torque} onChange={(e) => set("torque")(digits(e.target.value))} placeholder="565" />
          </Field>
          <Field label="Transmission">
            <input className="field" value={f.transmission} onChange={(e) => set("transmission")(e.target.value)} placeholder="7-speed DCT" maxLength={40} />
          </Field>
          <Field label={kind === "bike" ? "Final drive" : "Drivetrain"}>
            <Select value={f.drivetrain} onChange={set("drivetrain")} options={DRIVE[kind].map((d) => ({ value: d, label: d }))} />
          </Field>
          <Field label="0–100 km/h (s)">
            <input className="field" inputMode="decimal" value={f.zeroToHundred} onChange={(e) => set("zeroToHundred")(digits(e.target.value))} placeholder="3.2" />
          </Field>
          <Field label="Top speed (km/h)">
            <input className="field" inputMode="numeric" value={f.topSpeed} onChange={(e) => set("topSpeed")(digits(e.target.value))} placeholder="325" />
          </Field>
        </div>
        <Field label="Modifications" hint="One per line. Leave empty if stock.">
          <textarea className="field !h-24 py-3" value={f.mods} onChange={(e) => set("mods")(e.target.value)} placeholder={"Akrapovič titanium exhaust\nFull PPF"} />
        </Field>
      </Section>
      <Section n="05" title="Club">
        <Field label="Club" hint={clubs.length ? "Only clubs you're a member of." : "Join a club first to list this vehicle in it."}>
          <Select value={f.club} onChange={set("club")} options={clubs} placeholder="Independent" />
        </Field>
      </Section>
      <Section n="06" title="Privacy">
        <div>
          <span className="label mb-2 block !text-[9.5px] text-mute">Who can see this vehicle?</span>
          <Chips options={VISIBILITY.map(({ value, label }) => ({ value, label }))} value={visibility} onChange={setVisibility} />
          <p className="mt-2 text-xs text-mute">{VISIBILITY.find((v) => v.value === visibility)?.hint}</p>
        </div>
        <label className="flex items-start gap-3 text-sm text-silver">
          <input type="checkbox" checked={ownerHidden} onChange={(e) => setOwnerHidden(e.target.checked)} className="mt-1 accent-[var(--color-ember)]" />
          <span>
            Hide my identity on this vehicle
            <span className="block text-xs text-mute">It shows as “Private owner” — your name, photo and exact location are never linked to it publicly.</span>
          </span>
        </label>
      </Section>
    </StudioForm>
  );
}

/* ------------------------------ Club ------------------------------ */

const CLUB_CATEGORIES: ClubCategory[] = ["Supercar", "Superbike", "Car", "Bike", "Modification", "Classic", "JDM", "Performance"];

export interface ClubDraft {
  id: string;
  fields: { name: string; tagline: string; category: ClubCategory; kind: string; city: string; founded: string; about: string; members: string; vehicles: string; instagram: string; website: string };
  plus: { membersPlus: boolean; vehiclesPlus: boolean };
  logo?: string;
  hero: string;
  joinPolicy: "open" | "approval";
  isPrivate: boolean;
}

export function ClubForm({ cities, initial }: { cities: Option[]; initial?: ClubDraft }) {
  const [f, setF] = useState(initial?.fields ?? { name: "", tagline: "", category: "Supercar" as ClubCategory, kind: "car", city: "", founded: "", about: "", members: "", vehicles: "", instagram: "", website: "" });
  const [plus, setPlus] = useState(initial?.plus ?? { membersPlus: false, vehiclesPlus: false });
  const [logo, setLogo] = useState<string | undefined>(initial?.logo);
  const [hero, setHero] = useState<string | undefined>(initial?.hero);
  const [joinPolicy, setJoinPolicy] = useState<"open" | "approval">(initial?.joinPolicy ?? "approval");
  const [isPrivate, setIsPrivate] = useState(initial?.isPrivate ?? false);
  const set = (k: keyof typeof f) => (v: string) => setF({ ...f, [k]: v });
  const checks: [boolean, string][] = [
    [!!f.name.trim(), "club name"],
    [!!hero, "cover photo"],
    [!!f.city, "city"],
    [!!f.about.trim(), "about"],
  ];
  return (
    <StudioForm save={() => (initial ? updateClub(initial.id, { ...f, ...plus, logo, hero, joinPolicy, isPrivate }) : createClub({ ...f, ...plus, logo, hero, joinPolicy, isPrivate }))} submit={initial ? "Save changes" : "Create club"} ready={checks.every(([ok]) => ok)} missing={missingList(checks)}>
      <Section n="01" title="Photos">
        <ImageField kind="cover" value={hero} onChange={setHero} required />
        <ImageField kind="logo" value={logo} onChange={setLogo} />
      </Section>
      <Section n="02" title="The club">
        <Field label="Club name" required>
          <input className="field" value={f.name} onChange={(e) => set("name")(e.target.value)} placeholder="Malwa Supercar Club" maxLength={60} />
        </Field>
        <Field label="Tagline">
          <input className="field" value={f.tagline} onChange={(e) => set("tagline")(e.target.value)} placeholder="Central India's supercar family" maxLength={90} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            <Select value={f.category} onChange={set("category")} options={CLUB_CATEGORIES.map((c) => ({ value: c, label: c }))} />
          </Field>
          <Field label="For">
            <Select value={f.kind} onChange={set("kind")} options={[{ value: "car", label: "Cars" }, { value: "bike", label: "Bikes" }, { value: "mixed", label: "Cars & bikes" }]} />
          </Field>
          <Field label="City" required>
            <Select value={f.city} onChange={set("city")} options={cities} placeholder="Choose" />
          </Field>
          <Field label="Founded (year)">
            <input className="field" inputMode="numeric" value={f.founded} onChange={(e) => set("founded")(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="2017" />
          </Field>
        </div>
        <Field label="About" required>
          <textarea className="field !h-28 py-3" value={f.about} onChange={(e) => set("about")(e.target.value)} maxLength={800} placeholder="Who you are, what you drive, how often you meet" />
        </Field>
      </Section>
      <Section n="03" title="Numbers">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Field label="Members">
              <input className="field" inputMode="numeric" value={f.members} onChange={(e) => set("members")(e.target.value.replace(/\D/g, ""))} placeholder="70" />
            </Field>
            <label className="mt-2 flex items-center gap-2 text-xs text-silver">
              <input type="checkbox" checked={plus.membersPlus} onChange={(e) => setPlus({ ...plus, membersPlus: e.target.checked })} className="accent-[var(--color-ember)]" /> Show as “70+”
            </label>
          </div>
          <div>
            <Field label="Vehicles">
              <input className="field" inputMode="numeric" value={f.vehicles} onChange={(e) => set("vehicles")(e.target.value.replace(/\D/g, ""))} placeholder="50" />
            </Field>
            <label className="mt-2 flex items-center gap-2 text-xs text-silver">
              <input type="checkbox" checked={plus.vehiclesPlus} onChange={(e) => setPlus({ ...plus, vehiclesPlus: e.target.checked })} className="accent-[var(--color-ember)]" /> Show as “50+”
            </label>
          </div>
        </div>
      </Section>
      <Section n="04" title="Links">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Instagram" hint="Just the username">
            <input className="field" value={f.instagram} onChange={(e) => set("instagram")(e.target.value)} placeholder="clubname" maxLength={40} />
          </Field>
          <Field label="Website">
            <input className="field" value={f.website} onChange={(e) => set("website")(e.target.value)} placeholder="clubname.in" maxLength={200} />
          </Field>
        </div>
      </Section>
      <Section n="05" title="Membership">
        <div>
          <span className="label mb-2 block !text-[9.5px] text-mute">How do people join?</span>
          <Chips
            options={[
              { value: "approval" as const, label: "Admin approves each member" },
              { value: "open" as const, label: "Anyone can join instantly" },
            ]}
            value={joinPolicy}
            onChange={setJoinPolicy}
          />
        </div>
        <label className="flex items-start gap-3 text-sm text-silver">
          <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="mt-1 accent-[var(--color-ember)]" />
          <span>
            Private club
            <span className="block text-xs text-mute">The club page stays visible, but only members see the member list.</span>
          </span>
        </label>
        {!initial && <p className="text-xs text-mute">You become this club&apos;s admin — you can approve members, add other admins and host club events.</p>}
      </Section>
    </StudioForm>
  );
}

/* ------------------------------ Business ------------------------------ */

const BUSINESS_CATEGORIES: BusinessCategory[] = ["Detailing", "PPF", "Ceramic Coating", "Performance Tuning", "Modification", "Servicing", "Luxury Dealership", "Supercar Rental", "Photography", "Insurance", "Accessories", "Workshop"];

export interface BusinessDraft {
  id: string;
  fields: { name: string; city: string; area: string; about: string; phone: string; email: string; website: string; instagram: string; hours: string };
  categories: BusinessCategory[];
  services: { id: number; name: string; from: string }[];
  cover: string;
  gallery: string[];
}

export function BusinessForm({ cities, initial }: { cities: Option[]; initial?: BusinessDraft }) {
  const [f, setF] = useState(initial?.fields ?? { name: "", city: "", area: "", about: "", phone: "", email: "", website: "", instagram: "", hours: "" });
  const [categories, setCategories] = useState<BusinessCategory[]>(initial?.categories ?? []);
  const [services, setServices] = useState(initial?.services.length ? initial.services : [{ id: 1, name: "", from: "" }]);
  const [cover, setCover] = useState<string | undefined>(initial?.cover);
  const [gallery, setGallery] = useState<string[]>(initial?.gallery ?? []);
  const set = (k: keyof typeof f) => (v: string) => setF({ ...f, [k]: v });
  const checks: [boolean, string][] = [
    [!!f.name.trim(), "business name"],
    [!!cover, "cover photo"],
    [categories.length > 0, "category"],
    [!!f.city, "city"],
    [!!f.area.trim(), "area"],
    [!!f.about.trim(), "about"],
    [!!f.phone.trim(), "phone"],
  ];
  return (
    <StudioForm
      save={() => {
        const input = { ...f, categories, cover, gallery, services: services.filter((s) => s.name.trim()).map(({ name, from }) => ({ name, from })) };
        return initial ? updateBusiness(initial.id, input) : createBusiness(input);
      }}
      submit={initial ? "Save changes" : "List business"}
      ready={checks.every(([ok]) => ok)}
      missing={missingList(checks)}
    >
      <Section n="01" title="Photos">
        <ImageField kind="cover" value={cover} onChange={setCover} required />
        <GalleryField kind="post" value={gallery} onChange={setGallery} label="Work photos" />
      </Section>
      <Section n="02" title="The business">
        <Field label="Business name" required>
          <input className="field" value={f.name} onChange={(e) => set("name")(e.target.value)} placeholder="AG7 Cars" maxLength={60} />
        </Field>
        <div>
          <span className="label mb-2 block !text-[9.5px] text-mute">
            Categories <span className="text-ember">*</span>
          </span>
          <Chips multi options={BUSINESS_CATEGORIES} value={categories} onChange={(c) => setCategories(categories.includes(c) ? categories.filter((x) => x !== c) : [...categories, c])} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City" required>
            <Select value={f.city} onChange={set("city")} options={cities} placeholder="Choose" />
          </Field>
          <Field label="Area" required>
            <input className="field" value={f.area} onChange={(e) => set("area")(e.target.value)} placeholder="Vijay Nagar" maxLength={80} />
          </Field>
        </div>
        <Field label="About" required>
          <textarea className="field !h-28 py-3" value={f.about} onChange={(e) => set("about")(e.target.value)} maxLength={800} placeholder="What you do and who you do it for" />
        </Field>
      </Section>
      <Section n="03" title="Services">
        <div className="space-y-2">
          {services.map((s) => (
            <div key={s.id} className="grid grid-cols-[1fr_130px_40px] gap-2">
              <input className="field !h-11 text-sm" value={s.name} onChange={(e) => setServices(services.map((x) => (x.id === s.id ? { ...x, name: e.target.value } : x)))} placeholder="Full-body PPF" aria-label="Service" maxLength={60} />
              <label className="relative">
                <span className="readout pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-mute">₹</span>
                <input className="field !h-11 pl-7 text-sm" inputMode="numeric" value={s.from} onChange={(e) => setServices(services.map((x) => (x.id === s.id ? { ...x, from: e.target.value.replace(/\D/g, "") } : x)))} placeholder="From" aria-label="Starting price" />
              </label>
              <button type="button" onClick={() => setServices(services.filter((x) => x.id !== s.id))} className="grid place-items-center text-mute hover:text-ivory" aria-label="Remove service">
                <Icon name="close" size={15} />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setServices([...services, { id: Date.now(), name: "", from: "" }])} className="chip">
          <Icon name="plus" size={12} /> Add service
        </button>
      </Section>
      <Section n="04" title="Contact">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone" required>
            <input className="field" type="tel" value={f.phone} onChange={(e) => set("phone")(e.target.value)} placeholder="+91 98765 43210" maxLength={20} />
          </Field>
          <Field label="Email">
            <input className="field" type="email" value={f.email} onChange={(e) => set("email")(e.target.value)} placeholder="hello@studio.in" maxLength={80} />
          </Field>
          <Field label="Website">
            <input className="field" value={f.website} onChange={(e) => set("website")(e.target.value)} placeholder="studio.in" maxLength={200} />
          </Field>
          <Field label="Instagram" hint="Just the username">
            <input className="field" value={f.instagram} onChange={(e) => set("instagram")(e.target.value)} placeholder="studio" maxLength={40} />
          </Field>
          <Field label="Hours" className="sm:col-span-2">
            <input className="field" value={f.hours} onChange={(e) => set("hours")(e.target.value)} placeholder="Mon–Sat · 10 AM – 8 PM" maxLength={80} />
          </Field>
        </div>
      </Section>
    </StudioForm>
  );
}

/* ------------------------------ helpers ------------------------------ */

export function NeedFirst({ what, tab, why }: { what: string; tab: string; why: string }) {
  return (
    <div className="max-w-xl bg-graphite p-6 hairline" style={{ borderRadius: 3 }}>
      <p className="display text-xl">Create {what} first</p>
      <p className="mt-2 text-sm text-silver">{why}</p>
      <Link href={`/studio?tab=${tab}`} className="btn btn-ghost chamfer mt-5">
        Go to {what.replace(/^an? /, "")} <Icon name="arrow" size={14} />
      </Link>
    </div>
  );
}
