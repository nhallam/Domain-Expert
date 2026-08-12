"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PlayAnswer, PlayEngine } from "@/components/PlayEngine";
import { publishQuiz, saveDraft } from "@/lib/actions";
import { INDUSTRIES, MAX_OPTIONS, MAX_QUESTIONS, MIN_QUESTIONS } from "@/lib/constants";
import { creatorPostDraft } from "@/lib/verdicts";
import type { DraftQuestion, DraftQuiz } from "@/lib/types";

const emptyQuestion = (): DraftQuestion => ({
  text: "",
  explanation: "",
  options: [
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
  ],
});

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard unavailable */
        }
      }}
      className="shrink-0 rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-accent-strong"
    >
      {copied ? "Copied ✓" : label}
    </button>
  );
}

export function Builder({ initialQuizId, initialDraft }: { initialQuizId: string | null; initialDraft: DraftQuiz | null }) {
  const [draft, setDraft] = useState<DraftQuiz>(
    initialDraft ?? { title: "", description: "", industry: "", questions: [emptyQuestion()] }
  );
  const [quizId, setQuizId] = useState<string | null>(initialQuizId);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewNonce, setPreviewNonce] = useState(0);
  const [previewScore, setPreviewScore] = useState<{ score: number; max: number } | null>(null);

  const quizIdRef = useRef(quizId);
  quizIdRef.current = quizId;
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const skipNextSave = useRef(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSave = useCallback(async () => {
    const d = draftRef.current;
    if (!d.title.trim() || !d.industry) return; // nothing worth saving yet
    setSaveState("saving");
    const result = await saveDraft(quizIdRef.current, d);
    if (result.error) {
      setSaveState("error");
      setSaveError(result.error);
    } else {
      if (result.quizId) setQuizId(result.quizId);
      setSaveState("saved");
      setSaveError(null);
    }
  }, []);

  // Debounced autosave
  useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    if (publishedSlug) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(doSave, 1200);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [draft, doSave, publishedSlug]);

  const update = (patch: Partial<DraftQuiz>) => setDraft((d) => ({ ...d, ...patch }));
  const updateQuestion = (i: number, patch: Partial<DraftQuestion>) =>
    setDraft((d) => ({ ...d, questions: d.questions.map((q, j) => (j === i ? { ...q, ...patch } : q)) }));

  const moveQuestion = (i: number, dir: -1 | 1) =>
    setDraft((d) => {
      const j = i + dir;
      if (j < 0 || j >= d.questions.length) return d;
      const questions = [...d.questions];
      [questions[i], questions[j]] = [questions[j], questions[i]];
      return { ...d, questions };
    });

  const removeQuestion = (i: number) =>
    setDraft((d) => ({ ...d, questions: d.questions.filter((_, j) => j !== i) }));

  const previewQuestions = useMemo(
    () =>
      draft.questions
        .filter((q) => q.text.trim() && q.options.filter((o) => o.text.trim()).length >= 2)
        .map((q, i) => ({
          id: `preview-${i}`,
          text: q.text,
          explanation: q.explanation || null,
          options: q.options
            .filter((o) => o.text.trim())
            .map((o, j) => ({ id: `preview-${i}-${j}`, text: o.text, isCorrect: o.isCorrect })),
        })),
    [draft.questions]
  );

  const handlePreviewComplete = useCallback(
    (answers: PlayAnswer[]) => {
      let score = 0;
      for (const a of answers) {
        const [, qi, oi] = a.optionId?.split("-") ?? [];
        if (qi !== undefined && oi !== undefined && previewQuestions[+qi]?.options[+oi]?.isCorrect) score++;
      }
      setPreviewScore({ score, max: previewQuestions.length });
    },
    [previewQuestions]
  );

  async function handlePublish() {
    setPublishing(true);
    setPublishError(null);
    const result = await publishQuiz(quizId ?? "", draft);
    setPublishing(false);
    if (result.error) setPublishError(result.error);
    else if (result.slug) setPublishedSlug(result.slug);
  }

  // ---------- Published confirmation ----------
  if (publishedSlug) {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/q/${publishedSlug}`;
    const postDraft = creatorPostDraft(draft.title, draft.industry, url);
    return (
      <div className="anim-fade-up mx-auto max-w-xl">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="anim-pop text-5xl">🚀</p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">Your quiz is live!</h1>
          <p className="mt-1 text-sm text-slate-500">Share the link and let your network embarrass themselves.</p>

          <div className="mt-6 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 pl-4">
            <span className="min-w-0 flex-1 truncate text-left text-sm font-medium text-slate-600">{url}</span>
            <CopyButton value={url} label="Copy link" />
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Your LinkedIn post, pre-written</p>
              <CopyButton value={postDraft} label="Copy post" />
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{postDraft}</p>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href={`/q/${publishedSlug}`}
              className="rounded-full bg-accent px-6 py-2.5 font-semibold text-white transition hover:bg-accent-strong"
            >
              View your quiz →
            </Link>
            <Link
              href="/me"
              className="rounded-full border border-slate-300 px-6 py-2.5 font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              My quizzes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Preview mode ----------
  if (previewing) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-slate-950 px-4 py-6">
        <div className="mx-auto flex w-full max-w-lg items-center justify-between text-sm">
          <button onClick={() => { setPreviewing(false); setPreviewScore(null); }} className="font-semibold text-slate-400 hover:text-white">
            ✕ Back to editing
          </button>
          <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-bold text-indigo-300">PREVIEW</span>
        </div>
        <div className="flex flex-1 flex-col justify-center py-8">
          {previewScore ? (
            <div className="mx-auto flex flex-col items-center gap-4 text-center">
              <p className="text-6xl font-extrabold text-white">
                {previewScore.score}
                <span className="text-3xl text-slate-500">/{previewScore.max}</span>
              </p>
              <p className="text-slate-300">That&apos;s how your quiz will feel. Ready to ship it?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setPreviewScore(null); setPreviewNonce((n) => n + 1); }}
                  className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Replay preview
                </button>
                <button
                  onClick={() => { setPreviewing(false); setPreviewScore(null); }}
                  className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-accent-strong"
                >
                  Back to editing
                </button>
              </div>
            </div>
          ) : (
            <PlayEngine key={previewNonce} questions={previewQuestions} onComplete={handlePreviewComplete} badge="Preview" />
          )}
        </div>
      </div>
    );
  }

  // ---------- Editor ----------
  return (
    <div className="mx-auto max-w-2xl pb-24">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Build your challenge</h1>
          <p className="text-sm text-slate-500">
            {MIN_QUESTIONS}–{MAX_QUESTIONS} questions · 2–4 answers each · autosaves as you go
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
            saveState === "saving"
              ? "bg-slate-100 text-slate-500"
              : saveState === "saved"
                ? "bg-emerald-50 text-emerald-600"
                : saveState === "error"
                  ? "bg-rose-50 text-rose-600"
                  : "bg-slate-100 text-slate-400"
          }`}
        >
          {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Draft saved ✓" : saveState === "error" ? "Save failed" : "Draft"}
        </span>
      </div>
      {saveError && <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{saveError}</p>}

      {/* Metadata */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-slate-700">Quiz title</span>
          <input
            value={draft.title}
            onChange={(e) => update({ title: e.target.value })}
            maxLength={80}
            placeholder='e.g. "Only a real supply chain manager gets 10/10"'
            className="rounded-lg border border-slate-300 px-3 py-2 font-medium text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-indigo-100"
          />
        </label>
        <label className="mt-4 flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-slate-700">
            Description <span className="font-normal text-slate-400">(optional)</span>
          </span>
          <textarea
            value={draft.description}
            onChange={(e) => update({ description: e.target.value })}
            maxLength={280}
            rows={2}
            placeholder="Trash talk welcome. What makes this quiz brutal?"
            className="resize-none rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-indigo-100"
          />
        </label>
        <label className="mt-4 flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-slate-700">Industry</span>
          <select
            value={draft.industry}
            onChange={(e) => update({ industry: e.target.value })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-indigo-100"
          >
            <option value="" disabled>
              Select an industry…
            </option>
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Questions */}
      <div className="mt-6 flex flex-col gap-4">
        {draft.questions.map((q, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-400">Question {i + 1}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveQuestion(i, -1)}
                  disabled={i === 0}
                  className="rounded-lg px-2 py-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveQuestion(i, 1)}
                  disabled={i === draft.questions.length - 1}
                  className="rounded-lg px-2 py-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                  aria-label="Move down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeQuestion(i)}
                  disabled={draft.questions.length <= 1}
                  className="rounded-lg px-2 py-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
                  aria-label="Delete question"
                >
                  🗑
                </button>
              </div>
            </div>

            <textarea
              value={q.text}
              onChange={(e) => updateQuestion(i, { text: e.target.value })}
              maxLength={300}
              rows={2}
              placeholder="The question. Make it something only an insider would know."
              className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 font-medium text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-indigo-100"
            />

            <div className="mt-3 flex flex-col gap-2">
              {q.options.map((o, j) => (
                <div key={j} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${i}`}
                    checked={o.isCorrect}
                    onChange={() =>
                      updateQuestion(i, { options: q.options.map((oo, jj) => ({ ...oo, isCorrect: jj === j })) })
                    }
                    className="h-4 w-4 shrink-0 accent-emerald-600"
                    title="Mark as the correct answer"
                  />
                  <input
                    value={o.text}
                    onChange={(e) =>
                      updateQuestion(i, { options: q.options.map((oo, jj) => (jj === j ? { ...oo, text: e.target.value } : oo)) })
                    }
                    maxLength={120}
                    placeholder={o.isCorrect ? "The correct answer" : "A plausible wrong answer"}
                    className={`min-w-0 flex-1 rounded-lg border px-3 py-1.5 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-indigo-100 ${
                      o.isCorrect ? "border-emerald-300 bg-emerald-50/50" : "border-slate-300"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateQuestion(i, {
                        options: q.options
                          .filter((_, jj) => jj !== j)
                          .map((oo, jj2, arr) => ({ ...oo, isCorrect: arr.some((x) => x.isCorrect) ? oo.isCorrect : jj2 === 0 })),
                      })
                    }
                    disabled={q.options.length <= 2}
                    className="shrink-0 rounded-lg px-1.5 py-1 text-slate-300 transition hover:text-rose-500 disabled:opacity-0"
                    aria-label="Remove answer"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {q.options.length < MAX_OPTIONS && (
                <button
                  type="button"
                  onClick={() => updateQuestion(i, { options: [...q.options, { text: "", isCorrect: false }] })}
                  className="self-start rounded-lg px-2 py-1 text-sm font-semibold text-accent transition hover:bg-indigo-50"
                >
                  + Add answer
                </button>
              )}
            </div>

            <input
              value={q.explanation}
              onChange={(e) => updateQuestion(i, { explanation: e.target.value })}
              maxLength={500}
              placeholder="Explanation shown after answering (optional, but the good quizzes have them)"
              className="mt-3 w-full rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-700 outline-none transition focus:border-solid focus:border-accent focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        ))}
      </div>

      {draft.questions.length < MAX_QUESTIONS && (
        <button
          type="button"
          onClick={() => setDraft((d) => ({ ...d, questions: [...d.questions, emptyQuestion()] }))}
          className="mt-4 w-full rounded-2xl border-2 border-dashed border-slate-300 py-3 font-semibold text-slate-500 transition hover:border-indigo-300 hover:text-accent"
        >
          + Add question ({draft.questions.length}/{MAX_QUESTIONS})
        </button>
      )}

      {publishError && (
        <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{publishError}</p>
      )}

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <span className="text-xs text-slate-400">
            {draft.questions.length} question{draft.questions.length === 1 ? "" : "s"}
            {draft.questions.length < MIN_QUESTIONS && ` — ${MIN_QUESTIONS - draft.questions.length} more to publish`}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setPreviewing(true); setPreviewNonce((n) => n + 1); }}
              disabled={previewQuestions.length === 0}
              className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
            >
              ▶ Preview
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing}
              className="rounded-full bg-accent px-6 py-2 text-sm font-bold text-white transition hover:bg-accent-strong disabled:opacity-60"
            >
              {publishing ? "Publishing…" : "Publish 🚀"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
