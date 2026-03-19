---
phase: 05-viewport-foundation
plan: 01
subsystem: ui
tags: [react, tailwind, viewport, css, mobile]

# Dependency graph
requires: []
provides:
  - App loading/error shell uses min-h-svh (conservative viewport, no reflow jitter)
  - App main wrapper uses min-h-dvh (dynamic viewport, full real estate)
  - ConfigScreen outer container uses min-h-dvh
  - LobbyScreen outer container uses min-h-dvh
  - Three viewport-assertion tests in App.test.tsx
affects: [06-safe-area-insets, 07-game-screen-layout, 08-dark-mode-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "App shell (loading/error states) uses min-h-svh to avoid reflow jitter on iOS Safari"
    - "Scrollable full-viewport screens (Config, Lobby) use min-h-dvh"
    - "min-h-screen (100vh) is banned from App.tsx, ConfigScreen.tsx, LobbyScreen.tsx"

key-files:
  created: []
  modified:
    - src/App.tsx
    - src/screens/ConfigScreen.tsx
    - src/screens/LobbyScreen.tsx
    - src/__tests__/App.test.tsx

key-decisions:
  - "Loading/error App states use min-h-svh (not dvh) to avoid reflow when browser chrome shows/hides"
  - "Scrollable screens (Config, Lobby) use min-h-dvh so they fill available viewport dynamically"

patterns-established:
  - "Shell wrappers (loading, error): min-h-svh"
  - "Scrollable screen wrappers: min-h-dvh"
  - "min-h-screen is banned in viewport-aware screens"

requirements-completed: [VPRT-01, VPRT-03]

# Metrics
duration: 2min
completed: 2026-03-19
---

# Phase 5 Plan 01: Viewport Foundation - App Shell and Scrollable Screens Summary

**Swapped min-h-screen (100vh) for min-h-svh on App loading/error states and min-h-dvh on main wrapper, ConfigScreen, and LobbyScreen to respect mobile browser chrome on iOS Safari**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-19T08:12:20Z
- **Completed:** 2026-03-19T08:14:30Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- App loading and error states now use min-h-svh (conservative viewport — avoids reflow jitter when browser chrome appears/disappears)
- App main wrapper now uses min-h-dvh (dynamic viewport — fills all available real estate)
- ConfigScreen and LobbyScreen outer containers now use min-h-dvh
- Three new TDD tests assert viewport unit presence and absence of min-h-screen

## Task Commits

Each task was committed atomically:

1. **Task 1: Add viewport class assertions to App.test.tsx (RED)** - `30c4410` (test)
2. **Task 2: Replace min-h-screen with dvh/svh on App, Config, and Lobby (GREEN)** - `8f900b6` (feat)

_Note: TDD tasks have two commits (test RED -> feat GREEN)_

## Files Created/Modified
- `src/App.tsx` - Loading/error divs: min-h-screen -> min-h-svh; main wrapper: min-h-screen -> min-h-dvh
- `src/screens/ConfigScreen.tsx` - Outer container: min-h-screen -> min-h-dvh
- `src/screens/LobbyScreen.tsx` - Outer container: min-h-screen -> min-h-dvh
- `src/__tests__/App.test.tsx` - Added 3 viewport unit assertions (TDD RED -> GREEN)

## Decisions Made
- Loading and error App shell states use `min-h-svh` (not `min-h-dvh`) because these are static non-scrollable states where dynamic viewport tracking would cause unnecessary reflow jitter on iOS Safari when the browser chrome animates
- Scrollable screens (Config, Lobby) use `min-h-dvh` so content fills the full visible viewport including after the browser chrome collapses

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- App shell and scrollable screens now use correct viewport units
- GameScreen viewport fix (overscroll, safe-area) is handled in plan 05-02
- Phase 6 (safe-area-insets) can proceed once all viewport unit fixes are in place

---
*Phase: 05-viewport-foundation*
*Completed: 2026-03-19*
