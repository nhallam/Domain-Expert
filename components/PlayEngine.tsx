"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QUESTION_TIME_MS } from "@/lib/constants";

// The play engine is deliberately self-contained and prop-driven so the real
// play page and the builder's preview mode share the exact same experience.

export type PlayQuestion = {
  id: string;
  text: string;
  explanation: string | null;
  options: { id: string; text: string; isCorrect: boolean }[];
};

export type PlayAnswer = { questionId: string; optionId: string | null; timeMs: number };

const REVEAL_MS = 2500;
const TICK_MS = 100;
const URGENT_MS = 5000;

export function PlayEngine({
  questions,
  onComplete,
  badge,
}: {
  questions: PlayQuestion[];
  onComplete: (answers: PlayAnswer[]) => void;
  badge?: string;
}) {
  const [stage, setStage] = useState<"countdown" | "playing" | "done">("countdown");
  const [countdown, setCountdown] = useState(3);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"question" | "reveal">("question");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [remainingMs, setRemainingMs] = useState(QUESTION_TIME_MS);
  const [streak, setStreak] = useState(0);

  const answersRef = useRef<PlayAnswer[]>([]);
  const startRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const advanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completedRef = useRef(false);

  const question = questions[index];
  const correctOption = useMemo(() => question?.options.find((o) => o.isCorrect), [question]);

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (advanceRef.current) clearTimeout(advanceRef.current);
    timerRef.current = null;
    advanceRef.current = null;
  }, []);

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    clearTimers();
    setStage("done");
    onComplete(answersRef.current);
  }, [clearTimers, onComplete]);

  const goNext = useCallback(() => {
    if (advanceRef.current) clearTimeout(advanceRef.current);
    advanceRef.current = null;
    if (index + 1 >= questions.length) {
      finish();
    } else {
      setIndex((i) => i + 1);
      setPhase("question");
      setSelectedId(null);
      setRemainingMs(QUESTION_TIME_MS);
    }
  }, [index, questions.length, finish]);

  const answer = useCallback(
    (optionId: string | null) => {
      if (phase !== "question" || !question) return;
      if (answersRef.current.some((a) => a.questionId === question.id)) return;
      clearTimers();
      const timeMs = Math.min(QUESTION_TIME_MS, Math.max(0, Date.now() - startRef.current));
      answersRef.current = [...answersRef.current, { questionId: question.id, optionId, timeMs }];
      const isCorrect = !!optionId && optionId === correctOption?.id;
      setStreak((s) => (isCorrect ? s + 1 : 0));
      setSelectedId(optionId);
      setPhase("reveal");
      advanceRef.current = setTimeout(goNext, REVEAL_MS + (question.explanation ? 900 : 0));
    },
    [phase, question, correctOption, clearTimers, goNext]
  );

  // Countdown → playing
  useEffect(() => {
    if (stage !== "countdown") return;
    if (countdown <= 0) {
      setStage("playing");
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 550);
    return () => clearTimeout(t);
  }, [stage, countdown]);

  // Per-question timer
  useEffect(() => {
    if (stage !== "playing" || phase !== "question") return;
    startRef.current = Date.now();
    setRemainingMs(QUESTION_TIME_MS);
    timerRef.current = setInterval(() => {
      const left = QUESTION_TIME_MS - (Date.now() - startRef.current);
      if (left <= 0) {
        setRemainingMs(0);
        answer(null); // timeout = wrong
      } else {
        setRemainingMs(left);
      }
    }, TICK_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, phase, index]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  if (stage === "countdown") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        {badge && <p className="text-sm font-semibold uppercase tracking-widest text-indigo-300">{badge}</p>}
        <p key={countdown} className="anim-pop text-7xl font-extrabold text-white">
          {countdown > 0 ? countdown : "Go!"}
        </p>
        <p className="text-sm text-slate-400">20 seconds per question. No going back.</p>
      </div>
    );
  }

  if (stage === "done" || !question) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <p className="anim-pulse-glow text-4xl">🧮</p>
        <p className="font-semibold text-slate-200">Scoring your run…</p>
      </div>
    );
  }

  const urgent = phase === "question" && remainingMs <= URGENT_MS;
  const pct = (remainingMs / QUESTION_TIME_MS) * 100;
  const isCorrectPick = selectedId !== null && selectedId === correctOption?.id;
  const timedOut = phase === "reveal" && selectedId === null;

  return (
    <div className="mx-auto w-full max-w-lg">
      {/* Progress + streak */}
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-300">
          {index + 1} <span className="text-slate-500">of {questions.length}</span>
        </span>
        {streak >= 3 && (
          <span key={streak} className="anim-streak rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-300">
            🔥 {streak} in a row
          </span>
        )}
      </div>
      <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-indigo-400 transition-all duration-300"
          style={{ width: `${((index + (phase === "reveal" ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>

      {/* Timer */}
      <div className="mb-6">
        <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
          <span className={urgent ? "text-rose-400" : "text-slate-400"}>
            {phase === "question" ? `${Math.ceil(remainingMs / 1000)}s` : timedOut ? "Time's up!" : " "}
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
          <div
            className={`timer-bar h-full rounded-full ${urgent ? "urgent bg-rose-500" : "bg-emerald-400"}`}
            style={{ width: `${phase === "reveal" ? 0 : pct}%`, transitionDuration: `${TICK_MS}ms` }}
          />
        </div>
      </div>

      {/* Question */}
      <div key={question.id} className="anim-fade-up">
        <h2 className={`mb-6 text-xl font-bold leading-snug text-white sm:text-2xl ${urgent ? "anim-pulse-glow" : ""}`}>
          {question.text}
        </h2>

        <div className="flex flex-col gap-3">
          {question.options.map((option) => {
            const isSelected = option.id === selectedId;
            const revealCorrect = phase === "reveal" && option.isCorrect;
            const revealWrong = phase === "reveal" && isSelected && !option.isCorrect;
            let cls =
              "w-full rounded-2xl border px-4 py-3.5 text-left font-medium transition sm:px-5 ";
            if (phase === "question") {
              cls += "border-white/15 bg-white/5 text-slate-100 hover:border-indigo-300 hover:bg-indigo-500/20 active:scale-[0.99]";
            } else if (revealCorrect) {
              cls += "anim-pop border-emerald-400 bg-emerald-500/20 text-emerald-100";
            } else if (revealWrong) {
              cls += "anim-shake border-rose-400 bg-rose-500/20 text-rose-100";
            } else {
              cls += "border-white/5 bg-white/[0.03] text-slate-500";
            }
            return (
              <button key={option.id} data-testid="answer-option" disabled={phase === "reveal"} onClick={() => answer(option.id)} className={cls}>
                <span className="flex items-center justify-between gap-3">
                  <span>{option.text}</span>
                  {revealCorrect && <span className="shrink-0 text-lg">✓</span>}
                  {revealWrong && <span className="shrink-0 text-lg">✗</span>}
                </span>
              </button>
            );
          })}
        </div>

        {phase === "reveal" && (
          <div className="anim-fade-up mt-5">
            <p className={`text-center text-lg font-extrabold ${isCorrectPick ? "text-emerald-300" : "text-rose-300"}`}>
              {isCorrectPick
                ? streak >= 3
                  ? `Correct — ${streak} straight! 🔥`
                  : "Correct! 🎯"
                : timedOut
                  ? "Out of time ⏰"
                  : "Not this time 😬"}
            </p>
            {question.explanation && (
              <p className="mx-auto mt-3 max-w-md rounded-xl bg-white/5 px-4 py-3 text-center text-sm leading-relaxed text-slate-300">
                {question.explanation}
              </p>
            )}
            <button
              onClick={goNext}
              className="mx-auto mt-4 block rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              {index + 1 >= questions.length ? "See my score →" : "Next →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
