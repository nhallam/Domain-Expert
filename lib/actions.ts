"use server";

import { redirect } from "next/navigation";
import { createSession, destroySession, getSession, upsertMockUser } from "./auth";
import { getCountedAttempt, getDb, getQuizById, getQuizBySlug, getQuestionsWithOptions, getUserById, newId } from "./db";
import { INDUSTRIES, MAX_OPTIONS, MAX_QUESTIONS, MIN_OPTIONS, MIN_QUESTIONS, QUESTION_TIME_MS } from "./constants";
import type { AttemptAnswer, DraftQuiz } from "./types";

function safeNext(next: unknown): string {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

// ---------- Auth ----------

export async function signInMock(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const headline = String(formData.get("headline") ?? "").trim();
  const industry = String(formData.get("industry") ?? "");
  const avatarUrl = String(formData.get("avatarUrl") ?? "grad:0");

  if (!name || !headline || !(INDUSTRIES as readonly string[]).includes(industry)) {
    redirect(`/signin?error=missing&next=${encodeURIComponent(safeNext(formData.get("next")))}`);
  }

  const user = upsertMockUser({ name, headline, industry, avatarUrl });
  await createSession(user.id);
  redirect(safeNext(formData.get("next")));
}

export async function signInAsPersona(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  const user = getUserById(userId);
  if (!user || !user.providerId.startsWith("mock-persona-")) redirect("/signin");
  await createSession(user.id);
  redirect(safeNext(formData.get("next")));
}

export async function signOut() {
  await destroySession();
  redirect("/");
}

// ---------- Quiz builder ----------

function validateDraft(draft: DraftQuiz, forPublish: boolean): string | null {
  if (!draft.title.trim()) return "Give your quiz a title.";
  if (draft.title.length > 80) return "Title must be 80 characters or fewer.";
  if (draft.description.length > 280) return "Description must be 280 characters or fewer.";
  if (!(INDUSTRIES as readonly string[]).includes(draft.industry)) return "Pick an industry.";
  if (draft.questions.length > MAX_QUESTIONS) return `Maximum ${MAX_QUESTIONS} questions.`;
  if (forPublish) {
    if (draft.questions.length < MIN_QUESTIONS) return `You need at least ${MIN_QUESTIONS} questions to publish.`;
    for (let i = 0; i < draft.questions.length; i++) {
      const q = draft.questions[i];
      if (!q.text.trim()) return `Question ${i + 1} is empty.`;
      if (q.text.length > 300) return `Question ${i + 1} is over 300 characters.`;
      if (q.explanation.length > 500) return `Question ${i + 1}'s explanation is over 500 characters.`;
      const opts = q.options.filter((o) => o.text.trim());
      if (opts.length < MIN_OPTIONS) return `Question ${i + 1} needs at least ${MIN_OPTIONS} answers.`;
      if (opts.length > MAX_OPTIONS) return `Question ${i + 1} has more than ${MAX_OPTIONS} answers.`;
      if (opts.some((o) => o.text.length > 120)) return `Question ${i + 1} has an answer over 120 characters.`;
      if (q.options.filter((o) => o.isCorrect && o.text.trim()).length !== 1)
        return `Question ${i + 1} needs exactly one correct answer.`;
    }
  }
  return null;
}

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .split("-")
    .slice(0, 5)
    .join("-");
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base || "quiz"}-${suffix}`;
}

// Replaces the quiz's questions wholesale — simple and correct for autosave.
function writeQuestions(quizId: string, draft: DraftQuiz) {
  const db = getDb();
  db.prepare("DELETE FROM questions WHERE quizId = ?").run(quizId);
  const insertQuestion = db.prepare("INSERT INTO questions (id, quizId, ord, text, explanation) VALUES (?, ?, ?, ?, ?)");
  const insertOption = db.prepare("INSERT INTO answer_options (id, questionId, ord, text, isCorrect) VALUES (?, ?, ?, ?, ?)");
  draft.questions.forEach((q, ord) => {
    const qid = newId();
    insertQuestion.run(qid, quizId, ord, q.text.trim(), q.explanation.trim() || null);
    q.options
      .filter((o) => o.text.trim())
      .forEach((o, oord) => insertOption.run(newId(), qid, oord, o.text.trim(), o.isCorrect ? 1 : 0));
  });
}

export async function saveDraft(quizId: string | null, draft: DraftQuiz): Promise<{ quizId?: string; error?: string }> {
  const user = await getSession();
  if (!user) return { error: "Not signed in." };
  const error = validateDraft(draft, false);
  if (error) return { error };

  const db = getDb();
  let id = quizId;
  if (id) {
    const quiz = getQuizById(id);
    if (!quiz || quiz.creatorId !== user.id) return { error: "Quiz not found." };
    db.prepare("UPDATE quizzes SET title = ?, description = ?, industry = ? WHERE id = ?").run(
      draft.title.trim(),
      draft.description.trim() || null,
      draft.industry,
      id
    );
  } else {
    id = newId();
    db.prepare(
      `INSERT INTO quizzes (id, slug, creatorId, title, description, industry, status, playCount, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, 'draft', 0, ?)`
    ).run(id, slugify(draft.title.trim() || "untitled"), user.id, draft.title.trim(), draft.description.trim() || null, draft.industry, Date.now());
  }

  db.transaction(() => writeQuestions(id!, draft))();
  return { quizId: id };
}

export async function publishQuiz(quizId: string, draft: DraftQuiz): Promise<{ slug?: string; error?: string }> {
  const user = await getSession();
  if (!user) return { error: "Not signed in." };
  const error = validateDraft(draft, true);
  if (error) return { error };

  const saved = await saveDraft(quizId, draft);
  if (saved.error || !saved.quizId) return { error: saved.error ?? "Could not save." };

  const db = getDb();
  db.prepare("UPDATE quizzes SET status = 'published', publishedAt = COALESCE(publishedAt, ?) WHERE id = ?").run(
    Date.now(),
    saved.quizId
  );
  const quiz = getQuizById(saved.quizId)!;
  return { slug: quiz.slug };
}

// ---------- Playing ----------

export type SubmittedAnswer = { questionId: string; optionId: string | null; timeMs: number };

export async function submitAttempt(slug: string, submitted: SubmittedAnswer[]): Promise<{ attemptId?: string; error?: string }> {
  const user = await getSession();
  if (!user) return { error: "Not signed in." };
  const quiz = getQuizBySlug(slug);
  if (!quiz || quiz.status !== "published") return { error: "Quiz not found." };

  const questions = getQuestionsWithOptions(quiz.id);
  const byId = new Map(questions.map((q) => [q.id, q]));

  // Score server-side: the client only reports which option was tapped and when.
  const seen = new Set<string>();
  const answers: AttemptAnswer[] = [];
  for (const s of submitted) {
    const q = byId.get(s.questionId);
    if (!q || seen.has(q.id)) continue;
    seen.add(q.id);
    const option = s.optionId ? q.options.find((o) => o.id === s.optionId) : undefined;
    answers.push({
      questionId: q.id,
      optionId: option?.id ?? null,
      correct: !!option?.isCorrect,
      timeMs: Math.max(0, Math.min(QUESTION_TIME_MS, Math.round(s.timeMs || 0))),
    });
  }
  // Unanswered questions count as timed-out wrongs.
  for (const q of questions) {
    if (!seen.has(q.id)) answers.push({ questionId: q.id, optionId: null, correct: false, timeMs: QUESTION_TIME_MS });
  }

  const score = answers.filter((a) => a.correct).length;
  const durationMs = answers.reduce((sum, a) => sum + a.timeMs, 0);
  const isReplay = !!getCountedAttempt(quiz.id, user.id);

  const attemptId = newId();
  const db = getDb();
  db.prepare(
    `INSERT INTO attempts (id, quizId, userId, score, maxScore, durationMs, answers, isReplay, sharedAt, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)`
  ).run(attemptId, quiz.id, user.id, score, questions.length, durationMs, JSON.stringify(answers), isReplay ? 1 : 0, Date.now());
  db.prepare("UPDATE quizzes SET playCount = playCount + 1 WHERE id = ?").run(quiz.id);

  return { attemptId };
}

// ---------- Sharing (mocked, swappable) ----------

// The mock share provider: in v2 this calls LinkedIn's Posts API and sets
// sharedAt only on a successful post. The unlock contract stays identical.
export async function shareAttempt(attemptId: string): Promise<{ ok?: true; error?: string }> {
  const user = await getSession();
  if (!user) return { error: "Not signed in." };
  const db = getDb();
  const attempt = db.prepare("SELECT id, userId, sharedAt FROM attempts WHERE id = ?").get(attemptId) as
    | { id: string; userId: string; sharedAt: number | null }
    | undefined;
  if (!attempt || attempt.userId !== user.id) return { error: "Attempt not found." };
  if (!attempt.sharedAt) db.prepare("UPDATE attempts SET sharedAt = ? WHERE id = ?").run(Date.now(), attemptId);
  return { ok: true };
}
