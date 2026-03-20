---
phase: 08-visual-polish-and-hierarchy
plan: "01"
subsystem: ui-components
tags: [visual-polish, typography, layout, testing]
dependency_graph:
  requires: []
  provides: [PLSH-01, PLSH-03, PLSH-05, visual-polish-test-scaffold]
  affects: [TurnIndicator, ChickenOMeter]
tech_stack:
  added: []
  patterns: [static-source-analysis-tests, readFileSync-test-pattern]
key_files:
  created:
    - src/__tests__/visual-polish.test.ts
  modified:
    - src/components/TurnIndicator.tsx
    - src/components/ChickenOMeter.tsx
decisions:
  - "TurnIndicator baseClass uses text-lg only (not font-bold in baseClass) — font-bold remains on individual active-state branches as intended"
  - "PLSH-05 verified as already met — no code changes needed for RoundEndCard overlay consistency"
  - "PLSH-02 and PLSH-04 use describe.skip to appear in test output clearly marked for Plan 02"
metrics:
  duration: "3m"
  completed_date: "2026-03-20"
  tasks_completed: 2
  files_changed: 3
---

# Phase 8 Plan 01: Visual Polish Test Scaffold and CSS Fixes Summary

Test scaffold for all five PLSH requirements plus TurnIndicator text-lg dominance fix (18px vs 10px round counter) and ChickenOMeter w-8 width fix (32px readable on mobile).

## What Was Built

Created `src/__tests__/visual-polish.test.ts` with five describe blocks covering all PLSH requirements using the Phase 7 readFileSync static analysis pattern. Implemented the two CSS-level fixes for PLSH-01 and PLSH-03.

## Tasks Completed

### Task 1: Create visual-polish.test.ts with all PLSH test stubs
- Commit: `13bc567`
- Created `src/__tests__/visual-polish.test.ts` with 5 describe blocks
- PLSH-01 (TurnIndicator dominance): failing (RED — expected before fix)
- PLSH-02 (ScorePanel round score hierarchy): skipped via `describe.skip`
- PLSH-03 (ChickenOMeter width): failing (RED — expected before fix)
- PLSH-04 (Staged tile distinct visual state): skipped via `describe.skip`
- PLSH-05 (RoundEndCard overlay consistency): passing (already met)

### Task 2: Fix TurnIndicator dominance and ChickenOMeter width
- Commit: `843ab42`
- `TurnIndicator.tsx`: `text-sm` → `text-lg` in baseClass (14px → 18px)
- `ChickenOMeter.tsx`: `w-5` → `w-8` in bar container class (20px → 32px)
- PLSH-01 and PLSH-03 tests now passing (GREEN)
- Full suite: 187 tests pass, 4 skipped, 0 failures

## Verification Results

```
npx vitest run src/__tests__/visual-polish.test.ts
  Tests: 10 passed | 4 skipped (14)

npx vitest run
  Test Files: 14 passed (14)
  Tests: 187 passed | 4 skipped (191)
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] PLSH-01 font-bold test assertion corrected**
- **Found during:** Task 1 verification
- **Issue:** Initial test checked for `text-lg.*font-bold` regex on same line, but `font-bold` lives on individual return branches, not in `baseClass` string. Test would have remained failing even after the fix.
- **Fix:** Changed assertion to check `source.toContain('font-bold')` separately (file-level check) rather than requiring co-location with `text-lg` on the same line.
- **Files modified:** `src/__tests__/visual-polish.test.ts`
- **Commit:** `13bc567`

## Key Decisions

- TurnIndicator baseClass uses `text-lg` only; `font-bold` remains on individual active-state branches (correct per plan — only active states use bold)
- PLSH-05 confirmed already met — RoundEndCard uses `fixed inset-0`, `bg-black/50`, `animate-fade-in`, `bg-card max-w-md`, `rounded-2xl`, `animate-scale-in` matching GameOverScreen exactly

## Self-Check: PASSED

All key files found. All commits verified.

| Item | Status |
|------|--------|
| src/__tests__/visual-polish.test.ts | FOUND |
| src/components/TurnIndicator.tsx | FOUND |
| src/components/ChickenOMeter.tsx | FOUND |
| commit 13bc567 | FOUND |
| commit 843ab42 | FOUND |
