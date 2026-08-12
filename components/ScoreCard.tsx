import { avatarGradient, initials } from "@/lib/avatars";
import { SITE_NAME, SITE_URL } from "@/lib/constants";

// HTML twin of the OG score card image (app/api/og/result). Used for the
// in-page preview; the OG route renders the same design for the share image.
// Sizes use container-query units so the card scales at any width.
export function ScoreCard({
  quizTitle,
  industry,
  name,
  headline,
  avatarUrl,
  score,
  maxScore,
  verdict,
}: {
  quizTitle: string;
  industry: string;
  name: string;
  headline: string;
  avatarUrl: string | null;
  score: number;
  maxScore: number;
  verdict: string;
}) {
  const [from, to] = avatarGradient(avatarUrl, name);
  return (
    <div style={{ containerType: "inline-size" }} className="w-full">
      <div
        className="relative w-full overflow-hidden rounded-2xl text-white shadow-xl"
        style={{ aspectRatio: "1200 / 630", background: "#0f172a" }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 15% 0%, rgba(99,102,241,0.5), transparent 55%), radial-gradient(circle at 90% 100%, rgba(168,85,247,0.35), transparent 55%)",
          }}
        />
        <div className="absolute inset-0 flex flex-col justify-between" style={{ padding: "6cqw" }}>
          <div className="flex items-start justify-between" style={{ gap: "3cqw" }}>
            <div className="min-w-0">
              <p
                className="font-semibold uppercase text-indigo-300"
                style={{ fontSize: "2.2cqw", letterSpacing: "0.35cqw" }}
              >
                {industry} challenge
              </p>
              <p className="line-clamp-2 font-extrabold" style={{ fontSize: "3.7cqw", lineHeight: 1.15, marginTop: "0.8cqw" }}>
                {quizTitle}
              </p>
            </div>
            <span
              className="flex shrink-0 items-center justify-center bg-indigo-600 font-bold"
              style={{ width: "5.3cqw", height: "5.3cqw", borderRadius: "1.3cqw", fontSize: "2.3cqw" }}
            >
              DX
            </span>
          </div>

          <div className="flex items-center justify-between" style={{ gap: "3cqw" }}>
            <div className="flex min-w-0 items-center" style={{ gap: "2.2cqw" }}>
              <span
                className="flex shrink-0 items-center justify-center rounded-full font-bold"
                style={{
                  width: "9.2cqw",
                  height: "9.2cqw",
                  fontSize: "3.7cqw",
                  background: `linear-gradient(135deg, ${from}, ${to})`,
                }}
              >
                {initials(name)}
              </span>
              <div className="min-w-0">
                <p className="truncate font-extrabold" style={{ fontSize: "3.3cqw" }}>
                  {name}
                </p>
                <p className="truncate text-slate-300" style={{ fontSize: "2.2cqw", marginTop: "0.3cqw" }}>
                  {headline}
                </p>
              </div>
            </div>
            <p className="shrink-0 font-extrabold" style={{ fontSize: "12.5cqw", lineHeight: 1 }}>
              {score}
              <span className="font-bold text-slate-500" style={{ fontSize: "5.8cqw" }}>
                /{maxScore}
              </span>
            </p>
          </div>

          <div className="flex items-end justify-between" style={{ gap: "2.5cqw" }}>
            <p className="line-clamp-1 font-bold text-amber-300" style={{ fontSize: "2.8cqw" }}>
              {verdict}
            </p>
            <p className="shrink-0 text-slate-400" style={{ fontSize: "2cqw" }}>
              {SITE_NAME} · {SITE_URL}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
