import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Header } from "@/components/Header";
import { getSession } from "@/lib/auth";
import { getCountedAttempt, getLeaderboard, getQuizBySlug, questionCount } from "@/lib/db";

export async function generateMetadata({ params }: PageProps<"/q/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const quiz = getQuizBySlug(slug);
  if (!quiz || quiz.status !== "published") return {};
  return {
    title: quiz.title,
    description: quiz.description ?? `Can you beat the ${quiz.industry} pros?`,
    openGraph: {
      title: quiz.title,
      description: quiz.description ?? `Can you beat the ${quiz.industry} pros?`,
      images: [`/api/og/quiz/${quiz.slug}`],
    },
  };
}

export default async function QuizLandingPage({ params }: PageProps<"/q/[slug]">) {
  const { slug } = await params;
  const quiz = getQuizBySlug(slug);
  if (!quiz || quiz.status !== "published") notFound();

  const user = await getSession();
  const nQuestions = questionCount(quiz.id);
  const minutes = Math.max(1, Math.round((nQuestions * 20) / 60));
  const top3 = getLeaderboard(quiz.id).slice(0, 3);
  const existing = user ? getCountedAttempt(quiz.id, user.id) : null;
  const isCreator = user?.id === quiz.creatorId;

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:py-12">
        <div className="anim-fade-up rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            {quiz.industry}
          </span>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl">
            {quiz.title}
          </h1>
          {quiz.description && <p className="mt-3 text-slate-600">{quiz.description}</p>}

          <div className="mt-6 flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
            <Avatar name={quiz.creatorName} avatarUrl={quiz.creatorAvatarUrl} size={44} />
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800">{quiz.creatorName}</p>
              <p className="truncate text-xs text-slate-500">{quiz.creatorHeadline}</p>
            </div>
            <span className="ml-auto hidden rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm sm:inline">
              Quiz creator
            </span>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
              <p className="text-xl font-extrabold text-slate-900">{nQuestions}</p>
              <p className="text-xs font-medium text-slate-400">questions</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
              <p className="text-xl font-extrabold text-slate-900">~{minutes} min</p>
              <p className="text-xs font-medium text-slate-400">20s per question</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
              <p className="text-xl font-extrabold text-slate-900">{quiz.playCount}</p>
              <p className="text-xs font-medium text-slate-400">plays</p>
            </div>
          </div>

          {top3.length > 0 && (
            <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-amber-700">🏆 Top of the board</p>
              <ol className="flex flex-col gap-2">
                {top3.map((row) => (
                  <li key={row.userId} className="flex items-center gap-2.5 text-sm">
                    <span className="w-5 text-center font-bold text-amber-600">{row.rank}</span>
                    <Avatar name={row.name} avatarUrl={row.avatarUrl} size={26} />
                    <span className="min-w-0 truncate font-semibold text-slate-800">{row.name}</span>
                    <span className="truncate text-xs text-slate-400">{row.headline}</span>
                    <span className="ml-auto shrink-0 font-bold text-slate-900">
                      {row.score}/{row.maxScore}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-xs text-amber-700/80">Post your score to see the full leaderboard.</p>
            </div>
          )}

          <div className="mt-8 flex flex-col items-stretch gap-3">
            {existing ? (
              <>
                <Link
                  href={`/q/${quiz.slug}/results/${existing.id}`}
                  className="rounded-full bg-accent px-6 py-3.5 text-center text-lg font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-accent-strong"
                >
                  You scored {existing.score}/{existing.maxScore} — see your results
                </Link>
                <Link
                  href={`/q/${quiz.slug}/play`}
                  className="rounded-full border border-slate-300 px-6 py-2.5 text-center text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Play again <span className="text-slate-400">(replays don&apos;t count on the leaderboard)</span>
                </Link>
              </>
            ) : (
              <Link
                href={`/q/${quiz.slug}/play`}
                className="anim-pop rounded-full bg-accent px-6 py-3.5 text-center text-lg font-bold text-white shadow-lg shadow-indigo-200 transition hover:scale-[1.01] hover:bg-accent-strong"
              >
                ▶ Play now
              </Link>
            )}
            {isCreator && (
              <p className="text-center text-xs text-slate-400">
                This is your quiz — your plays are practice runs and stay off the leaderboard.
              </p>
            )}
            {!user && <p className="text-center text-xs text-slate-400">You&apos;ll sign in before playing — scores are public, that&apos;s the fun part.</p>}
          </div>
        </div>
      </main>
    </>
  );
}
