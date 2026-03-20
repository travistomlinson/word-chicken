/// <reference types="node" />
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve, basename } from 'path'

// ---------------------------------------------------------------------------
// COLR-03: Yellow background tiles must use dark charcoal text, not white
// ---------------------------------------------------------------------------
describe('COLR-03: Yellow background contrast', () => {
  const tileCardSource = readFileSync(resolve(__dirname, '../components/TileCard.tsx'), 'utf-8')
  const configSource = readFileSync(resolve(__dirname, '../screens/ConfigScreen.tsx'), 'utf-8')
  const lobbySource = readFileSync(resolve(__dirname, '../screens/LobbyScreen.tsx'), 'utf-8')

  it('TileCard yellow colorClass uses text-charcoal (not text-white)', () => {
    // Extract the yellow entry from colorClasses
    const yellowMatch = tileCardSource.match(/yellow:\s*['"][^'"]*['"]/)
    expect(yellowMatch).not.toBeNull()
    const yellowEntry = yellowMatch![0]
    expect(yellowEntry).toContain('text-charcoal')
    expect(yellowEntry).not.toContain('text-white')
  })

  it('ConfigScreen Play a Friend button does not use text-white on yellow bg', () => {
    // The "Play a Friend" button className string has bg-corbusier-yellow — must use text-charcoal
    // Find the Play a Friend button's className line (the line with bg-corbusier-yellow that is NOT a ternary)
    const lines = configSource.split('\n')
    const violations = lines.filter(
      (line: string) =>
        line.includes('bg-corbusier-yellow') &&
        line.includes('text-white') &&
        // Exclude ternary expressions like: ? 'text-charcoal' : 'text-white'
        !line.includes('?')
    )
    expect(violations).toEqual([])
  })

  it('LobbyScreen Join button does not use text-white on yellow bg', () => {
    const lines = lobbySource.split('\n')
    const violations = lines.filter(
      (line: string) =>
        line.includes('bg-corbusier-yellow') &&
        line.includes('text-white') &&
        !line.includes('?')
    )
    expect(violations).toEqual([])
  })

  it('ConfigScreen difficulty cards apply conditional text color for yellow bg', () => {
    // The medium (yellow) difficulty card must NOT have a bare unconditional 'text-white'
    // in the difficulty map. Allowed: ternary like `opt.bg === '...' ? 'text-charcoal' : 'text-white'`
    // Disallowed: standalone `'text-white'` on its own array element line.
    const difficultyMapSection = configSource.match(
      /difficultyOptions\.map[\s\S]*?<\/button>/
    )
    expect(difficultyMapSection).not.toBeNull()
    const section = difficultyMapSection![0]

    // Check that 'text-white' only appears as the falsy branch of a ternary (after ':')
    // A standalone line like `  'text-white',` is unconditional — disallowed.
    // Lines with `? ... : 'text-white'` are conditional — allowed.
    const lines = section.split('\n')
    const unconditionalLines = lines.filter((line: string) => {
      // Line contains 'text-white' but is NOT a ternary line (no '?' before 'text-white')
      return /['"]text-white['"]/.test(line) && !/\?/.test(line)
    })
    expect(unconditionalLines).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// COLR-04: ChickenOMeter gradient must use CSS custom properties, not hex
// ---------------------------------------------------------------------------
describe('COLR-04: ChickenOMeter tokenized gradient', () => {
  const chickenSource = readFileSync(resolve(__dirname, '../components/ChickenOMeter.tsx'), 'utf-8')
  const cssSource = readFileSync(resolve(__dirname, '../index.css'), 'utf-8')

  it('ChickenOMeter does not contain hardcoded hex values in style attributes', () => {
    // Must not contain inline hex in style= prop
    expect(chickenSource).not.toMatch(/style=\{?\{[^}]*#003f91/)
    expect(chickenSource).not.toMatch(/style=\{?\{[^}]*#f5a623/)
    expect(chickenSource).not.toMatch(/style=\{?\{[^}]*#d0021b/)
  })

  it('ChickenOMeter uses gradient-tension CSS class', () => {
    expect(chickenSource).toContain('gradient-tension')
  })

  it('index.css defines .gradient-tension with CSS custom property references', () => {
    expect(cssSource).toContain('.gradient-tension')
    const gradientMatch = cssSource.match(/\.gradient-tension\s*\{[^}]+\}/)
    expect(gradientMatch).not.toBeNull()
    const gradientBlock = gradientMatch![0]
    expect(gradientBlock).toContain('var(--color-')
  })

  it('index.css has ink-secondary token in @theme', () => {
    expect(cssSource).toContain('--color-ink-secondary')
  })

  it('index.css has accent-primary token in @theme', () => {
    expect(cssSource).toContain('--color-accent-primary')
  })

  it('index.css has accent-danger token in @theme', () => {
    expect(cssSource).toContain('--color-accent-danger')
  })

  it('index.css has dark mode overrides for ink-secondary, accent-primary, accent-danger', () => {
    // The .dark block must contain all three overrides
    const darkMatch = cssSource.match(/\.dark\s*\{[^}]+\}/)
    expect(darkMatch).not.toBeNull()
    const darkBlock = darkMatch![0]
    expect(darkBlock).toContain('--color-ink-secondary')
    expect(darkBlock).toContain('--color-accent-primary')
    expect(darkBlock).toContain('--color-accent-danger')
  })
})

// ---------------------------------------------------------------------------
// COLR-01: Secondary text must meet 4.5:1 — ink/N < 70 flags
// Plan 02 will enable these
// ---------------------------------------------------------------------------
describe('COLR-01: Secondary text contrast', () => {
  // Decorative exemptions: these are intentionally low-opacity decorative elements
  const DECORATIVE_EXEMPTIONS: Record<string, string[]> = {
    'GameScreen.tsx': ['"vs"', 'separator'],
    'LobbyScreen.tsx': ['"or"', 'separator'],
  }

  const componentDir = resolve(__dirname, '../components')
  const screensDir = resolve(__dirname, '../screens')

  const files = [
    ...['TileCard.tsx', 'ChickenOMeter.tsx', 'PlayerHand.tsx', 'SharedWordDisplay.tsx',
        'HowToPlayModal.tsx', 'StagingArea.tsx'].map(f => resolve(componentDir, f)),
    ...['GameScreen.tsx', 'ConfigScreen.tsx', 'LobbyScreen.tsx'].map(f => resolve(screensDir, f)),
  ]

  files.forEach((filePath) => {
    const fileName = basename(filePath)
    it(`${fileName} has no text-ink/N below 70 (except decorative)`, () => {
      let source: string
      try {
        source = readFileSync(filePath, 'utf-8')
      } catch {
        // File may not exist yet — skip
        return
      }
      const exemptions = DECORATIVE_EXEMPTIONS[fileName] || []
      const lines = source.split('\n')
      const violations: string[] = []

      lines.forEach((line, idx) => {
        const match = line.match(/text-ink\/(\d+)/)
        if (match) {
          const opacity = parseInt(match[1], 10)
          if (opacity < 70) {
            const isExempt = exemptions.some((ex) => line.includes(ex))
            if (!isExempt) {
              violations.push(`Line ${idx + 1}: ${line.trim()}`)
            }
          }
        }
      })

      expect(violations).toEqual([])
    })
  })
})

// ---------------------------------------------------------------------------
// COLR-02: Brand colors as text must have dark: override or use accent tokens
// Plan 02 will enable these
// ---------------------------------------------------------------------------
describe('COLR-02: Brand color text in dark mode', () => {
  const componentDir = resolve(__dirname, '../components')
  const screensDir = resolve(__dirname, '../screens')

  const files = [
    ...['TileCard.tsx', 'ChickenOMeter.tsx', 'PlayerHand.tsx', 'SharedWordDisplay.tsx',
        'HowToPlayModal.tsx', 'StagingArea.tsx'].map(f => resolve(componentDir, f)),
    ...['GameScreen.tsx', 'ConfigScreen.tsx', 'LobbyScreen.tsx'].map(f => resolve(screensDir, f)),
  ]

  files.forEach((filePath) => {
    const fileName = basename(filePath)
    it(`${fileName} does not use text-corbusier-blue or text-corbusier-red without dark: override`, () => {
      let source: string
      try {
        source = readFileSync(filePath, 'utf-8')
      } catch {
        return
      }
      const lines = source.split('\n')
      const violations: string[] = []

      lines.forEach((line, idx) => {
        // Look for text-corbusier-blue or text-corbusier-red WITHOUT a dark: prefix on same line
        if (/text-corbusier-(?:blue|red)/.test(line)) {
          // It's a violation if there's no dark: override on the same line
          const hasDarkOverride = /dark:text-/.test(line)
          if (!hasDarkOverride) {
            violations.push(`Line ${idx + 1}: ${line.trim()}`)
          }
        }
      })

      expect(violations).toEqual([])
    })
  })
})
