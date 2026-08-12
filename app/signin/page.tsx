import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { getPersonaUsers, getSession } from "@/lib/auth";
import { SignInFlow } from "./SignInFlow";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: PageProps<"/signin">) {
  const params = await searchParams;
  const next = typeof params.next === "string" && params.next.startsWith("/") ? params.next : "/";
  const error = typeof params.error === "string" ? params.error : undefined;

  const user = await getSession();
  if (user) redirect(next);

  const personas = getPersonaUsers().map((p) => ({
    id: p.id,
    name: p.name,
    avatarUrl: p.avatarUrl,
    headline: p.headline,
  }));

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-10 sm:py-16">
        <h1 className="mb-1 text-center text-2xl font-bold tracking-tight text-slate-900">Play as yourself.</h1>
        <p className="mb-6 text-center text-sm text-slate-500">
          Your name, your title, your score — that&apos;s the whole point.
        </p>
        <SignInFlow personas={personas} next={next} error={error} />
      </main>
    </>
  );
}
