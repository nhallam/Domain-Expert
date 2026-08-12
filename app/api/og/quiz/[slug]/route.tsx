import { ImageResponse } from "next/og";
import { avatarGradient, initials } from "@/lib/avatars";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { getLeaderboard, getQuizBySlug, questionCount } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const quiz = getQuizBySlug(slug);
  if (!quiz || quiz.status !== "published") return new Response("Not found", { status: 404 });

  const nQuestions = questionCount(quiz.id);
  const top = getLeaderboard(quiz.id)[0];
  const challenge = top ? `Can you beat ${top.score}/${top.maxScore}?` : `${nQuestions} questions. 20 seconds each.`;
  const [from, to] = avatarGradient(quiz.creatorAvatarUrl, quiz.creatorName);

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
            "radial-gradient(circle at 15% 0%, rgba(99,102,241,0.45), transparent 55%), radial-gradient(circle at 90% 100%, rgba(168,85,247,0.35), transparent 55%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              backgroundColor: "rgba(99,102,241,0.25)",
              border: "1px solid rgba(129,140,248,0.5)",
              borderRadius: 999,
              padding: "10px 28px",
              fontSize: 28,
              fontWeight: 600,
              color: "#c7d2fe",
            }}
          >
            {quiz.industry} challenge
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 56,
                height: 56,
                borderRadius: 14,
                backgroundColor: "#4f46e5",
                fontSize: 26,
                fontWeight: 700,
              }}
            >
              DX
            </div>
            <span style={{ fontSize: 30, fontWeight: 700, color: "#e2e8f0" }}>{SITE_NAME}</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", fontSize: 64, fontWeight: 800, lineHeight: 1.15, maxWidth: 1000 }}>
            {quiz.title.length > 70 ? quiz.title.slice(0, 67) + "…" : quiz.title}
          </div>
          <div style={{ display: "flex", fontSize: 36, fontWeight: 700, color: "#fbbf24" }}>{challenge}</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 76,
                height: 76,
                borderRadius: 999,
                backgroundImage: `linear-gradient(135deg, ${from}, ${to})`,
                fontSize: 30,
                fontWeight: 700,
              }}
            >
              {initials(quiz.creatorName)}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 28, fontWeight: 700 }}>{quiz.creatorName}</span>
              <span style={{ fontSize: 22, color: "#94a3b8" }}>{quiz.creatorHeadline}</span>
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 24, color: "#64748b" }}>
            {nQuestions} questions · {quiz.playCount} plays · {SITE_URL}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
