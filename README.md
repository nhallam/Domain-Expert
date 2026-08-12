# Domain Expert — Industry Trivia for LinkedIn (playable demo)

Prove you actually know your industry. Professionals build trivia quizzes about their field, share them on LinkedIn, and challenge their network to beat their score — playing as themselves, with their real name, photo, and headline on the line.

This is the **v1 playable demo**: the full product loop with LinkedIn sign-in and posting **mocked** behind swappable interfaces, so real LinkedIn OIDC + the Posts API can drop in for v2 without touching the app.

## The loop

1. **Create** a quiz (5–15 questions, 2–4 answers each) in the keyboard-friendly builder — autosaves as a draft, playable in preview, publishes to a shareable link with a pre-written LinkedIn post.
2. **Play** — one question per screen, 20-second timer, instant reveal animations, streaks, explanations. Timeouts count as wrong; abandoning discards the attempt.
3. **Results** — animated score count-up, a verdict by score band, and a generated score card built to look great in a feed.
4. **The share gate** — leaderboard placement, percentile, and answer review stay locked until you "post" your score card via the mock LinkedIn composer (with a quiet "skip for now" escape hatch).
5. **Leaderboard** — ranked by score, ties broken by speed. First attempts only; replays never count; creators stay off their own board; visible only to players who shared.

## Running it

```bash
npm install
npm run dev        # or: npm run build && npm start
```

Open http://localhost:3000. The SQLite database is created and seeded on first request (`data/domain-expert.db`, gitignored) with 5 personas, 3 real quizzes, and enough attempts that leaderboards look alive. Delete the `data/` directory to reset.

**Testing multiplayer feel:** the sign-in page has a "quick sign in as…" switcher with the 5 seeded personas — one click to hop between users.

## Stack

- **Next.js 16** (App Router, server actions, server-rendered pages)
- **SQLite** via better-sqlite3 — schema in `lib/db.ts`, seed content in `lib/seed.ts`
- **Tailwind CSS 4** for styling; hand-rolled CSS keyframes for game feel
- **`next/og`** (satori) for dynamic Open Graph images

## Where things live

| Path | What |
|---|---|
| `lib/auth.ts` | Auth provider interface — mock today, LinkedIn OIDC later. Headline/industry are user-entered by design (LinkedIn OIDC doesn't return them). |
| `lib/actions.ts` | All server actions: sign-in, draft autosave, publish, attempt scoring (server-side), and the swappable share provider |
| `lib/db.ts` / `lib/seed.ts` | Schema, queries, leaderboard rules, seed personas/quizzes/attempts |
| `components/PlayEngine.tsx` | The core play experience — shared by the real play page and the builder's preview mode |
| `app/q/[slug]/…` | Quiz landing, play, results + share gate, leaderboard |
| `app/create` | Quiz builder |
| `app/api/og/…` | OG images: quiz card + score card (1200×630) |

## Swapping in real LinkedIn (v2)

- **Auth:** replace the mock provider in `lib/auth.ts` / the sign-in actions with Sign In with LinkedIn (OpenID Connect, scopes `openid profile email`). The session, User model, and every page stay as-is.
- **Posting:** replace `shareAttempt` in `lib/actions.ts` with a Posts API call (`w_member_social`); set `sharedAt` on success. The unlock contract is unchanged.
- The OG images already rendered per quiz/result become the real link-unfurl images.
