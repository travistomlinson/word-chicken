---
phase: 08-visual-polish-and-hierarchy
plan: 02
subsystem: ui-components
tags: [visual-polish, tile-card, player-hand, score-panel, accessibility]
dependency_graph:
  requires: [08-01]
  provides: [PLSH-02, PLSH-04]
  affects: [TileCard, PlayerHand, ScorePanel]
tech_stack:
  added: []
  patterns: [token-based-colors, bg-ink/N opacity variants, dashed-border visual state]
key_files:
  created: []
  modified:
    - src/components/TileCard.tsx
    - src/components/PlayerHand.tsx
    - src/components/ScorePanel.tsx
    - src/__tests__/visual-polish.test.ts
decisions:
  - "Staged tiles use bg-ink/15 + border-dashed + border-ink/40 — token-based so it works in both light and dark mode without additional theming"
  - "Round score displayed as primary large number; total score as 'Total: N' in text-xs text-ink-secondary — hierarchy is clear without changing layout structure"
  - "Leading highlight (bg-corbusier-blue/10 / bg-corbusier-red/10) kept based on total scores since that is the persistent game state"
metrics:
  duration: 2m
  completed_date: "2026-03-20"
  tasks_completed: 2
  files_modified: 4
---

# Phase 08 Plan 02: Staged Tile Visual State and ScorePanel Round Score Hierarchy Summary

**One-liner:** Staged tile gets dashed translucent 'staged' color variant (clickable for unstaging); ScorePanel shows round score as primary large number with total score as secondary label.

## What Was Built

### Task 1: Staged tile color variant (PLSH-04)

Added `'staged'` as a new color variant in TileCard:
- Type union extended: `color?: 'red' | 'blue' | 'yellow' | 'concrete' | 'staged'`
- colorClasses entry: `bg-ink/15 text-ink-secondary border-2 border-dashed border-ink/40 shadow-none`
- Dashed border is the key visual differentiator from the concrete available-tile state

PlayerHand updated in both mobile (3/4/3 rows) and desktop (flex-wrap) layouts:
- Color ternary changed from `isStaged ? 'concrete'` to `isStaged ? 'staged'`
- `disabled={isStaged}` removed — staged tiles remain fully clickable for unstaging

### Task 2: ScorePanel round score hierarchy (PLSH-02)

ScorePanel restructured to make round score the primary visual:
- `roundScores: _roundScores` alias removed — prop used directly
- `myRoundScore` and `opponentRoundScore` extracted per player
- Large bold number (existing `text-2xl sm:text-3xl` / `text-xl sm:text-2xl`) now shows round score
- Secondary line `Total: {N}` added in `text-xs text-ink-secondary` below each score

## Verification

- All 5 PLSH tests pass (PLSH-01 through PLSH-05), none skipped
- Full suite: 191 tests pass, 0 failures

## Deviations from Plan

None — plan executed exactly as written.

## Commits

- `343f516` feat(08-02): add staged tile color variant and update PlayerHand
- `1ebcb4c` feat(08-02): display round scores prominently in ScorePanel

## Self-Check: PASSED

- src/components/TileCard.tsx — FOUND
- src/components/PlayerHand.tsx — FOUND
- src/components/ScorePanel.tsx — FOUND
- Commit 343f516 — FOUND
- Commit 1ebcb4c — FOUND
