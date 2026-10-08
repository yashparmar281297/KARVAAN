import Link from "next/link";

export default function NotFound() {
  return (
    <section className="container-x flex min-h-[80svh] flex-col items-start justify-center pt-24">
      <p className="label text-ember">404 · Wrong turn</p>
      <h1 className="display mt-4 text-[clamp(3rem,min(10vw,13svh),8rem)]">Road closed</h1>
      <p className="mt-4 max-w-md text-silver">This page doesn&apos;t exist — or its owner has made it private.</p>
      <div className="mt-8 flex gap-3">
        <Link href="/" className="btn btn-primary chamfer">
          Back home
        </Link>
        <Link href="/explore" className="btn btn-ghost chamfer">
          Explore
        </Link>
      </div>
    </section>
  );
}
