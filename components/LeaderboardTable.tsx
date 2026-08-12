import type { LeaderboardRow } from "@/lib/types";
import { Avatar } from "./Avatar";

function fmtDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export function LeaderboardTable({ rows, highlightUserId }: { rows: LeaderboardRow[]; highlightUserId?: string }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        Nobody on the board yet. Play, post your score, and claim the top spot. 👑
      </div>
    );
  }
  return (
    <ol className="flex flex-col gap-2">
      {rows.map((row) => {
        const isMe = row.userId === highlightUserId;
        return (
          <li
            key={row.userId}
            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 sm:px-4 ${
              isMe ? "border-indigo-300 bg-indigo-50 shadow-sm" : "border-slate-200 bg-white"
            }`}
          >
            <span className="w-7 shrink-0 text-center text-sm font-extrabold text-slate-500">
              {MEDALS[row.rank - 1] ?? row.rank}
            </span>
            <Avatar name={row.name} avatarUrl={row.avatarUrl} size={34} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-slate-800">
                {row.name}
                {isMe && <span className="ml-1.5 rounded-full bg-indigo-600 px-1.5 py-px text-[10px] font-bold text-white">you</span>}
              </span>
              <span className="block truncate text-xs text-slate-400">{row.headline}</span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block text-sm font-extrabold text-slate-900">
                {row.score}/{row.maxScore}
              </span>
              <span className="block text-xs tabular-nums text-slate-400">{fmtDuration(row.durationMs)}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
