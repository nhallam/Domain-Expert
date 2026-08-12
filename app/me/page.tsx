import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Header } from "@/components/Header";
import { getSession } from "@/lib/auth";
import { getAttemptsByUser, getQuizzesByCreator, questionCount } from "@/lib/db";

export const metadata: Metadata = { title: "My stuff" };

function fmtDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default async function MePage() {
  const user = await getSession();
  if (!user) redirect("/signin?next=/me");

  const quizzes = getQuizzesByCreator(user.id);
  const attempts = getAttemptsByUser(user.id);

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <div className="mb-8 flex items-center gap-4">
          <Avatar name={user.name} avatarUrl={user.avatarUrl} size={56} />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{user.name}</h1>
            <p className="text-sm text-slate-500">{user.headline}</p>
            <p className="text-xs text-slate-400">{user.industry}</p>
          </div>
        </div>

        <section className="mb-10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">My quizzes</h2>
            <Link href="/create" className="text-sm font-semibold text-accent hover:underline">
              + New quiz
            </Link>
          </div>
          {quizzes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              You haven&apos;t made a quiz yet.{" "}
              <Link href="/create" className="font-semibold text-accent hover:underline">
                Create your first challenge
              </Link>{" "}
              — it takes about five minutes.
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {quizzes.map((q) => (
                <li key={q.id}>
                  <Link
                    href={q.status === "published" ? `/q/${q.slug}` : `/create?draft=${q.id}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-indigo-200"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-800">{q.title || "Untitled quiz"}</p>
                      <p className="text-xs text-slate-400">
                        {q.industry} · {questionCount(q.id)} questions
                      </p>
                    </div>
                    <span className="ml-auto flex shrink-0 items-center gap-3">
                      {q.status === "draft" ? (
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                          Draft — keep editing
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-slate-400">{q.playCount} plays</span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-900">My attempts</h2>
          {attempts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              No quizzes played yet.{" "}
              <Link href="/" className="font-semibold text-accent hover:underline">
                Find one to beat
              </Link>
              .
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {attempts.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/q/${a.quizSlug}/results/${a.id}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-indigo-200"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-800">{a.quizTitle}</p>
                      <p className="text-xs text-slate-400">
                        {a.quizIndustry} · {fmtDuration(a.durationMs)}
                        {a.isReplay && " · replay"}
                        {!a.sharedAt && !a.isReplay && " · not shared yet"}
                      </p>
                    </div>
                    <span className="ml-auto shrink-0 text-lg font-extrabold text-slate-900">
                      {a.score}/{a.maxScore}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
