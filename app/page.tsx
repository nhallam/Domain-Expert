import Link from "next/link";
import { Header } from "@/components/Header";
import { QuizCard } from "@/components/QuizCard";
import { getPublishedQuizzes, questionCount } from "@/lib/db";
import { SITE_NAME } from "@/lib/constants";

export default function Home() {
  const quizzes = getPublishedQuizzes();
  const demoQuiz = quizzes[0];

  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-slate-950 text-white">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                "radial-gradient(60% 80% at 20% 10%, rgba(99,102,241,0.5), transparent 60%), radial-gradient(50% 70% at 85% 30%, rgba(168,85,247,0.35), transparent 60%)",
            }}
          />
          <div className="relative mx-auto max-w-5xl px-4 py-16 sm:py-24">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold tracking-wide text-indigo-200">
              🎯 Industry trivia for LinkedIn
              <span className="rounded-full bg-amber-400/90 px-1.5 py-px text-[10px] font-bold text-amber-950">DEMO</span>
            </p>
            <h1 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Prove you actually know <span className="text-indigo-400">your industry.</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-slate-300">
              Build a quiz only a real pro in your field could ace. Share it on LinkedIn. Watch your network scramble to
              beat your score — under their real name, real title, real stakes.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/create"
                className="rounded-full bg-accent px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:bg-accent-strong"
              >
                Create a quiz
              </Link>
              {demoQuiz && (
                <Link
                  href={`/q/${demoQuiz.slug}`}
                  className="rounded-full border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
                >
                  Try a demo quiz →
                </Link>
              )}
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-400">
              <span>① Create your challenge</span>
              <span>② Post it on LinkedIn</span>
              <span>③ Your network plays as themselves</span>
              <span>④ Scores go public 😈</span>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-12">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Live challenges</h2>
              <p className="text-sm text-slate-500">Made by pros. Played by their networks.</p>
            </div>
          </div>
          {quizzes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
              No quizzes yet. Be the first —{" "}
              <Link href="/create" className="font-semibold text-accent hover:underline">
                create one
              </Link>
              .
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {quizzes.map((quiz) => (
                <QuizCard key={quiz.id} quiz={quiz} questionCount={questionCount(quiz.id)} />
              ))}
            </div>
          )}
        </section>
      </main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-xs text-slate-400">
          <span>
            {SITE_NAME} — playable demo. LinkedIn sign-in and posting are mocked; no data leaves this app.
          </span>
          <span>Built for the feed 📈</span>
        </div>
      </footer>
    </>
  );
}
