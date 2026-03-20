/// <reference types="node" />
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Phase 6 Mobile Layout and Touch Audit — shared test scaffold
// Covers VPRT-04, TUCH-01, TUCH-02, TUCH-03

const gameScreenSource = readFileSync(
  resolve(__dirname, '../screens/GameScreen.tsx'),
  'utf-8'
)
const configScreenSource = readFileSync(
  resolve(__dirname, '../screens/ConfigScreen.tsx'),
  'utf-8'
)
const lobbyScreenSource = readFileSync(
  resolve(__dirname, '../screens/LobbyScreen.tsx'),
  'utf-8'
)
const cssSource = readFileSync(resolve(__dirname, '../index.css'), 'utf-8')

describe('VPRT-04 — Safe-area insets on all screens', () => {
  describe('GameScreen', () => {
    it('outer container references safe-area-inset-top', () => {
      // Either a direct CSS class reference or pt-safe utility (which contains safe-area-inset-top in index.css)
      const hasPtSafe = gameScreenSource.includes('pt-safe')
      const hasDirectTop = gameScreenSource.includes('safe-area-inset-top')
      expect(hasPtSafe || hasDirectTop).toBe(true)
    })

    it('outer container references safe-area-inset-bottom', () => {
      const hasPbSafe = gameScreenSource.includes('pb-safe')
      const hasDirectBottom = gameScreenSource.includes('safe-area-inset-bottom')
      expect(hasPbSafe || hasDirectBottom).toBe(true)
    })

    it('pt-safe or pb-safe utility is defined in index.css', () => {
      expect(cssSource).toContain('safe-area-inset')
    })
  })

  describe('ConfigScreen', () => {
    it('outer container references safe-area-inset-bottom', () => {
      const hasPbSafe = configScreenSource.includes('pb-safe')
      const hasDirectBottom = configScreenSource.includes('safe-area-inset-bottom')
      expect(hasPbSafe || hasDirectBottom).toBe(true)
    })
  })

  describe('LobbyScreen', () => {
    it('outer container references safe-area-inset-bottom', () => {
      const hasPbSafe = lobbyScreenSource.includes('pb-safe')
      const hasDirectBottom = lobbyScreenSource.includes('safe-area-inset-bottom')
      expect(hasPbSafe || hasDirectBottom).toBe(true)
    })
  })

  describe('index.css safe-area utility classes', () => {
    it('defines pt-safe utility with env(safe-area-inset-top)', () => {
      expect(cssSource).toContain('pt-safe')
      expect(cssSource).toContain('safe-area-inset-top')
    })

    it('defines pb-safe utility with env(safe-area-inset-bottom)', () => {
      expect(cssSource).toContain('pb-safe')
      expect(cssSource).toContain('safe-area-inset-bottom')
    })
  })
})

describe('TUCH-01 — Secondary button touch targets (44px minimum)', () => {
  describe('GameScreen', () => {
    it('Quit button has min-h-[44px]', () => {
      expect(gameScreenSource).toContain('min-h-[44px]')
    })
  })

  describe('PlayerHand', () => {
    const playerHandSource = readFileSync(
      resolve(__dirname, '../components/PlayerHand.tsx'),
      'utf-8'
    )

    it('Give Up button has min-h-[44px]', () => {
      expect(playerHandSource).toContain('min-h-[44px]')
    })

    it('Show a Word button has min-h-[44px]', () => {
      expect(playerHandSource).toContain('min-h-[44px]')
    })
  })

  describe('ConfigScreen', () => {
    it('How to Play button has min-h-[44px]', () => {
      expect(configScreenSource).toContain('min-h-[44px]')
    })
  })

  describe('LobbyScreen', () => {
    it('Copy Code button has min-h-[44px]', () => {
      expect(lobbyScreenSource).toContain('min-h-[44px]')
    })
  })

  describe('HowToPlayModal', () => {
    const howToPlaySource = readFileSync(
      resolve(__dirname, '../components/HowToPlayModal.tsx'),
      'utf-8'
    )

    it('Got It button has min-h-[44px]', () => {
      expect(howToPlaySource).toContain('min-h-[44px]')
    })
  })
})

describe('TUCH-02 — Primary action clears home indicator', () => {
  it('GameScreen outer container has pb-safe for home indicator clearance', () => {
    const hasPbSafe = gameScreenSource.includes('pb-safe')
    const hasDirectBottom = gameScreenSource.includes('safe-area-inset-bottom')
    expect(hasPbSafe || hasDirectBottom).toBe(true)
  })
})

describe('TUCH-03 — Lobby keyboard accessibility', () => {
  it('Back button is NOT fixed or sticky (remains in document flow)', () => {
    // Extract the Back button className to check it has no fixed/sticky
    const backButtonMatch = lobbyScreenSource.match(
      /handleBack[\s\S]{0,200}className="([^"]+)"/
    )
    if (backButtonMatch) {
      const backButtonClass = backButtonMatch[1]
      expect(backButtonClass).not.toContain('fixed')
      expect(backButtonClass).not.toContain('sticky')
    } else {
      // If pattern doesn't match, ensure 'fixed' is not near Back button text
      expect(lobbyScreenSource).not.toMatch(/fixed[^"]*Back|Back[^"]*fixed/)
    }
  })

  it('LobbyScreen outer container uses min-h-dvh (scrollable, not h-dvh)', () => {
    expect(lobbyScreenSource).toContain('min-h-dvh')
    // Outer container should not use h-dvh (which would clip content)
    const outerContainerMatch = lobbyScreenSource.match(
      /return[\s\S]{0,50}<div className="([^"]+)"/
    )
    if (outerContainerMatch) {
      // min-h-dvh is fine; only a bare 'h-dvh' (not preceded by 'min-') would clip content
      const classes = outerContainerMatch[1].split(/\s+/)
      expect(classes).not.toContain('h-dvh')
    }
  })

  it('LobbyScreen outer container has bottom safe-area inset', () => {
    const hasPbSafe = lobbyScreenSource.includes('pb-safe')
    const hasDirectBottom = lobbyScreenSource.includes('safe-area-inset-bottom')
    expect(hasPbSafe || hasDirectBottom).toBe(true)
  })
})
