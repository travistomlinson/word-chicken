const BASE_POINTS = 1

/**
 * Bonus points for rare letters. Keyed on the raw game-state character.
 * Q is stored as 'Q' (never expanded to 'QU') so Q earns its full bonus here.
 */
export const RARE_LETTER_BONUS: Record<string, number> = {
  Q: 10,
  Z: 8,
  X: 6,
  J: 6,
}

/**
 * Scores a word based on its length and any rare letter bonuses.
 * Receives the raw game-state word (Q as single char, never 'QU').
 * Returns 0 for empty or falsy input. Never throws.
 */
export function scoreWord(word: string): number {
  if (!word) return 0
  const upper = word.toUpperCase()
  let score = upper.length * BASE_POINTS
  for (const ch of upper) {
    score += RARE_LETTER_BONUS[ch] ?? 0
  }
  return score
}
