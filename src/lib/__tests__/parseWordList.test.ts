import { describe, it, expect } from 'vitest'
import { parseWordList } from '../parseWordList'

describe('parseWordList', () => {
  it('parses newline-separated words into a Set', () => {
    const result = parseWordList('cat\ndog\nbird\n')
    expect(result).toBeInstanceOf(Set)
    expect(result.size).toBe(3)
    expect(result.has('cat')).toBe(true)
    expect(result.has('dog')).toBe(true)
    expect(result.has('bird')).toBe(true)
  })

  it('trims whitespace and lowercases all words (handles CRLF)', () => {
    const result = parseWordList('CAT\r\n DOG \n')
    expect(result.size).toBe(2)
    expect(result.has('cat')).toBe(true)
    expect(result.has('dog')).toBe(true)
  })

  it('filters empty strings from result', () => {
    const result = parseWordList('cat\n\ndog\n')
    expect(result.size).toBe(2)
    expect(result.has('cat')).toBe(true)
    expect(result.has('dog')).toBe(true)
  })

  it('returns empty Set for empty string input', () => {
    const result = parseWordList('')
    expect(result).toBeInstanceOf(Set)
    expect(result.size).toBe(0)
  })
})
