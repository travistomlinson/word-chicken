import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve, basename } from 'path'

// ---------------------------------------------------------------------------
// PLSH-01: TurnIndicator must be visually dominant over round counter and Quit button
// ---------------------------------------------------------------------------
describe('PLSH-01: TurnIndicator visual dominance', () => {
  const source = readFileSync(resolve(__dirname, '../components/TurnIndicator.tsx'), 'utf-8')
  const fileName = basename(resolve(__dirname, '../components/TurnIndicator.tsx'))

  it(`${fileName} baseClass uses text-lg (not text-sm) for size dominance`, () => {
    // baseClass must use text-lg (18px) not text-sm (14px)
    // Round counter is text-[10px], Quit button is text-xs (12px)
    expect(source).toContain('text-lg')
    expect(source).not.toMatch(/baseClass\s*=\s*['"][^'"]*text-sm/)
  })

  it(`${fileName} uses font-bold on active turn states`, () => {
    // font-bold is applied on individual branches (not baseClass) — that is correct per plan
    expect(source).toContain('font-bold')
  })
})

// ---------------------------------------------------------------------------
// PLSH-02: ScorePanel round score hierarchy — roundScores must be used in JSX
// Plan 02 will implement and enable this test
// ---------------------------------------------------------------------------
describe.skip('PLSH-02: ScorePanel round score hierarchy', () => {
  const source = readFileSync(resolve(__dirname, '../components/ScorePanel.tsx'), 'utf-8')
  const fileName = basename(resolve(__dirname, '../components/ScorePanel.tsx'))

  it(`${fileName} does not use underscore-prefixed _roundScores alias`, () => {
    expect(source).not.toContain('_roundScores')
  })

  it(`${fileName} uses roundScores in JSX (not just destructuring)`, () => {
    // roundScores must appear in JSX rendering, not just in the destructuring line
    const lines = source.split('\n')
    const jsxUseLines = lines.filter(
      (line) => line.includes('roundScores') && !line.includes('const ') && !line.includes('=')
    )
    expect(jsxUseLines.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// PLSH-03: ChickenOMeter tension bar must be w-8 (32px) for mobile readability
// ---------------------------------------------------------------------------
describe('PLSH-03: ChickenOMeter tension bar width', () => {
  const source = readFileSync(resolve(__dirname, '../components/ChickenOMeter.tsx'), 'utf-8')
  const fileName = basename(resolve(__dirname, '../components/ChickenOMeter.tsx'))

  it(`${fileName} bar container class contains w-8 (not w-5)`, () => {
    expect(source).toContain('w-8')
    expect(source).not.toContain('w-5')
  })
})

// ---------------------------------------------------------------------------
// PLSH-04: Staged tiles must have a distinct visual state (not concrete, remain clickable)
// Plan 02 will implement and enable this test
// ---------------------------------------------------------------------------
describe('PLSH-04: Staged tile distinct visual state', () => {
  const source = readFileSync(resolve(__dirname, '../components/PlayerHand.tsx'), 'utf-8')
  const fileName = basename(resolve(__dirname, '../components/PlayerHand.tsx'))

  it(`${fileName} staged tiles do not use 'concrete' color`, () => {
    // Staged tiles must use a distinct color — not concrete (which is the unstaged/default color)
    expect(source).not.toMatch(/isStaged\s*\?\s*['"]concrete/)
  })

  it(`${fileName} staged tiles are not disabled (must remain clickable for unstaging)`, () => {
    expect(source).not.toMatch(/disabled=\{isStaged\}/)
  })
})

// ---------------------------------------------------------------------------
// PLSH-05: RoundEndCard overlay structure matches GameOverScreen exactly
// This test should pass immediately (PLSH-05 is already met)
// ---------------------------------------------------------------------------
describe('PLSH-05: RoundEndCard overlay consistency', () => {
  const roundEndSource = readFileSync(resolve(__dirname, '../components/RoundEndCard.tsx'), 'utf-8')
  const gameOverSource = readFileSync(resolve(__dirname, '../components/GameOverScreen.tsx'), 'utf-8')
  const roundEndFileName = basename(resolve(__dirname, '../components/RoundEndCard.tsx'))
  const gameOverFileName = basename(resolve(__dirname, '../components/GameOverScreen.tsx'))

  it(`${roundEndFileName} uses fixed inset-0 overlay pattern`, () => {
    expect(roundEndSource).toContain('fixed inset-0')
  })

  it(`${roundEndFileName} uses bg-black/50 backdrop`, () => {
    expect(roundEndSource).toContain('bg-black/50')
  })

  it(`${roundEndFileName} uses animate-fade-in on overlay`, () => {
    expect(roundEndSource).toContain('animate-fade-in')
  })

  it(`${roundEndFileName} inner card uses bg-card max-w-md`, () => {
    expect(roundEndSource).toContain('bg-card max-w-md')
  })

  it(`${roundEndFileName} inner card uses rounded-2xl`, () => {
    expect(roundEndSource).toContain('rounded-2xl')
  })

  it(`${roundEndFileName} inner card uses animate-scale-in`, () => {
    expect(roundEndSource).toContain('animate-scale-in')
  })

  it(`${gameOverFileName} uses same overlay structure as RoundEndCard`, () => {
    expect(gameOverSource).toContain('fixed inset-0')
    expect(gameOverSource).toContain('bg-black/50')
    expect(gameOverSource).toContain('animate-fade-in')
    expect(gameOverSource).toContain('bg-card max-w-md')
    expect(gameOverSource).toContain('rounded-2xl')
    expect(gameOverSource).toContain('animate-scale-in')
  })
})
