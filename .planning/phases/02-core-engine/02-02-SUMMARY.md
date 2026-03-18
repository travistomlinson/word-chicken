---
phase: 02-core-engine
plan: "02"
subsystem: game-logic
tags: [typescript, vitest, tile-bag, fisher-yates, bananagrams, scrabble]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Vitest 4.x test infrastructure and TypeScript scaffold
provides:
  - createBag factory function: shuffled string[] tile bags for Bananagrams (144) and Scrabble (98)
  - dealHand pure function: removes and returns N tiles from front of bag
  - drawToNine pure function: refills hand to 9 tiles from bag
  - BANANAGRAMS_COUNTS and SCRABBLE_COUNTS exported constants
  - TileDistribution type alias
affects:
  - 02-03-round-manager (uses dealHand, drawToNine, createBag)
  - 04-game-ui (uses createBag to initialize round)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Fisher-Yates shuffle using Math.floor(Math.random() * (i + 1)) — loop from arr.length-1 down to 1
    - Tile bag as string[] with splice(0, count) for dealing
    - Q stored as single char 'Q' throughout; never stored as 'QU'
    - Statistical tests use adequate trial counts (100) with realistic bounds rather than asserting zero failures

key-files:
  created:
    - src/lib/tileBag.ts
    - src/lib/__tests__/tileBag.test.ts
  modified: []

key-decisions:
  - "Statistical vowel test uses >=85 of 100 trials producing 2+ vowels; Bananagrams vowel fraction is 42% (60/144), not 58% as the research doc estimated — zero-failure assertion was unrealistic"

patterns-established:
  - "Tile bag as shuffled string[] with splice(0, n) from front for dealing — O(n) deals, clear semantics"
  - "drawToNine returns new array ([...hand, ...newTiles]), does not mutate hand"
  - "Statistical tests assert a high-confidence threshold (>=85%) rather than absolute perfection over random trials"

requirements-completed: [TILE-01, TILE-02, TILE-03, TILE-04, TILE-05]

# Metrics
duration: 2min
completed: 2026-03-18
---

# Phase 02 Plan 02: TileBag Module Summary

**Pure-function tile bag with Fisher-Yates shuffle, Bananagrams (144-tile) and Scrabble (98-tile) distributions, deal-hand and draw-to-nine operations — 18 tests all passing**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-18T21:34:57Z
- **Completed:** 2026-03-18T21:36:54Z
- **Tasks:** 2 (TDD: RED then GREEN)
- **Files modified:** 2

## Accomplishments
- TileBag module with canonical Fisher-Yates shuffle, correct Bananagrams (144) and Scrabble (98) tile distributions
- dealHand mutates bag via splice(0, count) returning dealt tiles; drawToNine returns new array topped up to 9
- 18 unit and statistical tests covering all TILE-01 through TILE-05 requirements with zero regressions
- Q tile stored as single char 'Q' throughout the bag — confirmed by character-length test on every tile

## Task Commits

Each task was committed atomically:

1. **Task 1: Write failing TileBag tests (RED)** - `4a05191` (test)
2. **Task 2: Implement TileBag to pass all tests (GREEN)** - `8f8b8db` (feat)

_Note: TDD tasks have two commits (test → feat). Refactor step was not needed._

## Files Created/Modified
- `src/lib/tileBag.ts` - Exported constants, TileDistribution type, createBag, dealHand, drawToNine, internal fisherYatesShuffle
- `src/lib/__tests__/tileBag.test.ts` - 18 tests across createBag, dealHand, drawToNine, statistical properties describe blocks

## Decisions Made
- Statistical vowel test threshold set to `>= 85` successes out of 100 trials rather than zero failures: Bananagrams vowel fraction is 42% (60/144 tiles), giving P(>=2 vowels in 9 draws) ≈ 96%. The research document incorrectly estimated 58%. An absolute-zero-failure assertion on 100 trials would flake ~99% of the time under the true distribution.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected statistical test expectation for vowel distribution**
- **Found during:** Task 2 (GREEN phase — test failed despite correct implementation)
- **Issue:** Plan specified "100 trials of dealHand all produce >= 2 vowels" with `expect(failCount).toBe(0)`. Bananagrams actual vowel fraction is 60/144 = 41.7%, not ~58% as research estimated. P(<2 vowels in 9 tiles) ≈ 3.8%, so ~4 failures in 100 trials is expected — making the assertion systematically wrong.
- **Fix:** Changed assertion to `expect(atLeastTwoVowelCount).toBeGreaterThanOrEqual(85)` — tests that >=85% of trials produce 2+ vowels, which is statistically sound and non-flaky.
- **Files modified:** src/lib/__tests__/tileBag.test.ts
- **Verification:** All 18 tests pass on 5 consecutive runs; no statistical flakiness observed
- **Committed in:** 8f8b8db (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug: incorrect test expectation)
**Impact on plan:** Required to make test non-flaky. The property being tested (vowels appear frequently in dealt hands) is still verified correctly — just with a realistic threshold.

## Issues Encountered
- None beyond the statistical test fix above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- TileBag module complete and fully tested. Ready for 02-03 (ScoreCalculator + RoundManager).
- createBag, dealHand, drawToNine can be imported from `src/lib/tileBag.ts` in the round manager.

## Self-Check: PASSED

- FOUND: src/lib/tileBag.ts
- FOUND: src/lib/__tests__/tileBag.test.ts
- FOUND: .planning/phases/02-core-engine/02-02-SUMMARY.md
- FOUND: commit 4a05191 (test: RED phase)
- FOUND: commit 8f8b8db (feat: GREEN phase)
- All 46 tests pass (18 tileBag + 28 pre-existing), zero regressions

---
*Phase: 02-core-engine*
*Completed: 2026-03-18*
