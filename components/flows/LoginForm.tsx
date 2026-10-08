"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { logIn } from "@/app/actions/account";
import { verifyAdminPasscode } from "@/app/(main)/login/actions";
import { Icon } from "@/components/ui/Icon";

/** Only same-site paths are honoured as a return target. */
const safeNext = (next: string | undefined, fallback: string) => (next && next.startsWith("/") && !next.startsWith("//") ? next : fallback);

/**
 * Log in with the one account you use for everything (email or mobile +
 * password). The site admin can also enter with the admin passcode.
 */
export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"account" | "admin">("account");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, startCheck] = useTransition();
  const joinHref = `/join${next ? `?next=${encodeURIComponent(next)}` : ""}`;

  const go = (href: string) => {
    router.push(href);
    router.refresh();
  };

  return (
    <div className="w-full max-w-md">
      <p className="label mb-4">Log in</p>
      <h1 className="display text-[clamp(2.2rem,min(5vw,6.5svh),3.5rem)]">Welcome back</h1>
      <div role="tablist" aria-label="Login type" className="mt-8 inline-flex rounded-[3px] p-1 hairline">
        {(
          [
            ["account", "My account"],
            ["admin", "Site admin"],
          ] as const
        ).map(([m, label]) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`label h-9 rounded-[2px] px-4 transition-colors ${mode === m ? "bg-ivory !text-ink" : "hover:text-ivory"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "account" ? (
        <form
          key="account"
          className="mt-8"
          onSubmit={(e) => {
            e.preventDefault();
            if (!identifier || !password) return;
            setError(null);
            startCheck(async () => {
              const res = await logIn({ identifier, password });
              if (!res.ok) return setError(res.error);
              go(safeNext(next, "/me"));
            });
          }}
        >
          <label className="label mb-2 block" htmlFor="login-id">
            Email or mobile
          </label>
          <input id="login-id" className="field" autoComplete="username" autoCapitalize="none" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="you@example.com or 98XXXXXXXX" />
          <label className="label mb-2 mt-5 block" htmlFor="login-password">
            Password
          </label>
          <input id="login-password" type="password" className="field" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          {error && (
            <p role="alert" className="mt-3 text-sm text-ember">
              {error}
            </p>
          )}
          <button disabled={!identifier || !password || checking} className="btn btn-primary chamfer mt-6 w-full disabled:opacity-50">
            {checking ? "Checking…" : "Log in"} <Icon name="arrow" size={15} />
          </button>
        </form>
      ) : (
        <form
          key="admin"
          className="mt-8"
          onSubmit={(e) => {
            e.preventDefault();
            if (!passcode) return;
            setError(null);
            startCheck(async () => {
              const res = await verifyAdminPasscode(passcode);
              if (!res.ok) return setError(res.error ?? "Couldn't sign in.");
              go(safeNext(next, "/studio"));
            });
          }}
        >
          <label className="label mb-2 block" htmlFor="passcode">
            Admin passcode
          </label>
          <input id="passcode" type="password" className="field" autoComplete="current-password" value={passcode} onChange={(e) => setPasscode(e.target.value)} placeholder="••••••••" />
          {error && (
            <p role="alert" className="mt-3 text-sm text-ember">
              {error}
            </p>
          )}
          <button disabled={!passcode || checking} className="btn btn-primary chamfer mt-6 w-full disabled:opacity-50">
            {checking ? "Checking…" : "Enter as site admin"} <Icon name="arrow" size={15} />
          </button>
          <p className="mt-6 text-xs text-mute">Site admin can manage every profile, vehicle, club, event and business (Studio). You can also log into your own account at the same time.</p>
        </form>
      )}
      <p className="mt-10 text-sm text-silver">
        New here?{" "}
        <Link href={joinHref} className="text-ivory underline underline-offset-4">
          Create your free account
        </Link>
      </p>
    </div>
  );
}
