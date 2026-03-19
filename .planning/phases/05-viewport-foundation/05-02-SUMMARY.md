---
phase: 05-viewport-foundation
plan: 02
subsystem: viewport
tags: [viewport, dvh, overscroll, dark-mode, mobile, ios]
dependency_graph:
  requires: []
  provides: [GameScreen-dvh-viewport, dark-overscroll-fix, viewport-fit-cover-gate]
  affects: [src/screens/GameScreen.tsx, src/index.css, index.html]
tech_stack:
  added: []
  patterns: [min-h-dvh-overscroll-none, html-has-dark-css, viewport-fit-cover]
key_files:
  created:
    - src/__tests__/viewport.test.tsx
  modified:
    - src/screens/GameScreen.tsx
    - src/index.css
    - index.html
decisions:
  - GameScreen uses min-h-dvh (not h-dvh) on outer container to avoid reflow jitter on iOS Safari during gameplay
  - Both fixed overlays (reconnecting + disconnect) include h-dvh so they cover the full dynamic viewport
  - html:has(.dark) targets the html element directly; avoids body-level overscroll bleed on iOS rubber-band scroll
metrics:
  duration: 3 minutes
  completed: 2026-03-19
  tasks_completed: 2
  files_changed: 4
---

# Phase 5 Plan 02: GameScreen Viewport Fixes Summary

GameScreen fixed to use `min-h-dvh` + `overscroll-none`, both modal overlays gain `h-dvh`, dark mode overscroll bleed fixed via `html:has(.dark)`, and `viewport-fit=cover` added as Phase 6 prerequisite.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create viewport.test.tsx (RED) | 30c4410 | src/__tests__/viewport.test.tsx |
| 2 | Apply GameScreen, index.html, index.css fixes (GREEN) | e723bc3 | src/screens/GameScreen.tsx, src/index.css, index.html |

## What Was Built

**GameScreen viewport fix (VPRT-02):**
- Outer container: `min-h-screen` replaced with `min-h-dvh overscroll-none`
- Reconnecting overlay: `fixed inset-0 h-dvh z-50 ...` (was missing `h-dvh`)
- Disconnect overlay: `fixed inset-0 h-dvh z-50 ...` (was missing `h-dvh`)

**Dark mode overscroll fix (VPRT-05):**
- Added `html:has(.dark) { background-color: var(--color-surface); }` to index.css
- Prevents iOS rubber-band overscroll from revealing browser-default white background in dark mode

**Phase 6 prerequisite:**
- `index.html` viewport meta updated to include `viewport-fit=cover`
- Required before any `env(safe-area-inset-*)` CSS returns non-zero on iOS

**Tests:**
- 7 new tests in `src/__tests__/viewport.test.tsx` (source-file string assertions, no store mocking needed)
- Full suite: 131 tests pass

## Verification Results

| Check | Result |
|-------|--------|
| `min-h-screen` in GameScreen.tsx | 0 matches (removed) |
| `min-h-dvh` in GameScreen.tsx | 1 match |
| `h-dvh` in GameScreen.tsx | 3 matches (outer + 2 overlays) |
| `overscroll-none` in GameScreen.tsx | 1 match |
| `viewport-fit=cover` in index.html | 1 match |
| `html:has(.dark)` in index.css | 1 match |
| Full test suite | 131/131 pass |

## Decisions Made

- Used `min-h-dvh` (not `h-dvh`) on the outer GameScreen container: the `min-` prefix prevents reflow jitter on iOS Safari when the URL bar shows/hides during gameplay (research pitfall 2)
- Overlays use `h-dvh` (without `min-`) since they are fixed-position and must cover exactly the dynamic viewport
- `:has()` selector targets `html` element so the background bleeds under the entire viewport, not just the content area

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- [x] src/__tests__/viewport.test.tsx exists
- [x] src/screens/GameScreen.tsx modified
- [x] src/index.css modified
- [x] index.html modified
- [x] Commit 30c4410 exists (TDD RED)
- [x] Commit e723bc3 exists (TDD GREEN + implementation)

## Self-Check: PASSED
