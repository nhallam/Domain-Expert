import Link from "next/link";
import type { QuizWithCreator } from "@/lib/types";
import { Avatar } from "./Avatar";

export function QuizCard({ quiz, questionCount }: { quiz: QuizWithCreator; questionCount: number }) {
  const minutes = Math.max(1, Math.round((questionCount * 20) / 60));
  return (
    <Link
      href={`/q/${quiz.slug}`}
      className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
          {quiz.industry}
        </span>
        <span className="text-xs font-medium text-slate-400">
          {quiz.playCount} play{quiz.playCount === 1 ? "" : "s"}
        </span>
      </div>
      <h3 className="text-lg font-bold leading-snug text-slate-900 group-hover:text-accent">{quiz.title}</h3>
      {quiz.description && <p className="line-clamp-2 text-sm text-slate-500">{quiz.description}</p>}
      <div className="mt-auto flex items-center gap-2 border-t border-slate-100 pt-3">
        <Avatar name={quiz.creatorName} avatarUrl={quiz.creatorAvatarUrl} size={28} />
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-slate-700">{quiz.creatorName}</p>
          <p className="truncate text-xs text-slate-400">{quiz.creatorHeadline}</p>
        </div>
        <span className="ml-auto shrink-0 text-xs font-medium text-slate-400">
          {questionCount} Qs · ~{minutes} min
        </span>
      </div>
    </Link>
  );
}
