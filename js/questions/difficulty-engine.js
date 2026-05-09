export const difficultyProfiles = {
  easy: { name: "easy", count: 4, paragraphs: 3, ambiguity: "clear", clueCount: 3 },
  medium: { name: "medium", count: 6, paragraphs: 4, ambiguity: "moderate", clueCount: 4 },
  hard: { name: "hard", count: 7, paragraphs: 5, ambiguity: "nuanced", clueCount: 5 },
  final: { name: "final", count: 12, paragraphs: 4, ambiguity: "mixed", clueCount: 4 }
};

export function normaliseDifficulty(value = "easy") {
  const key = String(value).toLowerCase();
  if (key === "expert") return "hard";
  return difficultyProfiles[key] ? key : "easy";
}

export function desiredCount(difficulty, requestedCount) {
  const explicit = Number(requestedCount);
  if (Number.isFinite(explicit) && explicit > 0) return Math.min(24, Math.floor(explicit));
  return difficultyProfiles[normaliseDifficulty(difficulty)]?.count || 4;
}
