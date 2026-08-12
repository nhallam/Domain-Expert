"use client";

import { useEffect, useRef, useState } from "react";

export function ScoreReveal({ score, maxScore, verdict }: { score: number; maxScore: number; verdict: string }) {
  const [shown, setShown] = useState(0);
  const [done, setDone] = useState(score === 0);
  const raf = useRef(0);

  useEffect(() => {
    const duration = 900;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(eased * score));
      if (t < 1) raf.current = requestAnimationFrame(tick);
      else setDone(true);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [score]);

  const pct = maxScore > 0 ? score / maxScore : 0;

  return (
    <div className="text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">Your score</p>
      <p className={`mt-1 text-7xl font-extrabold tabular-nums tracking-tight text-slate-900 ${done ? "anim-pop" : ""}`}>
        {shown}
        <span className="text-4xl text-slate-400">/{maxScore}</span>
      </p>
      <p
        className={`mx-auto mt-3 max-w-sm text-lg font-bold ${
          pct >= 0.7 ? "text-emerald-600" : pct >= 0.4 ? "text-amber-600" : "text-rose-500"
        } ${done ? "anim-fade-up" : "opacity-0"}`}
      >
        {verdict}
      </p>
    </div>
  );
}
