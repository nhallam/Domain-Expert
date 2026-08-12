import { ImageResponse } from "next/og";
import { avatarGradient, initials } from "@/lib/avatars";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { getAttemptById, getQuizById, getUserById } from "@/lib/db";
import { verdictFor } from "@/lib/verdicts";

export async function GET(_req: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const attempt = getAttemptById(attemptId);
  const quiz = attempt ? getQuizById(attempt.quizId) : null;
  const player = attempt ? getUserById(attempt.userId) : null;
  if (!attempt || !quiz || !player) return new Response("Not found", { status: 404 });

  const verdict = verdictFor(attempt.score, attempt.maxScore, quiz.industry);
  const [from, to] = avatarGradient(player.avatarUrl, player.name);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          backgroundColor: "#0f172a",
          backgroundImage:
            "radial-gradient(circle at 15% 0%, rgba(99,102,241,0.5), transparent 55%), radial-gradient(circle at 90% 100%, rgba(168,85,247,0.35), transparent 55%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 950 }}>
            <span style={{ fontSize: 26, fontWeight: 600, color: "#a5b4fc", textTransform: "uppercase", letterSpacing: 4 }}>
              {quiz.industry} challenge
            </span>
            <span style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.15 }}>
              {quiz.title.length > 80 ? quiz.title.slice(0, 77) + "…" : quiz.title}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: 16,
              backgroundColor: "#4f46e5",
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            DX
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 26, flexShrink: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 110,
                height: 110,
                borderRadius: 999,
                backgroundImage: `linear-gradient(135deg, ${from}, ${to})`,
                fontSize: 44,
                fontWeight: 700,
              }}
            >
              {initials(player.name)}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 40, fontWeight: 800 }}>{player.name}</span>
              <span style={{ fontSize: 26, color: "#cbd5e1" }}>
                {player.headline.length > 48 ? player.headline.slice(0, 45) + "…" : player.headline}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", flexShrink: 0 }}>
            <span style={{ fontSize: 150, fontWeight: 800, lineHeight: 1 }}>{attempt.score}</span>
            <span style={{ fontSize: 70, fontWeight: 700, color: "#64748b" }}>/{attempt.maxScore}</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 30 }}>
          <span style={{ fontSize: 34, fontWeight: 700, color: "#fcd34d" }}>{verdict}</span>
          <span style={{ fontSize: 24, color: "#64748b", flexShrink: 0 }}>
            {SITE_NAME} · {SITE_URL}
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
