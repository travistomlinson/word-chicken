---
phase: 06-mobile-layout-and-touch-audit
plan: "01"
subsystem: mobile-layout
tags: [safe-area, viewport, ios, css-utilities, test-scaffold]
dependency_graph:
  requires: [05-viewport-foundation]
  provides: [safe-area-insets, phase-6-test-scaffold]
  affects: [GameScreen, ConfigScreen, LobbyScreen, index.css]
tech_stack:
  added: []
  patterns: [pt-safe/pb-safe CSS utilities via max(env(safe-area-inset-*), 0.5rem)]
key_files:
  created:
    - src/__tests__/mobile-touch.test.tsx
  modified:
    - src/index.css
    - src/screens/GameScreen.tsx
    - src/screens/ConfigScreen.tsx
    - src/screens/LobbyScreen.tsx
decisions:
  - "Use CSS utility classes (pt-safe/pb-safe) instead of Tailwind arbitrary values for env() to avoid parser edge cases with nested calc(env(...))"
  - "max(env(safe-area-inset-*), 0.5rem) ensures minimum 0.5rem padding on non-notched devices"
  - "ConfigScreen and LobbyScreen get pb-safe only (top inset not needed — scrollable screens)"
  - "TUCH-03 test uses class array split to avoid false positive: min-h-dvh contains h-dvh as substring"
metrics:
  duration: "2m"
  completed_date: "2026-03-19"
  tasks: 2
  files_changed: 5
---

# Phase 06 Plan 01: Safe-Area Insets and Mobile Touch Test Scaffold Summary

Safe-area inset padding applied to all screens via pt-safe/pb-safe CSS utilities so no content is clipped by iPhone notch, Dynamic Island, or home indicator gesture zone.

## What Was Built

### CSS Utility Classes (src/index.css)

Two utility classes added after the `html:has(.dark)` block:

```css
.pt-safe {
  padding-top: max(env(safe-area-inset-top), 0.5rem);
}
.pb-safe {
  padding-bottom: max(env(safe-area-inset-bottom), 0.5rem);
}
```

The `max()` function ensures at least 0.5rem padding on non-notched devices — never zero.

### Screen Updates

- **GameScreen**: `p-2 sm:p-4` replaced with `pt-safe pb-safe px-2 sm:px-4` — clears notch/Dynamic Island at top and home indicator at bottom; satisfies TUCH-02 (Submit area clears home indicator via outer container pb-safe)
- **ConfigScreen**: `p-4` replaced with `px-4 pt-4 pb-safe` — bottom inset only (scrollable screen, content scrolls under status bar)
- **LobbyScreen**: `p-4` replaced with `px-4 pt-4 pb-safe` — same pattern as ConfigScreen; Back button remains in normal flow (TUCH-03)

### Test Scaffold (src/__tests__/mobile-touch.test.tsx)

Shared test file for the entire Phase 6, covering all requirements:
- **VPRT-04**: Source-scan tests for safe-area-inset references in all three screens and index.css
- **TUCH-01**: 44px min-height tests for all secondary buttons (6 tests — Plan 02 scope, intentionally failing)
- **TUCH-02**: GameScreen bottom safe-area clearance
- **TUCH-03**: LobbyScreen Back button in flow, min-h-dvh, bottom inset

Test results after plan: 11 passing, 6 failing (all TUCH-01, expected Plan 02 scope).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TUCH-03 regex false positive for min-h-dvh**
- **Found during:** Task 2 verification
- **Issue:** The test used `/\bh-dvh\b/` to assert the outer container does NOT use bare `h-dvh`. Since `-` is not a word boundary character, `min-h-dvh` matched as containing `h-dvh`, causing a false failure.
- **Fix:** Changed the test to split classes by whitespace and check the class array with `.not.toContain('h-dvh')` — this correctly treats `min-h-dvh` as a distinct token.
- **Files modified:** src/__tests__/mobile-touch.test.tsx
- **Commit:** 66b8a15

## Test Results

| Suite | Passing | Failing | Notes |
|-------|---------|---------|-------|
| mobile-touch.test.tsx | 11 | 6 | TUCH-01 fails are Plan 02 scope |
| Full suite | 142 | 6 | No regressions |

## Self-Check: PASSED

All created/modified files exist on disk. Both task commits (fd5afcb, 66b8a15) confirmed in git log.
