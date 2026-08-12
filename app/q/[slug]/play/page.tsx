import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getQuizBySlug, getQuestionsWithOptions } from "@/lib/db";
import { PlayClient } from "./PlayClient";

export const metadata: Metadata = { title: "Playing…" };

export default async function PlayPage({ params }: PageProps<"/q/[slug]/play">) {
  const { slug } = await params;
  const quiz = getQuizBySlug(slug);
  if (!quiz || quiz.status !== "published") notFound();

  // The sign-in wall lives here, not on the quiz landing page.
  const user = await getSession();
  if (!user) redirect(`/signin?next=${encodeURIComponent(`/q/${slug}/play`)}`);

  const questions = getQuestionsWithOptions(quiz.id).map((q) => ({
    id: q.id,
    text: q.text,
    explanation: q.explanation,
    options: q.options.map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect })),
  }));

  return (
    <main className="flex min-h-screen flex-col bg-slate-950 px-4 py-6">
      <div className="mx-auto flex w-full max-w-lg items-center justify-between text-sm">
        <Link href={`/q/${slug}`} className="font-semibold text-slate-500 transition hover:text-slate-300">
          ✕ Quit
        </Link>
        <span className="truncate pl-4 font-semibold text-slate-400">{quiz.title}</span>
      </div>
      <div className="flex flex-1 flex-col justify-center py-8">
        <PlayClient slug={slug} quizTitle={quiz.title} questions={questions} />
      </div>
    </main>
  );
}
