import { describe, it, expect } from 'vitest'
import { findAIMove, findAIStartingWord, getVocabulary } from '../aiEngine'
import type { ValidationConfig } from '../../types/game'

// Small controlled dictionary for deterministic tests
// All lowercase (as stored in dictionary)
const MINI_DICT = new Set<string>([
  'cat', 'cart', 'carts', 'scat', 'cast', 'cats',
  'bat', 'bats', 'bart', 'bars', 'bar',
  'tap', 'tape', 'tapes', 'cape', 'capes',
  'ace', 'act', 'acts', 'arcs', 'arc',
  'car', 'cars', 'card', 'cards', 'care', 'cared', 'cares',
  'star', 'stars', 'start', 'starts', 'stare', 'stares',
  'race', 'races', 'raced', 'trace', 'traces', 'traced',
  'rate', 'rates', 'rated', 'crate', 'crates', 'grate', 'grates',
])

const BASE_CONFIG: ValidationConfig = { banPluralS: false }
const PLURAL_BAN_CONFIG: ValidationConfig = { banPluralS: true }

describe('getVocabulary', () => {
  it('hard difficulty returns the full dictionary as set and array', () => {
    const fullDict = new Set(['cat', 'dog', 'bird'])
    const result = getVocabulary('hard', fullDict)
    expect(result.set).toBe(fullDict) // exact same reference
    expect(result.array).toEqual(expect.arrayContaining(['cat', 'dog', 'bird']))
    expect(result.array).toHaveLength(3)
  })

  it('easy difficulty returns a subset of the full dictionary', () => {
    // Use a large-enough dict to ensure some EASY_WORDS overlap
    const result = getVocabulary('easy', MINI_DICT)
    // Every word in the easy set must also be in MINI_DICT
    for (const w of result.set) {
      expect(MINI_DICT.has(w)).toBe(true)
    }
    // easy set must be a subset (size <= fullDict.size)
    expect(result.set.size).toBeLessThanOrEqual(MINI_DICT.size)
    // array and set must be consistent
    expect(result.array).toHaveLength(result.set.size)
    for (const w of result.array) {
      expect(result.set.has(w)).toBe(true)
    }
  })

  it('medium difficulty returns a subset of the full dictionary larger than easy', () => {
    // Build a large dictionary that has many common words
    const bigDict = new Set<string>([
      'cat', 'dog', 'run', 'act', 'art', 'bar', 'bat', 'can', 'car', 'cup',
      'cut', 'dig', 'dip', 'dot', 'ear', 'eat', 'egg', 'fan', 'fat', 'fin',
      'fit', 'fun', 'gap', 'gas', 'get', 'got', 'gun', 'gut', 'ham', 'hat',
      'hen', 'her', 'hit', 'hog', 'hop', 'hot', 'how', 'hub', 'hug', 'hum',
      'ice', 'ill', 'ink', 'inn', 'ion', 'jar', 'jaw', 'jet', 'job', 'jog',
      'joy', 'jug', 'kid', 'kin', 'kit', 'lab', 'lap', 'law', 'leg', 'let',
      'lid', 'log', 'lot', 'low', 'mad', 'man', 'map', 'mat', 'men', 'met',
      'mob', 'mop', 'mud', 'mug', 'nap', 'net', 'nod', 'not', 'now', 'nut',
      'oak', 'oar', 'oat', 'odd', 'opt', 'orb', 'ore', 'out', 'own', 'pad',
      'pan', 'pat', 'paw', 'peg', 'pen', 'pet', 'pig', 'pin', 'pit', 'pod',
    ])
    const easy = getVocabulary('easy', bigDict)
    const medium = getVocabulary('medium', bigDict)

    // Medium should be >= easy
    expect(medium.set.size).toBeGreaterThanOrEqual(easy.set.size)

    // All easy words must be in medium (easy is subset of medium)
    for (const w of easy.set) {
      expect(medium.set.has(w)).toBe(true)
    }
  })

  it('easy is subset of medium, medium is subset of hard (same base dict)', () => {
    const fullDict = MINI_DICT
    const easy = getVocabulary('easy', fullDict)
    const medium = getVocabulary('medium', fullDict)
    const hard = getVocabulary('hard', fullDict)

    // All easy words in medium
    for (const w of easy.set) {
      expect(medium.set.has(w)).toBe(true)
    }
    // All medium words in hard
    for (const w of medium.set) {
      expect(hard.set.has(w)).toBe(true)
    }
  })

  it('hard array has same length as hard set', () => {
    const result = getVocabulary('hard', MINI_DICT)
    expect(result.array.length).toBe(result.set.size)
  })
})

describe('findAIMove', () => {
  it('returns a valid extension of the current word', () => {
    // CAT → CART (add R) — player hand has R
    const vocabArray = [...MINI_DICT]
    const vocabSet = MINI_DICT
    const hand = ['R', 'X', 'Z']
    const result = findAIMove('CAT', hand, vocabArray, vocabSet, BASE_CONFIG)
    expect(result).not.toBeNull()
    expect(result!.length).toBe(4) // CAT.length + 1
    // returned word must be in dictionary (lowercase check)
    expect(MINI_DICT.has(result!.toLowerCase())).toBe(true)
  })

  it('returns null when hand has no useful tiles', () => {
    const vocabArray = [...MINI_DICT]
    const vocabSet = MINI_DICT
    // QQQ hand — no valid extension of STAR
    const hand = ['Q', 'Q', 'Q']
    const result = findAIMove('STAR', hand, vocabArray, vocabSet, BASE_CONFIG)
    expect(result).toBeNull()
  })

  it('returns null when no valid extension exists in vocabulary', () => {
    // Single word vocab with no extension of STAR
    const vocabArray = ['star']
    const vocabSet = new Set(['star'])
    const hand = ['S', 'T', 'A', 'R']
    const result = findAIMove('STAR', hand, vocabArray, vocabSet, BASE_CONFIG)
    expect(result).toBeNull()
  })

  it('respects banPluralS=true — does not return simple plural', () => {
    // CAT → CATS would be simple plural, should be banned
    // But CART or SCAT or CAST should be fine
    const vocabArray = ['cats', 'cart', 'cast', 'scat']
    const vocabSet = new Set(['cats', 'cart', 'cast', 'scat'])
    const hand = ['S', 'R', 'X']
    // With banPluralS=true: 'cats' (CAT+S) is banned, but CART or CAST may work if R/S in hand
    const result = findAIMove('CAT', hand, vocabArray, vocabSet, PLURAL_BAN_CONFIG)
    if (result !== null) {
      expect(result.toUpperCase()).not.toBe('CATS')
    }
  })

  it('can return a simple plural when banPluralS=false', () => {
    // Force only CATS as the option
    const vocabArray = ['cats']
    const vocabSet = new Set(['cats'])
    const hand = ['S']
    const result = findAIMove('CAT', hand, vocabArray, vocabSet, BASE_CONFIG)
    expect(result).not.toBeNull()
    expect(result!.toUpperCase()).toBe('CATS')
  })

  it('returns word from vocabulary only', () => {
    // Limited vocab with one valid extension
    const vocabArray = ['cart']
    const vocabSet = new Set(['cart'])
    const hand = ['R', 'X', 'Z']
    const result = findAIMove('CAT', hand, vocabArray, vocabSet, BASE_CONFIG)
    expect(result).not.toBeNull()
    expect(result!.toUpperCase()).toBe('CART')
  })

  it('skips candidates that are wrong length', () => {
    // vocab has only words that are wrong lengths relative to CAT
    const vocabArray = ['star', 'starts', 'ca', 'c']
    const vocabSet = new Set(['star', 'starts', 'ca', 'c'])
    const hand = ['S', 'T', 'A', 'R']
    const result = findAIMove('CAT', hand, vocabArray, vocabSet, BASE_CONFIG)
    expect(result).toBeNull()
  })

  it('returns uppercase result', () => {
    const vocabArray = ['cart']
    const vocabSet = new Set(['cart'])
    const hand = ['R']
    const result = findAIMove('CAT', hand, vocabArray, vocabSet, BASE_CONFIG)
    expect(result).toBe('CART')
  })
})

describe('findAIStartingWord', () => {
  it('returns a starting word from STARTING_WORDS that fits in the hand', () => {
    // Hand contains C, A, T plus extras — 'CAT' is in STARTING_WORDS
    const hand = ['C', 'A', 'T', 'X', 'X', 'X', 'X', 'X', 'X']
    const result = findAIStartingWord(hand, MINI_DICT)
    expect(result).not.toBeNull()
    // Returned word must be 3 letters (from STARTING_WORDS)
    expect(result!.length).toBe(3)
    // Must be in the dictionary
    expect(MINI_DICT.has(result!.toLowerCase())).toBe(true)
  })

  it('returns null when no starting word fits the hand', () => {
    // Hand with only Q tiles — no 3-letter starting word can be formed
    const hand = ['Q', 'Q', 'Q', 'Q', 'Q', 'Q', 'Q', 'Q', 'Q']
    const result = findAIStartingWord(hand, MINI_DICT)
    expect(result).toBeNull()
  })

  it('returns a word in the full STARTING_WORDS corpus', async () => {
    const { STARTING_WORDS } = await import('../startingWords')
    const hand = ['C', 'A', 'T', 'B', 'A', 'R', 'S', 'E', 'A']
    const result = findAIStartingWord(hand, MINI_DICT)
    if (result !== null) {
      expect(STARTING_WORDS).toContain(result.toUpperCase())
    }
  })
})
