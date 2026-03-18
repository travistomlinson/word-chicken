---
phase: 03-ai-and-state-machine
plan: 01
subsystem: game-state-machine
tags: [reducer, fsm, zustand, types, tdd]
dependency_graph:
  requires: [wordValidator, roundManager, scoreCalculator, tileBag]
  provides: [gameReducer, useGameStore, GameState, GameAction, TurnPhase]
  affects: [phase-04-ui, 03-02-ai-hook]
tech_stack:
  added: []
  patterns: [pure-reducer-fsm, zustand-dispatch-wrapper, dictionary-in-config]
key_files:
  created:
    - src/lib/gameReducer.ts
    - src/lib/__tests__/gameReducer.test.ts
    - src/store/gameSlice.ts
  modified:
    - src/types/game.ts
decisions:
  - Dictionary passed via GameConfig.dictionary (Set<string>) — keeps reducer pure and fully testable without store coupling
  - RESET_GAME returns null from reducer; store interprets null as clear gameState
  - Phase guard pattern: all illegal transitions return unchanged state reference (no throw); console.warn in DEV mode
  - advanceTurn cycles through activePlayers array — works for 2-player and extensible to N
metrics:
  duration: 3min
  completed_date: "2026-03-18"
  tasks_completed: 2
  files_created: 3
  files_modified: 1
---

# Phase 3 Plan 01: GameReducer FSM Summary

Pure reducer FSM wiring all Phase 2 engine modules (validator, scorer, tileBag, roundManager) into a single state machine with Zustand store wrapper and 27 tests.

## What Was Built

### Task 1: GameState types + gameReducer + tests

Extended `src/types/game.ts` with four new exports:
- `TurnPhase` — union of SETUP | HUMAN_TURN | AI_THINKING | ROUND_END | GAME_OVER
- `GameConfig` — difficulty, banPluralS, tileDistribution, dictionary (Set<string>)
- `GameState` — phase, round (RoundState), config, roundScores, totalScores
- `GameAction` — discriminated union of 8 action types

Created `src/lib/gameReducer.ts`:
- `createInitialGameState(config)` — creates two players 'human' and 'ai' via createRoundState, phase=SETUP
- `gameReducer(state, action)` — pure reducer returning GameState | null
- Internal helpers: `advanceTurn`, `nextPlayerIsAI`, `applyValidTurn`, `letterFrequency`
- Phase guards on all actions; illegal transitions return unchanged state reference
- SUBMIT_STARTING_WORD: removes 3 letters, draws back to 9, transitions SETUP → AI_THINKING | HUMAN_TURN
- SUBMIT_WORD: validates via validateTurn, scores via scoreWord, updates hand/bag/history, advances turn
- ELIMINATE_PLAYER: calls eliminatePlayer + checkRoundEnd, transitions to ROUND_END if one player remains
- END_ROUND: computes roundScores from turnHistory, accumulates into totalScores
- NEXT_ROUND: calls startNextRound, resets phase to SETUP, clears roundScores

Created `src/lib/__tests__/gameReducer.test.ts`:
- 27 tests covering all behaviors
- Controlled state construction (known hands, bags) for deterministic tests
- Injected MOCK_DICT (small Set) for isolation
- Integration test: full lifecycle SETUP → starting word → human turn → AI turn → elimination → ROUND_END → NEXT_ROUND

### Task 2: Zustand gameSlice

Created `src/store/gameSlice.ts`:
- `useGameStore` with `gameState: GameState | null` and `dispatch: (action: GameAction) => void`
- START_GAME calls `createInitialGameState` directly (bypasses reducer for initialization)
- Guard: no-op if gameState is null and action is not START_GAME
- RESET_GAME: reducer returns null → store sets gameState to null
- All business logic delegated to gameReducer; store is a thin wrapper

## Verification

- `npm test -- --run src/lib/__tests__/gameReducer.test.ts`: 27/27 passed
- `npm test -- --run`: 108/108 passed (no regressions)
- `npx tsc --noEmit`: clean

## Deviations from Plan

None — plan executed exactly as written.

## Decisions Made

1. **Dictionary in GameConfig**: The plan suggested passing dictionary through GameState or action payload; implemented as `GameConfig.dictionary: Set<string>`. This matches the plan's preferred approach — set once at START_GAME from dictionarySlice, keeps reducer pure and testable.

2. **RESET_GAME returns null**: Reducer returns `null` instead of a reset GameState object. Store detects null and sets `gameState: null`. This is cleaner than returning a dummy state since the store wants to know "no game active."

3. **Phase guard consistency**: All 8 action types check phase before acting. Illegal transitions return the exact same `state` reference (identity equality), enabling `===` checks in tests and allowing future memoization.

## Self-Check

Checking key artifacts exist...

## Self-Check: PASSED

All artifacts verified:
- FOUND: src/lib/gameReducer.ts
- FOUND: src/lib/__tests__/gameReducer.test.ts
- FOUND: src/store/gameSlice.ts
- FOUND: src/types/game.ts
- FOUND commit: f602f63 (feat(03-01): implement GameReducer FSM)
- FOUND commit: a54ee56 (feat(03-01): create Zustand gameSlice)
