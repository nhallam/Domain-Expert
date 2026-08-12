import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { ScoreCard } from "@/components/ScoreCard";
import { getSession } from "@/lib/auth";
import { getAttemptById, getCountedAttempt, getLeaderboard, getQuizBySlug, getQuestionsWithOptions } from "@/lib/db";
import { shareText, verdictFor } from "@/lib/verdicts";
import { SITE_URL } from "@/lib/constants";
import { ScoreReveal } from "./ScoreReveal";
import { ShareGate } from "./ShareGate";

export const metadata: Metadata = { title: "Your results" };

function Locked({ label }: { label: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 rounded-2xl bg-white/55 backdrop-blur-[3px]">
      <span className="text-2xl">🔒</span>
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <span className="text-xs text-slate-500">Post your score to unlock</span>
    </div>
  );
}

export default async function ResultsPage({ params }: PageProps<"/q/[slug]/results/[attemptId]">) {
  const { slug, attemptId } = await params;
  const quiz = getQuizBySlug(slug);
  const attempt = getAttemptById(attemptId);
  if (!quiz || quiz.status !== "published" || !attempt || attempt.quizId !== quiz.id) notFound();

  const user = await getSession();
  if (!user) redirect(`/signin?next=${encodeURIComponent(`/q/${slug}/results/${attemptId}`)}`);
  if (attempt.userId !== user.id) redirect(`/q/${slug}`); // results are private to the player

  const verdict = verdictFor(attempt.score, attempt.maxScore, quiz.industry);
  const isCreator = quiz.creatorId === user.id;
  const counted = getCountedAttempt(quiz.id, user.id);
  const unlocked = isCreator || !!counted?.sharedAt;
  const isCountedAttempt = counted?.id === attempt.id;

  const leaderboard = getLeaderboard(quiz.id);
  const myRow = leaderboard.find((r) => r.userId === user.id);
  const percentile = myRow ? Math.max(1, Math.ceil((myRow.rank / leaderboard.length) * 100)) : null;

  const questions = getQuestionsWithOptions(quiz.id);
  const answerByQuestion = new Map(attempt.answers.map((a) => [a.questionId, a]));

  const cardImageUrl = `/api/og/result/${attempt.id}`;
  const defaultPost = shareText(quiz.title, attempt.score, attempt.maxScore, quiz.industry, `https://${SITE_URL}/q/${quiz.slug}`);

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        {attempt.isReplay && (
          <div className="anim-fade-up mb-6 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
            <span>🔁 Practice run — replays never touch the leaderboard.</span>
            {counted && (
              <Link href={`/q/${slug}/results/${counted.id}`} className="font-semibold underline">
                See your counted attempt
              </Link>
            )}
          </div>
        )}

        <div className="anim-fade-up rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <p className="mb-1 text-center text-sm font-semibold text-slate-500">{quiz.title}</p>
          <ScoreReveal score={attempt.score} maxScore={attempt.maxScore} verdict={verdict} />

          <div className="mx-auto mt-8 max-w-md">
            <ScoreCard
              quizTitle={quiz.title}
              industry={quiz.industry}
              name={user.name}
              headline={user.headline}
              avatarUrl={user.avatarUrl}
              score={attempt.score}
              maxScore={attempt.maxScore}
              verdict={verdict}
            />
            <p className="mt-2 text-center text-xs text-slate-400">Your score card — this is what your network sees.</p>
          </div>

          {!unlocked && isCountedAttempt && (
            <div className="mt-8">
              <ShareGate
                attemptId={attempt.id}
                defaultText={defaultPost}
                cardImageUrl={cardImageUrl}
                user={{ name: user.name, headline: user.headline, avatarUrl: user.avatarUrl }}
              />
              <p className="mt-3 text-center text-xs text-slate-400">
                <Link href={`/q/${slug}`} className="underline decoration-dotted hover:text-slate-600">
                  skip for now
                </Link>{" "}
                — you can always post later from this page
              </p>
            </div>
          )}
          {!unlocked && !isCountedAttempt && counted && (
            <p className="mt-8 text-center text-sm text-slate-500">
              Post your{" "}
              <Link href={`/q/${slug}/results/${counted.id}`} className="font-semibold text-accent underline">
                counted attempt
              </Link>{" "}
              to unlock the leaderboard and answer review.
            </p>
          )}
        </div>

        {/* Placement + percentile */}
        <section className="relative mt-6">
          <div className={`grid grid-cols-2 gap-3 ${!unlocked ? "select-none" : ""}`}>
            <div className="relative rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
              <p className="text-3xl font-extrabold text-slate-900">
                {unlocked ? (myRow ? `#${myRow.rank}` : "—") : "#?"}
              </p>
              <p className="text-xs font-medium text-slate-400">
                {unlocked
                  ? myRow
                    ? `of ${leaderboard.length} on the board`
                    : isCreator
                      ? "creators stay off their own board"
                      : "not on the board"
                  : "your placement"}
              </p>
            </div>
            <div className="relative rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
              <p className="text-3xl font-extrabold text-slate-900">{unlocked && percentile ? `Top ${percentile}%` : "Top ?%"}</p>
              <p className="text-xs font-medium text-slate-400">{unlocked && percentile ? "of players" : "your percentile"}</p>
            </div>
          </div>
          {!unlocked && <Locked label="Placement & percentile" />}
        </section>

        {/* Leaderboard */}
        <section className="relative mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Leaderboard</h2>
            {unlocked && (
              <Link href={`/q/${slug}/leaderboard`} className="text-sm font-semibold text-accent hover:underline">
                Full board →
              </Link>
            )}
          </div>
          <div className={!unlocked ? "select-none" : ""}>
            <LeaderboardTable rows={leaderboard.slice(0, 5)} highlightUserId={unlocked ? user.id : undefined} />
          </div>
          {!unlocked && <Locked label="Leaderboard" />}
        </section>

        {/* Answer review */}
        <section className="relative mt-6 pb-10">
          <h2 className="mb-3 text-lg font-bold text-slate-900">Answer review</h2>
          <div className={`flex flex-col gap-3 ${!unlocked ? "max-h-72 overflow-hidden select-none" : ""}`}>
            {questions.map((q, i) => {
              const a = answerByQuestion.get(q.id);
              const picked = a?.optionId ? q.options.find((o) => o.id === a.optionId) : null;
              const correct = q.options.find((o) => o.isCorrect);
              const gotIt = !!a?.correct;
              return (
                <div key={q.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                        gotIt ? "bg-emerald-500" : "bg-rose-500"
                      }`}
                    >
                      {gotIt ? "✓" : "✗"}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800">
                        <span className="text-slate-400">{i + 1}.</span> {q.text}
                      </p>
                      {!gotIt && (
                        <p className="mt-1.5 text-sm text-rose-600">
                          You picked: {picked ? picked.text : "nothing (time ran out)"}
                        </p>
                      )}
                      <p className={`mt-1 text-sm font-medium text-emerald-700 ${gotIt ? "" : ""}`}>
                        Answer: {correct?.text}
                      </p>
                      {q.explanation && <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{q.explanation}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {!unlocked && <Locked label="Answer review" />}
        </section>

        <div className="mb-12 flex justify-center">
          <Link href={`/q/${slug}`} className="text-sm font-semibold text-slate-500 hover:text-slate-800">
            ← Back to quiz
          </Link>
        </div>
      </main>
    </>
  );
}
