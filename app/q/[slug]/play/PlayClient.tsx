"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { PlayAnswer, PlayEngine, PlayQuestion } from "@/components/PlayEngine";
import { submitAttempt } from "@/lib/actions";

export function PlayClient({ slug, quizTitle, questions }: { slug: string; quizTitle: string; questions: PlayQuestion[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleComplete = useCallback(
    async (answers: PlayAnswer[]) => {
      const result = await submitAttempt(slug, answers);
      if (result.attemptId) {
        router.replace(`/q/${slug}/results/${result.attemptId}`);
      } else {
        setError(result.error ?? "Something went wrong saving your attempt.");
      }
    },
    [slug, router]
  );

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-3xl">😵</p>
        <p className="font-semibold text-slate-200">{error}</p>
        <button
          onClick={() => router.push(`/q/${slug}`)}
          className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Back to the quiz
        </button>
      </div>
    );
  }

  return <PlayEngine questions={questions} onComplete={handleComplete} badge={quizTitle} />;
}
