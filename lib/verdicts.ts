export function verdictFor(score: number, maxScore: number, industry: string): string {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  if (pct === 100) return `Flawless. Certified ${industry} legend 🏆`;
  if (pct >= 90) return `Certified ${industry} insider`;
  if (pct >= 70) return `Sharp — you've clearly done the reps`;
  if (pct >= 40) return `Not bad — but the interns are gaining on you`;
  return `Time to update that headline 👀`;
}

export function shareText(quizTitle: string, score: number, maxScore: number, industry: string, url: string): string {
  return `I scored ${score}/${maxScore} on "${quizTitle}" 🎯\n\n${verdictFor(score, maxScore, industry)}.\n\nThink you know ${industry} better than I do? Prove it 👇\n${url}`;
}

export function creatorPostDraft(quizTitle: string, industry: string, url: string): string {
  return `I built the "${quizTitle}" challenge — only a real ${industry} pro gets a perfect score.\n\nThink you can beat me? 👇\n${url}`;
}
