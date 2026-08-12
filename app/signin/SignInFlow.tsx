"use client";

import { useEffect, useState } from "react";
import { signInAsPersona, signInMock } from "@/lib/actions";
import { AVATAR_GRADIENTS, initials } from "@/lib/avatars";
import { INDUSTRIES } from "@/lib/constants";

export type PersonaLite = {
  id: string;
  name: string;
  avatarUrl: string | null;
  headline: string;
};

function LinkedInMark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.55C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.72C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

function PersonaAvatar({ name, avatarUrl, size = 36 }: { name: string; avatarUrl: string | null; size?: number }) {
  const match = /^grad:(\d+)$/.exec(avatarUrl ?? "");
  const [from, to] = AVATAR_GRADIENTS[match ? parseInt(match[1], 10) % AVATAR_GRADIENTS.length : 0];
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.38, background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {initials(name)}
    </span>
  );
}

export function SignInFlow({ personas, next, error }: { personas: PersonaLite[]; next: string; error?: string }) {
  const [stage, setStage] = useState<"start" | "authorizing" | "profile">("start");
  const [name, setName] = useState("");
  const [avatarIdx, setAvatarIdx] = useState(0);

  useEffect(() => {
    if (stage !== "authorizing") return;
    const t = setTimeout(() => setStage("profile"), 1400);
    return () => clearTimeout(t);
  }, [stage]);

  if (stage === "authorizing") {
    return (
      <div className="anim-fade-up flex flex-col items-center gap-5 rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#0A66C2] text-white">
          <LinkedInMark className="h-8 w-8" />
        </span>
        <div>
          <p className="font-semibold text-slate-900">Authorizing with LinkedIn…</p>
          <p className="mt-1 text-sm text-slate-500">Requesting your name, email, and photo</p>
        </div>
        <div className="h-1.5 w-48 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full animate-pulse rounded-full bg-[#0A66C2]" style={{ width: "100%" }} />
        </div>
        <p className="text-xs text-slate-400">Demo mode — nothing actually talks to LinkedIn.</p>
      </div>
    );
  }

  if (stage === "profile") {
    return (
      <div className="anim-fade-up rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0A66C2] text-white">
            <LinkedInMark />
          </span>
          <div>
            <p className="font-bold text-slate-900">Almost there</p>
            <p className="text-xs text-slate-500">
              LinkedIn shares your name and photo — your headline and industry are yours to set.
            </p>
          </div>
        </div>
        <form action={signInMock} className="flex flex-col gap-4">
          <input type="hidden" name="next" value={next} />
          <input type="hidden" name="avatarUrl" value={`grad:${avatarIdx}`} />
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-slate-700">Your name</span>
            <input
              name="name"
              required
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jordan Ellis"
              className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-slate-700">Pick an avatar</span>
            <div className="flex flex-wrap gap-2">
              {AVATAR_GRADIENTS.map(([from, to], i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setAvatarIdx(i)}
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white transition ${
                    avatarIdx === i ? "ring-2 ring-accent ring-offset-2" : "opacity-80 hover:opacity-100"
                  }`}
                  style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                  aria-label={`Avatar style ${i + 1}`}
                >
                  {initials(name || "You")}
                </button>
              ))}
            </div>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-slate-700">
              Headline <span className="font-normal text-slate-400">(job title @ company)</span>
            </span>
            <input
              name="headline"
              required
              maxLength={120}
              placeholder="Supply Chain Director @ Acme"
              className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-slate-700">Industry</span>
            <select
              name="industry"
              required
              defaultValue=""
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-accent focus:ring-2 focus:ring-indigo-100"
            >
              <option value="" disabled>
                Select your industry…
              </option>
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="mt-1 rounded-full bg-accent px-5 py-2.5 font-semibold text-white transition hover:bg-accent-strong"
          >
            Continue
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="anim-fade-up rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      {error === "missing" && (
        <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          Please fill in your name, headline, and industry.
        </p>
      )}
      <button
        onClick={() => setStage("authorizing")}
        className="relative flex w-full items-center justify-center gap-2.5 rounded-full bg-[#0A66C2] px-5 py-3 font-semibold text-white transition hover:bg-[#084d92]"
      >
        <LinkedInMark />
        Sign in with LinkedIn
        <span className="absolute -right-2 -top-2 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-amber-950 shadow">
          DEMO
        </span>
      </button>
      <p className="mt-3 text-center text-xs text-slate-400">
        Mocked for the demo — you&apos;ll pick a name and headline, nothing touches LinkedIn.
      </p>

      {personas.length > 0 && (
        <>
          <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            Quick sign in as…
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="flex flex-col gap-2">
            {personas.map((p) => (
              <form key={p.id} action={signInAsPersona}>
                <input type="hidden" name="userId" value={p.id} />
                <input type="hidden" name="next" value={next} />
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 text-left transition hover:border-indigo-200 hover:bg-indigo-50/50"
                >
                  <PersonaAvatar name={p.name} avatarUrl={p.avatarUrl} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-800">{p.name}</span>
                    <span className="block truncate text-xs text-slate-500">{p.headline}</span>
                  </span>
                  <span className="ml-auto text-xs font-semibold text-accent">Sign in →</span>
                </button>
              </form>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
