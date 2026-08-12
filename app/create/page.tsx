import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { getSession } from "@/lib/auth";
import { getQuizById, getQuestionsWithOptions } from "@/lib/db";
import type { DraftQuiz } from "@/lib/types";
import { Builder } from "./Builder";

export const metadata: Metadata = { title: "Create a quiz" };

export default async function CreatePage({ searchParams }: PageProps<"/create">) {
  const user = await getSession();
  if (!user) redirect("/signin?next=/create");

  const params = await searchParams;
  const draftId = typeof params.draft === "string" ? params.draft : null;

  let initialQuizId: string | null = null;
  let initialDraft: DraftQuiz | null = null;

  if (draftId) {
    const quiz = getQuizById(draftId);
    if (quiz && quiz.creatorId === user.id && quiz.status === "draft") {
      initialQuizId = quiz.id;
      initialDraft = {
        title: quiz.title,
        description: quiz.description ?? "",
        industry: quiz.industry,
        questions: getQuestionsWithOptions(quiz.id).map((q) => ({
          text: q.text,
          explanation: q.explanation ?? "",
          options: q.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
        })),
      };
      if (initialDraft.questions.length === 0) {
        initialDraft.questions = [
          { text: "", explanation: "", options: [{ text: "", isCorrect: true }, { text: "", isCorrect: false }] },
        ];
      }
    }
  }

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <Builder initialQuizId={initialQuizId} initialDraft={initialDraft} />
      </main>
    </>
  );
}
