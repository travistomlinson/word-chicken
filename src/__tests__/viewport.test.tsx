/// <reference types="node" />
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('Viewport classes', () => {
  describe('GameScreen', () => {
    const source = readFileSync(resolve(__dirname, '../screens/GameScreen.tsx'), 'utf-8')

    it('outer container uses min-h-dvh instead of min-h-screen', () => {
      expect(source).toContain('min-h-dvh')
      expect(source).not.toMatch(/className="[^"]*min-h-screen/)
    })

    it('outer container includes overscroll-none', () => {
      expect(source).toContain('overscroll-none')
    })

    it('fixed overlays include h-dvh for full viewport coverage', () => {
      // Both reconnecting and disconnect overlays should have h-dvh
      const fixedOverlays = source.match(/fixed inset-0[^"]*"/g) || []
      expect(fixedOverlays.length).toBeGreaterThanOrEqual(2)
      fixedOverlays.forEach((overlay: string) => {
        expect(overlay).toContain('h-dvh')
      })
    })
  })

  describe('ConfigScreen', () => {
    const source = readFileSync(resolve(__dirname, '../screens/ConfigScreen.tsx'), 'utf-8')

    it('outer container uses min-h-dvh instead of min-h-screen', () => {
      expect(source).toContain('min-h-dvh')
      expect(source).not.toMatch(/className="[^"]*min-h-screen/)
    })
  })

  describe('LobbyScreen', () => {
    const source = readFileSync(resolve(__dirname, '../screens/LobbyScreen.tsx'), 'utf-8')

    it('outer container uses min-h-dvh instead of min-h-screen', () => {
      expect(source).toContain('min-h-dvh')
      expect(source).not.toMatch(/className="[^"]*min-h-screen/)
    })
  })

  describe('Dark mode overscroll fix (VPRT-05)', () => {
    const css = readFileSync(resolve(__dirname, '../index.css'), 'utf-8')

    it('index.css contains html:has(.dark) background rule', () => {
      expect(css).toContain('html:has(.dark)')
      expect(css).toMatch(/html:has\(\.dark\)\s*\{[^}]*background-color/)
    })
  })

  describe('viewport-fit=cover (Phase 6 prerequisite)', () => {
    const html = readFileSync(resolve(__dirname, '../../index.html'), 'utf-8')

    it('index.html viewport meta includes viewport-fit=cover', () => {
      expect(html).toContain('viewport-fit=cover')
    })
  })
})
