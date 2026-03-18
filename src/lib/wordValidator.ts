import type { ValidationConfig, WordValidationResult, TurnValidationResult } from '../types/game'

// Internal helpers

/** Expands Q tiles to QU for dictionary lookup only. Never stored in game state. */
function expandQTiles(word: string): string {
  return word.toUpperCase().replaceAll('Q', 'QU')
}

/** Returns a frequency map of letters (uppercase). */
function letterFrequency(word: string): Map<string, number> {
  const freq = new Map<string, number>()
  for (const ch of word.toUpperCase()) {
    freq.set(ch, (freq.get(ch) ?? 0) + 1)
  }
  return freq
}

/**
 * Returns true if newWord contains at least as many of every letter as prevWord.
 * Order-independent (multiset superset).
 */
function isMultisetSuperset(newWord: string, prevWord: string): boolean {
  const newFreq = letterFrequency(newWord)
  const prevFreq = letterFrequency(prevWord)
  for (const [ch, count] of prevFreq) {
    if ((newFreq.get(ch) ?? 0) < count) {
      return false
    }
  }
  return true
}

/**
 * Returns array of extra letters in newWord vs prevWord.
 * e.g. newWord=CART, prevWord=CAT → ['R']
 */
function multisetDiff(newWord: string, prevWord: string): string[] {
  const newFreq = letterFrequency(newWord)
  const prevFreq = letterFrequency(prevWord)
  const diff: string[] = []
  for (const [ch, count] of newFreq) {
    const extra = count - (prevFreq.get(ch) ?? 0)
    for (let i = 0; i < extra; i++) {
      diff.push(ch)
    }
  }
  return diff
}

// Exported functions

/**
 * Checks if a word is in the dictionary after Q-tile expansion.
 * Dictionary contains lowercase strings (from parseWordList).
 * Word parameter may be uppercase or lowercase.
 */
export function isInDictionary(word: string, dictionary: Set<string>): boolean {
  const expanded = expandQTiles(word).toLowerCase()
  return dictionary.has(expanded)
}

/**
 * Validates that a word is (1) in the dictionary and (2) constructable from hand tiles.
 * Hand is an array of uppercase single-character strings.
 */
export function validateWord(
  word: string,
  hand: string[],
  dictionary: Set<string>
): WordValidationResult {
  if (!isInDictionary(word, dictionary)) {
    return { valid: false, reason: 'not_a_word' }
  }

  // Check hand has all required letters
  const wordFreq = letterFrequency(word)
  const handFreq = letterFrequency(hand.join(''))
  for (const [ch, count] of wordFreq) {
    if ((handFreq.get(ch) ?? 0) < count) {
      return { valid: false, reason: 'letters_unavailable' }
    }
  }

  return { valid: true }
}

/**
 * Validates a turn submission:
 * newWord must be a valid dictionary word, a multiset superset of prevWord,
 * with exactly one added letter that exists in hand.
 * No maximum word length constraint (GAME-09).
 */
export function validateTurn(
  newWord: string,
  prevWord: string,
  hand: string[],
  dictionary: Set<string>,
  config: ValidationConfig
): TurnValidationResult {
  // 1. Dictionary check
  if (!isInDictionary(newWord, dictionary)) {
    return { valid: false, reason: 'not_a_word' }
  }

  // 2. Multiset superset check (newWord must contain all letters of prevWord)
  if (!isMultisetSuperset(newWord, prevWord)) {
    return { valid: false, reason: 'not_a_superset' }
  }

  // 3. Exactly one letter added
  const diff = multisetDiff(newWord, prevWord)
  if (diff.length !== 1) {
    return { valid: false, reason: 'not_a_superset' }
  }

  const addedLetter = diff[0]

  // 4. Added letter must be in hand
  const handFreq = letterFrequency(hand.join(''))
  if ((handFreq.get(addedLetter) ?? 0) < 1) {
    return { valid: false, reason: 'letter_not_in_hand' }
  }

  // 5. Plural ban: if adding S makes newWord === prevWord + S (simple plural)
  if (
    config.banPluralS &&
    addedLetter === 'S' &&
    newWord.toUpperCase() === prevWord.toUpperCase() + 'S'
  ) {
    return { valid: false, reason: 'plural_banned' }
  }

  return { valid: true }
}
