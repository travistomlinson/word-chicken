---
phase: 07-color-and-contrast-audit
plan: 01
subsystem: design-tokens, accessibility, components
tags: [wcag, contrast, css-tokens, tilecard, chickenmeter, configscreen]
dependency_graph:
  requires: []
  provides: [color-contrast-test-scaffold, ink-secondary-token, accent-tokens, gradient-tension-utility]
  affects: [TileCard, ChickenOMeter, ConfigScreen]
tech_stack:
  added: []
  patterns:
    - CSS custom properties for gradient utilities
    - Conditional Tailwind class based on bg color variant
    - Source-level WCAG compliance testing via fs.readFileSync
key_files:
  created:
    - src/__tests__/color-contrast.test.ts
  modified:
    - src/index.css
    - src/components/TileCard.tsx
    - src/components/ChickenOMeter.tsx
    - src/screens/ConfigScreen.tsx
decisions:
  - "Test assertions for ternary-conditional text colors use line-level '?' check to avoid false positives"
  - "COLR-01/02 tests use describe.skip so they appear in output and are clearly marked for Plan 02"
  - "ChickenOMeter word length label changed to text-ink-secondary (bonus COLR-01 fix alongside COLR-04 work)"
metrics:
  duration: "4m"
  completed_date: "2026-03-20"
  tasks_completed: 2
  files_changed: 5
---

# Phase 07 Plan 01: Color Contrast Token Foundation Summary

WCAG-compliant CSS design tokens and yellow-background text fixes using text-charcoal, plus ChickenOMeter gradient tokenized via gradient-tension utility class.

## What Was Built

### Test Scaffold (src/__tests__/color-contrast.test.ts)
Source-level WCAG compliance test file using Vitest and `fs.readFileSync`. Covers:
- **COLR-03** (2 tests): TileCard yellow uses text-charcoal; ConfigScreen difficulty cards conditional; Play a Friend button uses text-charcoal
- **COLR-04** (5 tests): ChickenOMeter has no hardcoded hex; uses gradient-tension class; index.css defines .gradient-tension with var() references; all three new tokens exist in @theme and .dark
- **COLR-01** (describe.skip): Secondary text ink/N < 70 violations — Plan 02 will enable
- **COLR-02** (describe.skip): Brand color text without dark: override — Plan 02 will enable

Final result: 10 passing, 18 skipped, 0 failing.

### CSS Design Tokens (src/index.css)
New tokens in `@theme`:
- `--color-ink-secondary: #6b6967` — ~4.6:1 on light surfaces
- `--color-accent-primary: #003f91` — brand blue (light mode)
- `--color-accent-danger: #d0021b` — brand red (light mode)

Dark mode overrides in `.dark`:
- `--color-ink-secondary: #a09e9a` — ~4.5:1 on dark surfaces
- `--color-accent-primary: #5b8de0` — lighter blue, ~4.6:1 on dark
- `--color-accent-danger: #f07070` — lighter red, ~5.0:1 on dark

New `.gradient-tension` utility class referencing `var(--color-corbusier-*)` tokens.

### Component Fixes
- **TileCard.tsx**: `yellow` colorClass changed from `text-white` to `text-charcoal` (fixes all yellow tiles site-wide)
- **ConfigScreen.tsx**: Difficulty cards use ternary `opt.bg === 'bg-corbusier-yellow' ? 'text-charcoal' : 'text-white'`; Play a Friend button changed to `text-charcoal`
- **ChickenOMeter.tsx**: Inline `style={{ background: 'linear-gradient(...)' }}` removed; `gradient-tension` added to className; word length label changed from `text-ink/40` to `text-ink-secondary`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing functionality] ChickenOMeter word length label fixed alongside COLR-04**
- **Found during:** Task 2
- **Issue:** Plan called out `text-ink/40` on the word length label as a COLR-01 violation to fix
- **Fix:** Changed to `text-ink-secondary` while doing the COLR-04 gradient work on the same component
- **Files modified:** src/components/ChickenOMeter.tsx
- **Commit:** 816861b

**2. [Rule 1 - Bug] Test regex false positives for ternary expressions**
- **Found during:** Task 1 and Task 2 verification
- **Issue:** Test assertions using broad regex (`[^>]*`) and string presence checks triggered false positives on ternary expressions containing both `bg-corbusier-yellow` and `text-white` on the same line
- **Fix:** Rewrote assertions to use line-by-line checks with `?` guard to distinguish conditional vs unconditional usage
- **Files modified:** src/__tests__/color-contrast.test.ts
- **Commits:** b709ef5, 816861b

## Verification Results

```
npx vitest run src/__tests__/color-contrast.test.ts
  Test Files  1 passed (1)
  Tests       10 passed | 18 skipped (28)

npx vitest run (full suite)
  Test Files  13 passed (13)
  Tests       158 passed | 18 skipped (176)
```

- TileCard yellow: `text-charcoal` confirmed (5.61:1 ratio)
- ChickenOMeter: no hardcoded hex (#003f91, #f5a623, #d0021b)
- gradient-tension: defined in index.css at line 50
- All three new CSS tokens in @theme and .dark

## Self-Check: PASSED
