---
phase: 02-core-engine
plan: "01"
subsystem: validation
tags: [typescript, vitest, pure-functions, tdd, word-validation]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: parseWordList returning Set<string> of lowercase words from TWL06
provides:
  - Pure word and turn validation functions (validateWord, validateTurn, isInDictionary)
  - ValidationConfig, WordValidationResult, TurnValidationResult types in src/types/game.ts
  - Q-tile expansion logic (Q→QU only at lookup time)
  - Multiset superset turn validation (rearrangement allowed, exactly one new letter)
  - Plural-S ban configurable at runtime
affects: [03-game-state, 04-ui, any module consuming word validation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Dependency injection for dictionary (Set<string> passed as parameter, not imported)
    - Pure functions with no side effects — all validation stateless
    - TDD red-green cycle with explicit RED commit before implementation

key-files:
  created:
    - src/types/game.ts
    - src/lib/wordValidator.ts
    - src/lib/__tests__/wordValidator.test.ts
  modified: []

key-decisions:
  - "Q tile stored as single char in game state; expanded to QU only inside isInDictionary — never persisted expanded"
  - "Dictionary injected as Set<string> parameter (not imported/global) enabling easy testing with mock dictionary"
  - "validateTurn checks dictionary first, then superset, then diff length, then hand availability, then plural ban — order matters for correct error reasons"
  - "Plural ban checks structural pattern (newWord === prevWord + S uppercase) not just any S addition — prevents false positives like CAST from CAT+S"

patterns-established:
  - "Pattern: Dictionary dependency injection — all validator functions accept dictionary as parameter"
  - "Pattern: Internal helpers unexported — expandQTiles, letterFrequency, isMultisetSuperset, multisetDiff are private"
  - "Pattern: Discriminated union return types — callers pattern-match on { valid: true } | { valid: false; reason: ... }"

requirements-completed: [WVAL-02, WVAL-03, WVAL-04, GAME-02, GAME-03, GAME-04, GAME-09, GAME-10, GAME-11]

# Metrics
duration: 8min
completed: 2026-03-18
---

# Phase 02 Plan 01: WordValidator Summary

**Pure TypeScript word-and-turn validation with Q-tile expansion, multiset superset turn logic, and configurable plural-S ban — 11 tests, TDD red-green**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-18T21:34:57Z
- **Completed:** 2026-03-18T21:42:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- `validateWord` validates dictionary membership and hand tile availability
- `validateTurn` enforces multiset superset rule (rearrangement OK), exactly-one-letter constraint, hand check, and configurable plural-S ban
- `isInDictionary` expands Q→QU before lowercase lookup — Q tile is never stored expanded in game state
- All 11 new tests pass plus all 35 pre-existing tests (46 total)

## Task Commits

Each task was committed atomically:

1. **Task 1: Define game types and write failing WordValidator tests** - `aef60d7` (test)
2. **Task 2: Implement WordValidator to pass all tests** - `a102253` (feat)

_Note: TDD tasks committed at RED (test) then GREEN (feat) phases._

## Files Created/Modified
- `src/types/game.ts` — ValidationConfig, WordValidationResult, TurnValidationResult discriminated unions
- `src/lib/wordValidator.ts` — validateWord, validateTurn, isInDictionary exports; internal helpers unexported
- `src/lib/__tests__/wordValidator.test.ts` — 11 test cases across validateWord, isInDictionary Q-expansion, validateTurn

## Decisions Made
- Q tile expansion is purely internal to `isInDictionary` — game state always stores bare `Q`, expanded form never surfaces
- Dictionary passed as parameter (dependency injection) per research Pattern 7, enabling mock dict in tests
- Plural ban uses structural check `newWord.toUpperCase() === prevWord.toUpperCase() + 'S'` to avoid flagging non-plural S additions
- No maximum word length constraint implemented (GAME-09 confirmed: no limit)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing flaky statistical test in `tileBag.test.ts` (100-trial vowel distribution check) was failing intermittently before this plan. Confirmed pre-existing by stashing changes and verifying failure reproduced. Out of scope — logged but not fixed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- WordValidator module is complete and fully tested — ready for game state and turn submission logic in next plans
- Dictionary injection pattern established — game state will pass `useDictionaryStore().words` Set to validators
- No blockers

---
*Phase: 02-core-engine*
*Completed: 2026-03-18*
