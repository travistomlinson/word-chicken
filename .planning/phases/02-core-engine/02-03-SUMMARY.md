---
phase: 02-core-engine
plan: "03"
subsystem: game-logic
tags: [typescript, vitest, tdd, scoring, round-management]

# Dependency graph
requires:
  - phase: 02-core-engine-01
    provides: wordValidator with isInDictionary for starting word validation
  - phase: 02-core-engine-02
    provides: tileBag with createBag and dealHand for round setup
provides:
  - scoreWord function with length-based scoring and rare letter bonuses (Q/Z/X/J)
  - STARTING_WORDS corpus of 330+ curated 3-letter game start words
  - validateStartingWord checking dictionary, corpus membership, hand availability
  - eliminatePlayer pure function for round elimination
  - checkRoundEnd detecting winner when 1 active player remains
  - createRoundState initializing fresh round with 9-tile hands for all players
  - startNextRound advancing to new round with winner as first player
  - PlayerState and RoundState types in game.ts
affects:
  - 03-game-state
  - 04-ui

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Pure functions returning new state (never mutating inputs)
    - TDD Red-Green cycle for all game logic modules
    - Dictionary injected as Set<string> parameter (testability, no global imports)

key-files:
  created:
    - src/lib/scoreCalculator.ts
    - src/lib/__tests__/scoreCalculator.test.ts
    - src/lib/roundManager.ts
    - src/lib/__tests__/roundManager.test.ts
    - src/lib/startingWords.ts
  modified:
    - src/types/game.ts

key-decisions:
  - "scoreWord receives raw game-state word (Q as single char); Q earns 10-point bonus directly — no QU expansion in scoring, only in dictionary lookup"
  - "startNextRound revives all eliminated players with fresh 9-tile hands (GAME-08) — round boundaries are full resets"
  - "validateStartingWord check order: dictionary first, then corpus, then hand — fails fast on most common rejections"
  - "STARTING_WORDS corpus hardcoded as string array; 330 words chosen for common 4-letter extension potential"

patterns-established:
  - "Pure state transitions: eliminatePlayer, startNextRound all return new RoundState objects without mutating inputs"
  - "Round lifecycle: createRoundState for fresh start, startNextRound for continuation, both deal 9 tiles per player"

requirements-completed: [SCOR-01, SCOR-02, GAME-01, GAME-05, GAME-06, GAME-07, GAME-08]

# Metrics
duration: 3min
completed: 2026-03-18
---

# Phase 2 Plan 03: ScoreCalculator and RoundManager Summary

**Word scoring with rare-letter bonuses (Q=10, Z=8, X/J=6) plus full round lifecycle: starting word validation against 330-word corpus, player elimination, winner detection, and fresh-hand round reset**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-18T21:39:43Z
- **Completed:** 2026-03-18T21:42:15Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- scoreWord computes length*1 + rare letter bonuses; Q scored as raw char earning full 10-point bonus
- STARTING_WORDS corpus: 330+ uppercase 3-letter words with common 4-letter extension potential
- validateStartingWord: dictionary check + corpus membership + hand availability (in that order)
- Pure eliminatePlayer, checkRoundEnd, createRoundState, startNextRound functions — no mutation
- All players receive fresh 9-tile hands at each round start including previously eliminated players (GAME-08)
- Full test suite: 81/81 passing across 8 test files (zero regressions from Phase 1 + prior Phase 2 plans)

## Task Commits

Each task was committed atomically:

1. **Task 1: ScoreCalculator TDD (RED then GREEN)** - `93a2922` (feat)
2. **Task 2: Starting words corpus and RoundManager TDD (RED then GREEN)** - `ad022fc` (feat)

**Plan metadata:** (see final commit below)

_Note: TDD tasks committed as single feat commit after full RED-GREEN cycle completion_

## Files Created/Modified
- `src/lib/scoreCalculator.ts` - Word scoring: length base points + Q/Z/X/J rare letter bonuses
- `src/lib/__tests__/scoreCalculator.test.ts` - 9 tests covering scoring logic and edge cases
- `src/lib/startingWords.ts` - 330+ curated 3-letter words as STARTING_WORDS constant
- `src/lib/roundManager.ts` - validateStartingWord, eliminatePlayer, checkRoundEnd, createRoundState, startNextRound
- `src/lib/__tests__/roundManager.test.ts` - 30 tests covering all round lifecycle functions
- `src/types/game.ts` - Added PlayerState, RoundState, StartingWordResult, RoundEndResult types

## Decisions Made
- Q scored as raw game-state char — earns 10-point bonus directly, no QU expansion needed in scoring path (only dictionary lookup expands Q)
- startNextRound revives all players including eliminated ones (GAME-08 requirement: all players get fresh hands each round boundary)
- validateStartingWord check order: dictionary first → corpus second → hand last (fail-fast on most common rejection)
- STARTING_WORDS hardcoded as string array: simple, deterministic, no runtime filtering needed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Score calculation, round lifecycle, and all game type definitions are complete
- Phase 3 (game state management) can import: scoreWord, validateStartingWord, eliminatePlayer, checkRoundEnd, startNextRound, createRoundState, STARTING_WORDS
- All types (PlayerState, RoundState) exported from src/types/game.ts
- Full test suite green — safe foundation for game state integration

---
*Phase: 02-core-engine*
*Completed: 2026-03-18*

## Self-Check: PASSED

- FOUND: src/lib/scoreCalculator.ts
- FOUND: src/lib/roundManager.ts
- FOUND: src/lib/startingWords.ts
- FOUND: src/lib/__tests__/scoreCalculator.test.ts
- FOUND: src/lib/__tests__/roundManager.test.ts
- FOUND: .planning/phases/02-core-engine/02-03-SUMMARY.md
- FOUND commit: 93a2922 (ScoreCalculator)
- FOUND commit: ad022fc (RoundManager + types)
