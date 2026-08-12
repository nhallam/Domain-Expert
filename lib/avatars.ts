// Preset avatar palette. avatarUrl is stored as "grad:<n>".
// Each preset is a gradient pair; the avatar renders the user's initials on top.
export const AVATAR_GRADIENTS: [string, string][] = [
  ["#6366F1", "#8B5CF6"],
  ["#F59E0B", "#EF4444"],
  ["#10B981", "#0EA5E9"],
  ["#EC4899", "#8B5CF6"],
  ["#0EA5E9", "#6366F1"],
  ["#F43F5E", "#F59E0B"],
  ["#22C55E", "#84CC16"],
  ["#06B6D4", "#3B82F6"],
  ["#A855F7", "#EC4899"],
  ["#475569", "#0F172A"],
];

export function avatarGradient(avatarUrl: string | null | undefined, name: string): [string, string] {
  const match = /^grad:(\d+)$/.exec(avatarUrl ?? "");
  if (match) {
    const i = parseInt(match[1], 10);
    if (i >= 0 && i < AVATAR_GRADIENTS.length) return AVATAR_GRADIENTS[i];
  }
  // Fallback: derive a stable gradient from the name (generated initials avatar).
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
