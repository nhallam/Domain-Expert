import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { getSession } from "@/lib/auth";
import { canViewLeaderboard, getCountedAttempt, getLeaderboard, getQuizBySlug } from "@/lib/db";

export const metadata: Metadata = { title: "Leaderboard" };

export default async function LeaderboardPage({ params }: PageProps<"/q/[slug]/leaderboard">) {
  const { slug } = await params;
  const quiz = getQuizBySlug(slug);
  if (!quiz || quiz.status !== "published") notFound();

  const user = await getSession();
  if (!user) redirect(`/signin?next=${encodeURIComponent(`/q/${slug}/leaderboard`)}`);

  const allowed = canViewLeaderboard(quiz.id, user.id);
  const counted = getCountedAttempt(quiz.id, user.id);

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <p className="text-sm font-semibold text-slate-400">
          <Link href={`/q/${slug}`} className="hover:text-slate-600">
            {quiz.title}
          </Link>
        </p>
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-900">Leaderboard 🏆</h1>

        {allowed ? (
          <>
            <LeaderboardTable rows={getLeaderboard(quiz.id)} highlightUserId={user.id} />
            <p className="mt-4 text-center text-xs text-slate-400">
              Ranked by score, ties broken by speed. First attempts only — replays and the quiz creator don&apos;t count.
            </p>
          </>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-4xl">🔒</p>
            <h2 className="mt-3 text-lg font-bold text-slate-900">The board is for sharers only</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
              {counted
                ? "You've played — now post your score card to LinkedIn to see where you landed."
                : "Play the quiz, then post your score card to LinkedIn to see where you landed."}
            </p>
            <Link
              href={counted ? `/q/${slug}/results/${counted.id}` : `/q/${slug}/play`}
              className="mt-5 inline-block rounded-full bg-accent px-6 py-2.5 font-semibold text-white transition hover:bg-accent-strong"
            >
              {counted ? "Go post your score" : "Play now"}
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
