import Link from "next/link";
import { Header } from "@/components/Header";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
        <p className="text-6xl">🕵️</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">That page doesn&apos;t exist</h1>
        <p className="max-w-sm text-sm text-slate-500">
          The quiz may have been unpublished, or the link got mangled somewhere between here and LinkedIn.
        </p>
        <Link href="/" className="rounded-full bg-accent px-6 py-2.5 font-semibold text-white transition hover:bg-accent-strong">
          Browse live quizzes
        </Link>
      </main>
    </>
  );
}
