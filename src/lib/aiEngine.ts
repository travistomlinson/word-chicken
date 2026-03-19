import { validateTurn } from './wordValidator'
import { validateStartingWord } from './roundManager'
import { EASY_WORDS } from '../data/easyWords'
import { MEDIUM_WORDS } from '../data/mediumWords'
import type { ValidationConfig } from '../types/game'

/**
 * Returns the AI vocabulary filtered against the loaded game dictionary.
 *
 * - easy: words from EASY_WORDS that exist in the game dictionary (~5K)
 * - medium: words from MEDIUM_WORDS that exist in the game dictionary (~18K)
 * - hard: the full game dictionary
 *
 * Returns both an array (for iteration with shuffling) and a Set (for
 * validateTurn's dictionary parameter).
 */
export function getVocabulary(
  difficulty: 'easy' | 'medium' | 'hard',
  fullDictionary: Set<string>
): { array: string[]; set: Set<string> } {
  if (difficulty === 'hard') {
    // Return full dictionary as-is
    const array = Array.from(fullDictionary)
    return { array, set: fullDictionary }
  }

  const sourceList = difficulty === 'easy' ? EASY_WORDS : MEDIUM_WORDS

  // Filter to words present in the loaded game dictionary.
  // Game dictionary stores lowercase; source lists are uppercase — compare lowercased.
  const filtered: string[] = []
  for (const word of sourceList) {
    const lower = word.toLowerCase()
    if (fullDictionary.has(lower)) {
      filtered.push(lower)
    }
  }

  // Deduplicate (source lists may have duplicates)
  const uniqueSet = new Set(filtered)
  const uniqueArray = Array.from(uniqueSet)

  return { array: uniqueArray, set: uniqueSet }
}

/**
 * Fisher-Yates shuffle — mutates array in place, returns it.
 * Used internally to randomise AI move selection.
 */
function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Finds a valid AI move: a word that is exactly currentWord.length + 1 letters,
 * passes validateTurn (is in vocabularySet, is a superset of currentWord,
 * uses one tile from hand, respects plural ban), and is in the vocabulary.
 *
 * Iterates the vocabulary array in a randomised order (random start index,
 * wrap-around) to add variety to AI play.
 *
 * Returns the word (uppercase) if found, or null if no move is possible.
 */
export function findAIMove(
  currentWord: string,
  hand: string[],
  vocabularyArray: string[],
  vocabularySet: Set<string>,
  config: ValidationConfig
): string | null {
  if (vocabularyArray.length === 0) return null

  const targetLength = currentWord.length + 1

  // Random start index for variety
  const startIdx = Math.floor(Math.random() * vocabularyArray.length)

  for (let i = 0; i < vocabularyArray.length; i++) {
    const idx = (startIdx + i) % vocabularyArray.length
    const candidate = vocabularyArray[idx]

    // Quick length guard — most candidates will fail here, O(1) check
    if (candidate.length !== targetLength) continue

    const result = validateTurn(
      candidate.toUpperCase(),
      currentWord.toUpperCase(),
      hand,
      vocabularySet,
      config
    )

    if (result.valid) {
      return candidate.toUpperCase()
    }
  }

  return null
}

/**
 * Finds a valid starting word for the AI from the dictionary.
 * Filters to 3-letter words, shuffles, and picks the first one playable from hand.
 */
export function findAIStartingWord(
  hand: string[],
  dictionary: Set<string>
): string | null {
  // Collect all 3-letter words from dictionary
  const threeLetterWords: string[] = []
  for (const word of dictionary) {
    if (word.length === 3) {
      threeLetterWords.push(word.toUpperCase())
    }
  }

  shuffleInPlace(threeLetterWords)

  for (const word of threeLetterWords) {
    const result = validateStartingWord(word, hand, dictionary)
    if (result.valid) {
      return word
    }
  }

  return null
}
