import { describe, it, expect } from 'vitest'
import { scoreWord, RARE_LETTER_BONUS } from '../scoreCalculator'

describe('RARE_LETTER_BONUS', () => {
  it('exports bonus map with correct values', () => {
    expect(RARE_LETTER_BONUS['Q']).toBe(10)
    expect(RARE_LETTER_BONUS['Z']).toBe(8)
    expect(RARE_LETTER_BONUS['X']).toBe(6)
    expect(RARE_LETTER_BONUS['J']).toBe(6)
  })
})

describe('scoreWord', () => {
  it('returns 0 for empty string', () => {
    expect(scoreWord('')).toBe(0)
  })

  it('returns 0 for falsy input (null-ish)', () => {
    // @ts-expect-error testing runtime safety
    expect(scoreWord(null)).toBe(0)
    // @ts-expect-error testing runtime safety
    expect(scoreWord(undefined)).toBe(0)
  })

  it('scores CAT as 3 (3 letters x 1 base point, no bonuses)', () => {
    expect(scoreWord('CAT')).toBe(3)
  })

  it('scores QUIZ as 22 (4 base + 10 for Q + 8 for Z)', () => {
    expect(scoreWord('QUIZ')).toBe(22)
  })

  it('scores JAX as 15 (3 base + 6 for J + 6 for X)', () => {
    expect(scoreWord('JAX')).toBe(15)
  })

  it('scores QATZ as 22 (4 base + 10 for Q + 8 for Z, Q is raw char not expanded)', () => {
    expect(scoreWord('QATZ')).toBe(22)
  })

  it('handles lowercase input by uppercasing', () => {
    expect(scoreWord('cat')).toBe(3)
    expect(scoreWord('quiz')).toBe(22)
  })

  it('never throws for any string input', () => {
    expect(() => scoreWord('ZZZZZ')).not.toThrow()
    expect(() => scoreWord('ABCDEFGHIJKLMNOPQRSTUVWXYZ')).not.toThrow()
  })
})
