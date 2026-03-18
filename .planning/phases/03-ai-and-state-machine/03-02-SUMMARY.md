---
phase: 03-ai-and-state-machine
plan: 02
subsystem: ai-engine
tags: [ai, vocabulary, tdd, react-hook, raf, difficulty]
dependency_graph:
  requires:
    - phase: 03-01
      provides: GameState, GameAction, useGameStore, TurnPhase, gameReducer
    - phase: 02-01
      provides: validateTurn, ValidationConfig — used by findAIMove
    - phase: 02-02
      provides: validateStartingWord — used by findAIStartingWord
  provides:
    - findAIMove: pure function returning valid word extension or null
    - findAIStartingWord: pure function selecting from STARTING_WORDS corpus
    - getVocabulary: difficulty-scoped vocabulary filter (easy/medium/hard)
    - useAI: React hook bridging aiEngine to FSM store via rAF pacing
    - EASY_WORDS: ~4,500 curated common English words
    - MEDIUM_WORDS: ~18K superset of EASY_WORDS
  affects:
    - phase-04-ui
tech-stack:
  added: []
  patterns:
    - pure-ai-functions-dictionary-injected
    - vocabulary-subset-by-difficulty
    - raf-paced-ai-hook
    - fisher-yates-shuffle-for-move-variety
key-files:
  created:
    - src/lib/aiEngine.ts
    - src/lib/__tests__/aiEngine.test.ts
    - src/data/easyWords.ts
    - src/data/mediumWords.ts
    - src/hooks/useAI.ts
  modified: []
key-decisions:
  - "getVocabulary returns lowercase words matching game dictionary format — source lists uppercase, filtered via .toLowerCase()"
  - "findAIMove uses random start index + wrap-around (not Fisher-Yates) — O(n) guaranteed, no array mutation"
  - "mediumWords.ts imports EASY_WORDS and deduplicates at module level — ensures medium is always a strict superset of easy"
  - "useAI re-reads store state inside rAF callback to avoid stale closure bug on rapid phase changes"
  - "useAI effect deps are phase + currentPlayerId — not gameState identity — avoids unnecessary re-subscriptions"
patterns-established:
  - "AI purity pattern: findAIMove and getVocabulary are pure functions — no side effects, testable without React"
  - "rAF hook pattern: dispatch scheduled inside requestAnimationFrame, cleanup via cancelAnimationFrame"
  - "Vocabulary filter pattern: source lists (EASY_WORDS/MEDIUM_WORDS) are static data, filtered at getVocabulary call time"
requirements-completed: [AI-02, AI-03, AI-04, AI-05, AI-06, AI-07]
duration: 18min
completed: "2026-03-18"
---

# Phase 3 Plan 02: AI Engine Summary

**Pure AI move-finding with 3-difficulty vocabulary scoping (easy ~4.5K, medium ~18K, hard full dict), rAF-paced React hook bridging engine to FSM store**

## Performance

- **Duration:** 18 min
- **Started:** 2026-03-18T22:48:34Z
- **Completed:** 2026-03-18T23:07:10Z
- **Tasks:** 2 (TDD: 3 commits for task 1)
- **Files modified:** 5 created

## Accomplishments

- AI engine with three pure functions: `getVocabulary`, `findAIMove`, `findAIStartingWord`
- Curated word lists: 4,500-word easy vocabulary, ~18K medium vocabulary (superset of easy)
- 16 unit tests covering all behaviors: difficulty levels, plural ban compliance, null on stuck, starting word selection
- `useAI` hook reacting to `AI_THINKING` and `SETUP` phases with rAF pacing and cleanup

## Task Commits

Each task committed atomically:

1. **Task 1 TDD RED - Failing tests** - `a8b1685` (test)
2. **Task 1 TDD GREEN - AI engine + word data** - `9056f76` (feat)
3. **Task 2 - useAI React hook** - `71db27e` (feat)

## Files Created/Modified

- `src/lib/aiEngine.ts` — `getVocabulary`, `findAIMove`, `findAIStartingWord` pure functions
- `src/lib/__tests__/aiEngine.test.ts` — 16 tests covering all AI behaviors
- `src/data/easyWords.ts` — ~4,500 common English words (3-8 letters, uppercase)
- `src/data/mediumWords.ts` — ~18K word superset of easyWords for medium difficulty
- `src/hooks/useAI.ts` — React hook: rAF-scheduled AI computation, cleanup on phase change

## Decisions Made

1. **Lowercase vocabulary matching**: Game dictionary stores words in lowercase. Source lists are uppercase. `getVocabulary` calls `.toLowerCase()` before `fullDictionary.has()` check. This avoids maintaining duplicate case-transformed lists.

2. **Random start index instead of full shuffle**: `findAIMove` picks a random start index and wraps around the vocabulary array, rather than shuffling a copy each call. Guarantees O(n) worst case with good variety and avoids allocation on every turn.

3. **mediumWords dedup at module level**: `mediumWords.ts` imports `EASY_WORDS` and filters `MEDIUM_EXTRA` against an `easySet` at module initialization. This ensures `MEDIUM_WORDS` is always a strict superset without runtime overhead in `getVocabulary`.

4. **useAI re-reads store inside rAF**: The hook closes over `gameState` but re-reads `useGameStore.getState().gameState` inside the rAF callback. This prevents a stale-closure bug where phase had changed between effect registration and rAF execution.

5. **Effect deps are phase + currentPlayerId**: Rather than depending on `gameState` identity (which would fire on every state change), the effect depends only on `phase` and `currentPlayerId` — the two fields that trigger AI action.

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `npm test -- --run src/lib/__tests__/aiEngine.test.ts`: 16/16 passed
- `npm test -- --run`: 124/124 passed (no regressions from existing 108 tests)
- `npx tsc --noEmit`: clean

## Next Phase Readiness

- `aiEngine.ts` exports are ready for use by Phase 4 UI components
- `useAI` hook is ready to mount at the Game screen level
- All three difficulty levels working and covered by tests
- No blockers

---
*Phase: 03-ai-and-state-machine*
*Completed: 2026-03-18*

## Self-Check: PASSED

All artifacts verified:
- FOUND: src/lib/aiEngine.ts
- FOUND: src/lib/__tests__/aiEngine.test.ts
- FOUND: src/data/easyWords.ts
- FOUND: src/data/mediumWords.ts
- FOUND: src/hooks/useAI.ts
- FOUND commit: a8b1685 (test(03-02): add failing tests)
- FOUND commit: 9056f76 (feat(03-02): implement AI engine)
- FOUND commit: 71db27e (feat(03-02): create useAI hook)
