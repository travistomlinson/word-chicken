import { describe, it, expect } from 'vitest'
import { createBag, dealHand, drawToNine } from '../tileBag'

const VALID_LETTERS = new Set('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''))

describe('createBag', () => {
  it('createBag("bananagrams") returns array of length 144', () => {
    const bag = createBag('bananagrams')
    expect(bag.length).toBe(144)
  })

  it('createBag("scrabble") returns array of length 98', () => {
    const bag = createBag('scrabble')
    expect(bag.length).toBe(98)
  })

  it('createBag("bananagrams") contains exactly 13 A\'s (spot-check)', () => {
    const bag = createBag('bananagrams')
    const aCount = bag.filter(t => t === 'A').length
    expect(aCount).toBe(13)
  })

  it('createBag("bananagrams") contains exactly 18 E\'s (spot-check)', () => {
    const bag = createBag('bananagrams')
    const eCount = bag.filter(t => t === 'E').length
    expect(eCount).toBe(18)
  })

  it('createBag("bananagrams") contains exactly 2 Q\'s (spot-check)', () => {
    const bag = createBag('bananagrams')
    const qCount = bag.filter(t => t === 'Q').length
    expect(qCount).toBe(2)
  })

  it('createBag("scrabble") contains exactly 9 A\'s (spot-check)', () => {
    const bag = createBag('scrabble')
    const aCount = bag.filter(t => t === 'A').length
    expect(aCount).toBe(9)
  })

  it('createBag("scrabble") contains exactly 12 E\'s (spot-check)', () => {
    const bag = createBag('scrabble')
    const eCount = bag.filter(t => t === 'E').length
    expect(eCount).toBe(12)
  })

  it('createBag("scrabble") contains exactly 1 Q (spot-check)', () => {
    const bag = createBag('scrabble')
    const qCount = bag.filter(t => t === 'Q').length
    expect(qCount).toBe(1)
  })

  it('every tile in bag is a single uppercase letter A-Z (Q is "Q", not "QU")', () => {
    const bag = createBag('bananagrams')
    for (const tile of bag) {
      expect(tile).toHaveLength(1)
      expect(VALID_LETTERS.has(tile)).toBe(true)
    }
  })

  it('every tile in scrabble bag is a single uppercase letter A-Z', () => {
    const bag = createBag('scrabble')
    for (const tile of bag) {
      expect(tile).toHaveLength(1)
      expect(VALID_LETTERS.has(tile)).toBe(true)
    }
  })
})

describe('dealHand', () => {
  it('dealHand(bag, 9) returns array of length 9', () => {
    const bag = createBag('bananagrams')
    const hand = dealHand(bag, 9)
    expect(hand.length).toBe(9)
  })

  it('dealHand mutates bag: bag.length decreases by 9', () => {
    const bag = createBag('bananagrams')
    const originalLength = bag.length
    dealHand(bag, 9)
    expect(bag.length).toBe(originalLength - 9)
  })

  it('dealHand returns only valid uppercase letters', () => {
    const bag = createBag('bananagrams')
    const hand = dealHand(bag, 9)
    for (const tile of hand) {
      expect(tile).toHaveLength(1)
      expect(VALID_LETTERS.has(tile)).toBe(true)
    }
  })
})

describe('drawToNine', () => {
  it('drawToNine with hand of 3 returns array of length 9', () => {
    const bag = createBag('bananagrams')
    const hand = ['A', 'B', 'C']
    const result = drawToNine(hand, bag)
    expect(result.length).toBe(9)
  })

  it('drawToNine with hand already at 9 returns same hand, bag unchanged', () => {
    const bag = createBag('bananagrams')
    const originalBagLength = bag.length
    const hand = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']
    const result = drawToNine(hand, bag)
    expect(result.length).toBe(9)
    expect(bag.length).toBe(originalBagLength)
  })

  it('drawToNine with empty bag returns hand as-is', () => {
    const emptyBag: string[] = []
    const hand = ['A', 'B', 'C']
    const result = drawToNine(hand, emptyBag)
    expect(result).toEqual(['A', 'B', 'C'])
    expect(result.length).toBe(3)
  })

  it('drawToNine does not exceed 9 even if bag has more tiles', () => {
    const bag = createBag('bananagrams')
    const hand = ['A']
    const result = drawToNine(hand, bag)
    expect(result.length).toBe(9)
  })
})

describe('statistical properties', () => {
  it('dealing 9 tiles from Bananagrams bag produces at least 2 vowels (statistical, 100 trials)', () => {
    const VOWELS = new Set(['A', 'E', 'I', 'O', 'U'])
    let failCount = 0
    for (let trial = 0; trial < 100; trial++) {
      const bag = createBag('bananagrams')
      const hand = dealHand(bag, 9)
      const vowelCount = hand.filter(t => VOWELS.has(t)).length
      if (vowelCount < 2) failCount++
    }
    // With Bananagrams distribution, ~58% of tiles are vowels.
    // P(< 2 vowels in 9 tiles) is astronomically small. Zero failures expected.
    expect(failCount).toBe(0)
  })
})
