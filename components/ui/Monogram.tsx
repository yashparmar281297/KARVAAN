// Club emblem: a machined hex badge with the club's short code.
// Generated, so every club gets a consistent crest without uploaded art.
export function Monogram({ text, size = 56, verified }: { text: string; size?: number; verified?: boolean }) {
  const id = `mg-${text}`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className="shrink-0">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" className="[stop-color:var(--color-steel)]" />
          <stop offset=".5" className="[stop-color:var(--color-graphite)]" />
          <stop offset="1" className="[stop-color:var(--color-charcoal)]" />
        </linearGradient>
      </defs>
      <path d="M32 2 58 17v30L32 62 6 47V17Z" fill={`url(#${id})`} className="stroke-ivory" strokeOpacity=".2" />
      <path d="M32 8 53 20v24L32 56 11 44V20Z" fill="none" className="stroke-ivory" strokeOpacity=".08" />
      <text
        x="32"
        y="36.5"
        textAnchor="middle"
        className="fill-ivory"
        style={{ font: `800 ${text.length > 2 ? 13 : 16}px var(--font-archivo)`, fontStretch: "125%", letterSpacing: ".04em" }}
      >
        {text}
      </text>
      {verified && <circle cx="32" cy="50" r="1.8" className="fill-ember" />}
    </svg>
  );
}

export function VerifiedMark({ className = "" }: { className?: string }) {
  return (
    <span className={`label inline-flex items-center gap-1.5 text-ivory ${className}`}>
      <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden>
        <path d="M12 2 14.6 4.3 18 4 18.7 7.4 21.6 9.3 20.2 12.4 21.6 15.6 18.7 17.5 18 20.9 14.6 20.6 12 22.9 9.4 20.6 6 20.9 5.3 17.5 2.4 15.6 3.8 12.4 2.4 9.3 5.3 7.4 6 4 9.4 4.3Z" className="fill-ivory" />
        <path d="m8 12.3 2.7 2.7L16.2 9.4" className="stroke-ink" strokeWidth="2" fill="none" />
      </svg>
      Verified
    </span>
  );
}

/** Club crest: the club's own logo when uploaded, generated monogram otherwise. */
export function ClubEmblem({ club, size = 56 }: { club: { short: string; logo?: string; verified: boolean; name: string }; size?: number }) {
  if (!club.logo) return <Monogram text={club.short} size={size} verified={club.verified} />;
  return (
    <span className="relative block shrink-0 overflow-hidden rounded-full bg-ink ring-1 ring-line-strong" style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={club.logo} alt={`${club.name} logo`} width={size} height={size} className="h-full w-full object-cover" />
    </span>
  );
}
