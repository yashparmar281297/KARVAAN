"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveOnboarding, signUp } from "@/app/actions/account";
import { Icon } from "@/components/ui/Icon";
import { CapabilityPicker } from "@/components/me/CapabilityPicker";
import { ImageField } from "@/components/upload/ImageField";
import { garageKinds, hasGarage } from "@/lib/capabilities";

/** What the person clicked before signing up — shown as the reason. */
const REASONS: Record<string, string> = {
  follow: "Create your free account to follow.",
  like: "Create your free account to like.",
  save: "Create your free account to save.",
  join: "Create your free account to join clubs.",
  register: "Create your free account to register for events.",
  create: "Create your free account to continue.",
};


const safeNext = (next: string | undefined) => (next && next.startsWith("/") && !next.startsWith("//") ? next : undefined);

/**
 * Join the community: (1) create your account → (2) what describes you?
 * (any number of capabilities — one account, many roles; they decide what the
 * person can create) → (3) supercar / superbike / custom-mod owners are offered
 * to create their garage. Then back to where they were;
 * any action they'd started (like / follow / save / join) completes itself.
 */
export function JoinFlow({ next, reason, cities, signedIn }: { next?: string; reason?: string; cities: { value: string; label: string }[]; signedIn: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(signedIn ? 2 : 1);
  const [f, setF] = useState({ name: "", identifier: "", password: "" });
  const [caps, setCaps] = useState<string[]>(["enthusiast"]);
  const [portrait, setPortrait] = useState<string>();
  const [city, setCity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const back = safeNext(next);
  const finish = () => {
    router.push(back ?? "/me");
    router.refresh();
  };
  const owner = hasGarage(caps);
  const kinds = garageKinds(caps);

  return (
    <div className="w-full max-w-xl">
      <ol className="mb-8 grid grid-cols-3 gap-2" aria-label="Steps">
        {["Your account", "What describes you", "Your garage"].map((label, i) => (
          <li key={label}>
            <div className={`h-[2px] ${i + 1 <= step ? "bg-ivory" : "bg-line"}`} />
            <p className={`label mt-2 !text-[9.5px] ${i + 1 === step ? "!text-ivory" : ""}`}>
              {String(i + 1).padStart(2, "0")} {label}
            </p>
          </li>
        ))}
      </ol>

      {step === 1 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            start(async () => {
              const res = await signUp(f);
              if (!res.ok) return setError(res.error);
              router.refresh(); // the rest of the site now knows you're logged in
              setStep(2);
            });
          }}
        >
          {reason && REASONS[reason] && <p className="mb-5 rounded-[3px] bg-graphite p-3 text-sm text-ivory hairline">{REASONS[reason]} You&apos;ll come straight back afterwards.</p>}
          <h1 className="display text-[clamp(2rem,min(5vw,6.5svh),3.2rem)]">Create your account</h1>
          <p className="mt-3 text-sm text-silver">One free account for everything you do — enthusiast, owner, club member, organiser.</p>
          <label className="label mb-2 mt-8 block" htmlFor="join-name">
            Name
          </label>
          <input id="join-name" className="field" autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Your full name" maxLength={60} />
          <label className="label mb-2 mt-5 block" htmlFor="join-id">
            Email or mobile
          </label>
          <input id="join-id" className="field" autoComplete="username" autoCapitalize="none" value={f.identifier} onChange={(e) => setF({ ...f, identifier: e.target.value })} placeholder="you@example.com or 98XXXXXXXX" />
          <label className="label mb-2 mt-5 block" htmlFor="join-password">
            Password
          </label>
          <input id="join-password" type="password" className="field" autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} placeholder="At least 8 characters" />
          {error && (
            <p role="alert" className="mt-3 text-sm text-ember">
              {error}
            </p>
          )}
          <button disabled={busy || !f.name || !f.identifier || f.password.length < 8} className="btn btn-primary chamfer mt-6 w-full disabled:opacity-50">
            {busy ? "Creating…" : "Create free account"} <Icon name="arrow" size={15} />
          </button>
          <p className="mt-6 text-sm text-silver">
            Already have an account?{" "}
            <Link href={`/login${back ? `?next=${encodeURIComponent(back)}` : ""}`} className="text-ivory underline underline-offset-4">
              Log in
            </Link>
          </p>
        </form>
      )}

      {step === 2 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            start(async () => {
              const res = await saveOnboarding({ capabilities: caps, portrait, city });
              if (!res.ok) return setError(res.error);
              if (owner) setStep(3);
              else finish();
            });
          }}
        >
          <h1 className="display text-[clamp(2rem,min(5vw,6.5svh),3.2rem)]">What describes you?</h1>
          <p className="mt-3 text-sm text-silver">Pick as many as apply — this decides what your account can create (a garage, clubs, events or a business) and <span className="text-ivory">can&apos;t be changed later</span>, so choose carefully.</p>
          <div className="mt-6">
            <CapabilityPicker value={caps} onChange={setCaps} />
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-start">
            <ImageField kind="portrait" label="Profile photo (optional)" value={portrait} onChange={setPortrait} />
            <label className="block">
              <span className="label mb-2 block !text-[9.5px] text-mute">City (optional)</span>
              <select className="field" value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="">Not set</option>
                {cities.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {error && (
            <p role="alert" className="mt-3 text-sm text-ember">
              {error}
            </p>
          )}
          <button disabled={busy} className="btn btn-primary chamfer mt-8 w-full disabled:opacity-50">
            {busy ? "Saving…" : "Continue"} <Icon name="arrow" size={15} />
          </button>
        </form>
      )}

      {step === 3 && (
        <div>
          <h1 className="display text-[clamp(2rem,min(5vw,6.5svh),3.2rem)]">Do you want to create your garage?</h1>
          <p className="mt-3 text-silver">Add your first {kinds.length > 1 ? "car or bike" : kinds[0] === "bike" ? "bike" : "car"} — it gets its own page, linked to your profile. You choose who can see it.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/me/vehicles/new${back ? `?next=${encodeURIComponent(back)}` : ""}`} className="btn btn-primary chamfer">
              Yes, add a vehicle <Icon name="arrow" size={15} />
            </Link>
            <button type="button" onClick={finish} className="btn btn-ghost chamfer">
              Later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
