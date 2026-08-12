"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { shareAttempt } from "@/lib/actions";
import { AVATAR_GRADIENTS, initials } from "@/lib/avatars";

type ShareUser = { name: string; headline: string; avatarUrl: string | null };

function gradFor(avatarUrl: string | null): [string, string] {
  const m = /^grad:(\d+)$/.exec(avatarUrl ?? "");
  return AVATAR_GRADIENTS[m ? parseInt(m[1], 10) % AVATAR_GRADIENTS.length : 0];
}

function LinkedInMark({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.55C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.72C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

export function ShareGate({
  attemptId,
  defaultText,
  cardImageUrl,
  user,
}: {
  attemptId: string;
  defaultText: string;
  cardImageUrl: string;
  user: ShareUser;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(defaultText);
  const [state, setState] = useState<"idle" | "posting" | "posted">("idle");
  const [error, setError] = useState<string | null>(null);
  const [from, to] = gradFor(user.avatarUrl);

  async function post() {
    setState("posting");
    setError(null);
    const result = await shareAttempt(attemptId);
    if (result.error) {
      setError(result.error);
      setState("idle");
      return;
    }
    // Brief fake-post latency so the success beat lands.
    setTimeout(() => {
      setState("posted");
      setTimeout(() => {
        setOpen(false);
        router.refresh();
      }, 1600);
    }, 900);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative mx-auto flex w-full max-w-sm items-center justify-center gap-2.5 rounded-full bg-[#0A66C2] px-6 py-3 font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-[#084d92]"
      >
        <LinkedInMark className="h-5 w-5" />
        Post to LinkedIn to unlock
        <span className="absolute -right-2 -top-2 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-amber-950 shadow">
          DEMO
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="anim-fade-up flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
            {/* Mock LinkedIn compose header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded bg-[#0A66C2] text-white">
                  <LinkedInMark />
                </span>
                <span className="font-semibold text-slate-800">Create a post</span>
                <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-amber-950">DEMO</span>
              </div>
              {state !== "posting" && (
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                  </svg>
                </button>
              )}
            </div>

            {state === "posted" ? (
              <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
                <p className="anim-pop text-5xl">🎉</p>
                <p className="text-xl font-bold text-slate-900">Posted!</p>
                <p className="text-sm text-slate-500">
                  Your score card is live on LinkedIn{" "}
                  <span className="cursor-default font-medium text-[#0A66C2] underline decoration-dotted" title="Demo — not a real post">
                    (view post)
                  </span>
                </p>
                <p className="text-xs text-slate-400">Unlocking your results…</p>
              </div>
            ) : (
              <>
                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
                  <div className="mb-3 flex items-center gap-2.5">
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-full font-semibold text-white"
                      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                    >
                      {initials(user.name)}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.headline} · Post to Anyone</p>
                    </div>
                  </div>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={5}
                    disabled={state === "posting"}
                    className="w-full resize-none rounded-lg border border-transparent p-1 text-[15px] leading-relaxed text-slate-800 outline-none transition focus:border-slate-200"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cardImageUrl}
                    alt="Your score card"
                    className="mt-2 w-full rounded-xl border border-slate-200 shadow-sm"
                  />
                  {error && <p className="mt-2 text-sm font-medium text-rose-600">{error}</p>}
                </div>
                <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3">
                  <button
                    onClick={post}
                    disabled={state === "posting"}
                    className="flex items-center gap-2 rounded-full bg-[#0A66C2] px-6 py-2 font-semibold text-white transition hover:bg-[#084d92] disabled:opacity-70"
                  >
                    {state === "posting" && (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    )}
                    {state === "posting" ? "Posting…" : "Post"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
