// Source: Bananagrams official (144 tiles)
// https://en.wikipedia.org/wiki/Bananagrams
export const BANANAGRAMS_COUNTS: Record<string, number> = {
  A: 13, B: 3,  C: 3,  D: 6,  E: 18, F: 3,  G: 4,  H: 3,
  I: 12, J: 2,  K: 2,  L: 5,  M: 3,  N: 8,  O: 11, P: 3,
  Q: 2,  R: 9,  S: 6,  T: 9,  U: 6,  V: 3,  W: 3,  X: 2,
  Y: 3,  Z: 2,
}

// Source: Scrabble official (98 lettered tiles, no blanks)
// https://en.wikipedia.org/wiki/Scrabble_letter_distributions
export const SCRABBLE_COUNTS: Record<string, number> = {
  A: 9,  B: 2,  C: 2,  D: 4,  E: 12, F: 2,  G: 3,  H: 2,
  I: 9,  J: 1,  K: 1,  L: 4,  M: 2,  N: 6,  O: 8,  P: 2,
  Q: 1,  R: 6,  S: 4,  T: 6,  U: 4,  V: 2,  W: 2,  X: 1,
  Y: 2,  Z: 1,
}

export type TileDistribution = 'bananagrams' | 'scrabble'

// Canonical Fisher-Yates in-place shuffle.
// Loop from arr.length - 1 down to 1; swap arr[i] with arr[random 0..i].
function fisherYatesShuffle(arr: string[]): string[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Build a shuffled tile bag from the given distribution.
 * Each tile is a single uppercase letter. Q is stored as 'Q', never 'QU'.
 */
export function createBag(distribution: TileDistribution): string[] {
  const counts = distribution === 'bananagrams' ? BANANAGRAMS_COUNTS : SCRABBLE_COUNTS
  const bag: string[] = []
  for (const [letter, count] of Object.entries(counts)) {
    for (let i = 0; i < count; i++) {
      bag.push(letter)
    }
  }
  return fisherYatesShuffle(bag)
}

/**
 * Deal `count` tiles from the front of the bag.
 * Mutates the bag array. Returns the dealt tiles.
 */
export function dealHand(bag: string[], count: number): string[] {
  return bag.splice(0, count)
}

/**
 * Draw tiles from the bag to top the hand up to 9.
 * Returns a new array. Mutates the bag if tiles are drawn.
 * If hand is already 9+ tiles, or bag is empty, returns hand as-is.
 */
export function drawToNine(hand: string[], bag: string[]): string[] {
  const needed = 9 - hand.length
  if (needed <= 0 || bag.length === 0) return hand
  return [...hand, ...dealHand(bag, Math.min(needed, bag.length))]
}
