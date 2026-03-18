---
phase: 04-game-ui
plan: 03
subsystem: ui-interaction
tags: [react, zustand, tile-interaction, animation, validation]
dependency_graph:
  requires: [04-01, 04-02]
  provides: [PlayerHand, StagingArea]
  affects: [GameScreen]
tech_stack:
  added: []
  patterns: [index-based-tile-staging, pre-dispatch-validation, interval-animation]
key_files:
  created:
    - src/components/StagingArea.tsx
    - src/components/PlayerHand.tsx
  modified:
    - src/screens/GameScreen.tsx
decisions:
  - PlayerHand uses index-based staging (not letter-based) — handles duplicate letters correctly, tapping one E never affects other Es
  - Pre-validation runs before dispatch — store reducer rejects invalid moves silently so UI must validate first to show errors
  - Shake animation driven by boolean state + setTimeout reset — CSS animate-shake class applied to staged tiles row
  - AI thinking animation uses setInterval at 80ms cycling through LETTERS constant — cleans up on phase change
  - remainingHand computed during render (not in useEffect) — avoids stale derived state pitfall
metrics:
  duration: 2min
  completed: "2026-03-18"
  tasks_completed: 2
  files_changed: 3
---

# Phase 4 Plan 3: PlayerHand Tile Interaction Summary

Index-based tile staging with pre-dispatch validation, shake error feedback, and slot-machine AI thinking animation wired into GameScreen.

## What Was Built

### StagingArea (`src/components/StagingArea.tsx`)
Purely presentational component accepting staged letters, error state, and callbacks. Renders:
- Staged tile row with `animate-shake` class when `shaking` is true
- "Tap tiles below" placeholder when empty and not disabled
- Error text in red beneath the staging row
- Submit button ("Submit Word" / "Start Round") disabled when empty or during non-interactive phases

### PlayerHand (`src/components/PlayerHand.tsx`)
The primary interaction component managing all local state and dispatching to `useGameStore`. Key behaviors:
- Maintains `stagedIndices: number[]` — tracks which hand indices are staged, not which letters. Duplicate letters are handled correctly.
- `handleTileClick(handIndex)`: toggles staging of a tile by its array index
- `handleUnstage(stagingIndex)`: removes from staging by position in the staging list
- `handleSubmit()`: pre-validates using `validateStartingWord` (SETUP) or `validateTurn` (HUMAN_TURN), shows user-friendly error with shake on failure, dispatches on success
- Resets `stagedIndices` and `error` in a `useEffect` keyed on `[roundNumber, phase]`
- During `AI_THINKING`: shows slot-machine cycling tiles (80ms interval, random letters from LETTERS constant) plus disabled hand tiles
- During `ROUND_END`/`GAME_OVER`: returns null (hidden)
- Give Up link dispatches `ELIMINATE_PLAYER` during `HUMAN_TURN`

### GameScreen (`src/screens/GameScreen.tsx`)
Replaced the `player-hand-area` placeholder div with `<PlayerHand />` in the main flexible area, adding `pb-8` padding to the container.

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- All 124 existing tests pass: `npx vitest run`
- StagingArea renders tappable blue tiles, removable by tap
- PlayerHand renders remaining hand tiles as concrete-colored clickable tiles
- Invalid submissions trigger shake + error text without dispatching
- AI thinking phase shows cycling red tiles + disabled hand
- Give Up link visible only during HUMAN_TURN

## Self-Check: PASSED

- FOUND: src/components/StagingArea.tsx
- FOUND: src/components/PlayerHand.tsx
- FOUND: src/screens/GameScreen.tsx (modified)
- FOUND: commit 728fdf3 (Task 1)
- FOUND: commit 2043a21 (Task 2)
