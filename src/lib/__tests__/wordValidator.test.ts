import { describe, it, expect } from 'vitest'
import { validateWord, validateTurn, isInDictionary } from '../wordValidator'

// Small mock dictionary: all lowercase as parseWordList produces
const dict = new Set(['cat', 'cart', 'carts', 'dog', 'quack', 'act', 'tac', 'cats'])

describe('validateWord', () => {
  it('returns { valid: true } for a known dictionary word with available hand tiles', () => {
    const result = validateWord('cat', ['C', 'A', 'T', 'X', 'Y', 'Z', 'R', 'E', 'D'], dict)
    expect(result).toEqual({ valid: true })
  })

  it('returns { valid: false, reason: "not_a_word" } for an unknown word', () => {
    const result = validateWord('xyz', ['X', 'Y', 'Z', 'A', 'B', 'C', 'D', 'E', 'F'], dict)
    expect(result).toEqual({ valid: false, reason: 'not_a_word' })
  })

  it('returns { valid: false, reason: "letters_unavailable" } when hand lacks required tiles', () => {
    // hand has no T
    const result = validateWord('cat', ['X', 'Y', 'Z', 'A', 'B', 'C', 'D', 'E', 'F'], dict)
    expect(result).toEqual({ valid: false, reason: 'letters_unavailable' })
  })
})

describe('isInDictionary / Q expansion', () => {
  it('returns true for QACK (expands to QUACK which is in dictionary)', () => {
    expect(isInDictionary('QACK', dict)).toBe(true)
  })

  it('returns false for QUACK (expands to QUUACK which is not in dictionary)', () => {
    expect(isInDictionary('QUACK', dict)).toBe(false)
  })
})

describe('validateTurn', () => {
  it('accepts CART from CAT with R in hand (rearrangement allowed)', () => {
    const result = validateTurn(
      'CART', 'CAT',
      ['R', 'X', 'Y', 'Z', 'A', 'B', 'C', 'D', 'E'],
      dict,
      { banPluralS: true }
    )
    expect(result).toEqual({ valid: true })
  })

  it('rejects CARTS from CAR when two letters would be added (not_a_superset)', () => {
    const result = validateTurn(
      'CARTS', 'CAR',
      ['T', 'S', 'X', 'Z', 'A', 'B', 'C', 'D', 'E'],
      dict,
      { banPluralS: true }
    )
    expect(result).toEqual({ valid: false, reason: 'not_a_superset' })
  })

  it('rejects CART from CAT when R is not in hand (letter_not_in_hand)', () => {
    const result = validateTurn(
      'CART', 'CAT',
      ['X', 'Y', 'Z', 'A', 'B', 'C', 'D', 'E', 'F'],
      dict,
      { banPluralS: true }
    )
    expect(result).toEqual({ valid: false, reason: 'letter_not_in_hand' })
  })

  it('rejects CATS from CAT with banPluralS enabled (plural_banned)', () => {
    const result = validateTurn(
      'CATS', 'CAT',
      ['S', 'X', 'Y', 'Z', 'A', 'B', 'C', 'D', 'E'],
      dict,
      { banPluralS: true }
    )
    expect(result).toEqual({ valid: false, reason: 'plural_banned' })
  })

  it('allows CATS from CAT with banPluralS disabled', () => {
    const result = validateTurn(
      'CATS', 'CAT',
      ['S', 'X', 'Y', 'Z', 'A', 'B', 'C', 'D', 'E'],
      dict,
      { banPluralS: false }
    )
    expect(result).toEqual({ valid: true })
  })

  it('does not enforce a maximum word length (long valid word accepted)', () => {
    // Build a long word scenario: if CAT->CART->CARTS is already in dict,
    // simulate no-max-length by verifying CARTS from CART is valid when banPluralS is false
    const result = validateTurn(
      'CARTS', 'CART',
      ['S', 'X', 'Y', 'Z', 'A', 'B', 'C', 'D', 'E'],
      dict,
      { banPluralS: false }
    )
    expect(result).toEqual({ valid: true })
  })
})
