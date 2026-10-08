import type { Metadata } from "next";
import { LoginForm } from "@/components/flows/LoginForm";

export const metadata: Metadata = { title: "Login", robots: { index: false } };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const next = (await searchParams).next;
  return (
    <section className="grid min-h-[100svh] lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(80%_70%_at_30%_60%,var(--color-charcoal),var(--color-ink))]" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-ink" />
        <p className="display absolute bottom-12 left-12 max-w-md text-5xl">
          Welcome back
          <br />
          <span className="display-light">to the road.</span>
        </p>
      </div>
      <div className="flex items-center px-4 pb-16 pt-24 md:px-16">
        <LoginForm next={typeof next === "string" ? next : undefined} />
      </div>
    </section>
  );
}
