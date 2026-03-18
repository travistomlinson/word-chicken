# Phase 3: AI and State Machine - Research

**Researched:** 2026-03-18
**Domain:** FSM reducer (useReducer + discriminated union actions), AI vocabulary subsetting, off-main-thread AI pacing with requestAnimationFrame
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AI-01 | Single-player mode against one AI opponent (1v1) | GameState holds exactly two players: one human (`id: 'human'`), one AI (`id: 'ai'`). The FSM drives alternating turns. |
| AI-02 | AI has three difficulty levels: Easy, Medium, Hard | Difficulty enum maps to vocabulary scope. AIEngine receives the pre-filtered word set; all three strategies share the same search algorithm. |
| AI-03 | Easy AI selects from a curated common-word vocabulary (~5K words) | Easy vocab is a static curated list (committed as a data file). `filterByDifficulty('easy', dictionary)` returns this Set. |
| AI-04 | Medium AI selects from a moderate vocabulary (~20K words) | Medium vocab = top-20K by word frequency from TWL. Sourced from a bundled frequency list (see Open Questions). |
| AI-05 | Hard AI uses the full dictionary | Hard vocab = `useDictionaryStore.getState().words` directly — no filtering. |
| AI-06 | AI respects all configured game rules (plurals toggle, etc.) | AIEngine calls `validateTurn(candidate, currentWord, aiHand, dictionary, config)` for every candidate — rules are already encoded in the validator. |
| AI-07 | AI displays a "thinking" state so player knows the game is processing | `TurnPhase.AI_THINKING` is a named FSM state; the UI reads this phase to render the thinking indicator. |
| SCOR-03 | Running score is displayed during the game | `PlayerState.score` is updated in the reducer after every `SUBMIT_WORD` action via `scoreWord()`. Score is readable from `GameState` at any time. |
| SCOR-04 | End-of-round score summary shows points earned | `RoundState.turnHistory` already accumulates `{ playerId, word, score }` per turn. End-of-round state derives each player's round points from `turnHistory`. |
</phase_requirements>

---

## Summary

Phase 3 has two independent deliverables: a **GameReducer FSM** and an **AIEngine module**. They share no circular dependency — the FSM dispatches an `AI_TURN_START` action, the AI hook listens, computes a move, and dispatches `SUBMIT_WORD` back. Neither module imports from the other.

The **GameReducer** wraps the Phase 2 pure functions (`validateTurn`, `eliminatePlayer`, `checkRoundEnd`, `scoreWord`, `startNextRound`) in a `useReducer`-style reducer. The reducer is the single place where state transitions are enforced. Every action type is only valid from specific `TurnPhase` states; invalid transitions are ignored (logged in dev, silently no-op in production). Game state lives in a Zustand store that holds both the reducer state and the `dispatch` function — this keeps the state accessible across the component tree without prop drilling.

The **AIEngine** is a pure function: `findAIMove(currentWord, aiHand, vocabulary, config, rng?) => string | null`. It searches the vocabulary for a valid extension of the current word, applies all game rules via `validateTurn`, and returns the best candidate (or `null` if no move exists). "Off the main thread" for v1 means wrapping the AI call inside `requestAnimationFrame` — this ensures React has painted the "AI thinking" state before the computation begins, preventing a visual freeze. A Web Worker is not required for Phase 3 (the dictionary is at most ~180K words; linear scan completes in < 100ms in practice).

Scoring (SCOR-03, SCOR-04) is already mechanically implemented via `scoreWord` from Phase 2. Phase 3 wires it into the reducer: after every accepted `SUBMIT_WORD`, the reducer calls `scoreWord(newWord)`, adds it to `PlayerState.score`, and appends the entry to `RoundState.turnHistory`. No new scoring logic is needed.

**Primary recommendation:** Implement `GameReducer` as a pure reducer function in `src/lib/gameReducer.ts` (fully unit-testable without React), expose it via a `useGameStore` Zustand store in `src/store/gameSlice.ts`, and implement `AIEngine` as a pure function in `src/lib/aiEngine.ts` consumed by a `useAI` hook in `src/hooks/useAI.ts`.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript 5.x | ~5.6.2 (installed) | Discriminated union action types, FSM state modeling | Already installed; discriminated unions are the standard approach for typed reducers |
| Zustand | ^5.0.0 (installed) | Game state store holding reducer state + dispatch | Already installed and used for `appSlice` and `dictionarySlice`; consistent pattern |
| Vitest | ^4.1.0 (installed) | Unit tests for reducer and AI engine | Already configured; zero-setup for new test files |

No new npm dependencies are required for Phase 3. The FSM, AI engine, and rAF pacing all use language builtins and the existing Phase 2 modules.

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `requestAnimationFrame` | Browser built-in | Delay AI computation until after React's paint | Wraps `findAIMove` call in `useAI` hook to prevent UI freeze |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Plain `useReducer`-style reducer | XState / robot state machine library | XState adds ~20KB and an API surface for a 6-state machine. The game FSM has ~6 phases and ~8 action types — well within the comfort zone for a hand-written reducer with no library dependency. |
| `requestAnimationFrame` pacing | Web Worker | Workers require a separate bundle entry, message passing serialization, and dictionary copying to the worker context. rAF is sufficient for < 200ms computations and zero infrastructure overhead. |
| Zustand store with reducer | Redux Toolkit `createSlice` | Redux adds boilerplate (store setup, Provider) with no benefit for a single-page game already using Zustand elsewhere. |
| Linear vocabulary scan for AI | Trie prefix pruning | A trie built from the vocabulary would allow pruning branches that can't satisfy the superset constraint. However, the 1v1 game only needs one valid move per turn, not all moves. Linear scan through ~5K–20K words filtered to candidates that satisfy `validateTurn` runs in < 50ms — no trie needed for v1. |

**Installation:**

```bash
# No new packages needed — all Phase 3 logic uses existing stack
npm test -- --run  # verify existing tests still pass after adding new files
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── lib/
│   ├── __tests__/
│   │   ├── gameReducer.test.ts   # FSM unit tests (no React, pure function)
│   │   └── aiEngine.test.ts      # AI move selection unit tests
│   ├── gameReducer.ts            # Pure reducer: (GameState, Action) => GameState
│   └── aiEngine.ts               # Pure function: findAIMove(...)
├── store/
│   └── gameSlice.ts              # Zustand store wrapping gameReducer
├── hooks/
│   └── useAI.ts                  # rAF-paced hook that calls findAIMove and dispatches
├── data/
│   └── easyWords.ts              # ~5K common words (static import, committed data)
└── types/
    └── game.ts                   # Extended with GameState, TurnPhase, Action union
```

### Pattern 1: TurnPhase Enum (FSM States)

**What:** A `TurnPhase` string literal union enumerates every valid state the game can be in.
**When to use:** Every reducer branch checks `state.phase` before applying an action. Invalid transitions are no-ops.

```typescript
// src/types/game.ts (additions)
export type TurnPhase =
  | 'SETUP'            // Before starting word is submitted
  | 'HUMAN_TURN'       // Human is composing a word
  | 'VALIDATING'       // Brief intermediate (optional — can merge with turn phases)
  | 'AI_THINKING'      // AI is computing its move (rAF pending)
  | 'ROUND_END'        // Round is over; winner declared
  | 'GAME_OVER'        // All rounds complete; final scores shown

export interface GameConfig {
  difficulty: 'easy' | 'medium' | 'hard'
  banPluralS: boolean
  tileDistribution: TileDistribution  // from tileBag.ts
}

export interface GameState {
  phase: TurnPhase
  round: RoundState          // from Phase 2 types
  config: GameConfig
  roundScores: Record<string, number>  // points earned this round per player
  totalScores: Record<string, number>  // cumulative across all rounds
}
```

### Pattern 2: Discriminated Union Action Types

**What:** Every action dispatched to the reducer is a typed object with a `type` discriminant. The reducer switches on `action.type` and narrows the payload automatically.
**When to use:** All state transitions go through `dispatch(action)`. Never mutate state directly.

```typescript
// src/types/game.ts (additions)
export type GameAction =
  | { type: 'START_GAME'; config: GameConfig }
  | { type: 'SUBMIT_STARTING_WORD'; word: string }
  | { type: 'SUBMIT_WORD'; word: string; playerId: string }
  | { type: 'ELIMINATE_PLAYER'; playerId: string }
  | { type: 'END_ROUND'; winnerId: string }
  | { type: 'NEXT_ROUND' }
  | { type: 'AI_TURN_START' }
  | { type: 'RESET_GAME' }
```

### Pattern 3: Pure Reducer Function

**What:** `gameReducer(state: GameState, action: GameAction): GameState` is a pure function with no side effects. It calls Phase 2 modules directly (no imports from React or Zustand).
**When to use:** This function is the single source of truth for all state transitions. It is unit-testable without mounting any component.

```typescript
// src/lib/gameReducer.ts (skeleton)
import type { GameState, GameAction, TurnPhase } from '../types/game'
import { validateTurn, validateStartingWord } from './wordValidator'
import { scoreWord } from './scoreCalculator'
import { eliminatePlayer, checkRoundEnd, startNextRound } from './roundManager'
import { drawToNine } from './tileBag'

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME': {
      // Only valid from phase SETUP — handled by gameSlice initializing fresh state
      return initGameState(action.config)
    }

    case 'SUBMIT_STARTING_WORD': {
      if (state.phase !== 'SETUP') return state  // illegal transition guard

      const dictionary = getDictionary()  // accessed via Zustand getState()
      const currentPlayer = state.round.players[state.round.currentPlayerId]
      const result = validateStartingWord(action.word, currentPlayer.hand, dictionary)

      if (!result.valid) return state  // validation error — caller shows UI feedback

      const updatedRound = applyStartingWord(state.round, action.word, state.config)
      const nextPhase: TurnPhase = nextPlayerIsAI(updatedRound) ? 'AI_THINKING' : 'HUMAN_TURN'

      return { ...state, phase: nextPhase, round: updatedRound }
    }

    case 'SUBMIT_WORD': {
      if (state.phase !== 'HUMAN_TURN' && state.phase !== 'AI_THINKING') return state

      const dictionary = getDictionary()
      const player = state.round.players[action.playerId]
      const result = validateTurn(
        action.word, state.round.currentWord,
        player.hand, dictionary, state.config
      )

      if (!result.valid) return state

      const points = scoreWord(action.word)
      const updatedRound = applyValidTurn(state.round, action.playerId, action.word, points, state.config)
      const roundEnd = checkRoundEnd(updatedRound)

      if (roundEnd.over) {
        return { ...state, phase: 'ROUND_END', round: updatedRound }
      }

      const nextPhase: TurnPhase = nextPlayerIsAI(updatedRound) ? 'AI_THINKING' : 'HUMAN_TURN'
      return { ...state, phase: nextPhase, round: updatedRound }
    }

    case 'ELIMINATE_PLAYER': {
      // Human passes (cannot form word) or AI cannot find a move
      const updatedRound = eliminatePlayer(state.round, action.playerId)
      const roundEnd = checkRoundEnd(updatedRound)

      if (roundEnd.over) {
        return { ...state, phase: 'ROUND_END', round: updatedRound }
      }

      const nextPhase: TurnPhase = nextPlayerIsAI(updatedRound) ? 'AI_THINKING' : 'HUMAN_TURN'
      return { ...state, phase: nextPhase, round: updatedRound }
    }

    case 'END_ROUND': {
      if (state.phase !== 'ROUND_END') return state
      return accumulateRoundScores(state, action.winnerId)
    }

    case 'NEXT_ROUND': {
      const newRound = startNextRound(state.round, state.round.activePlayers[0], state.config.tileDistribution)
      const nextPhase: TurnPhase = 'SETUP'  // winner submits starting word
      return { ...state, phase: nextPhase, round: newRound }
    }

    default:
      return state
  }
}
```

### Pattern 4: Zustand Store Wrapping the Reducer

**What:** `useGameStore` holds `GameState` and exposes `dispatch`. The store is initialized with a null/unstarted state; `dispatch({ type: 'START_GAME', config })` kicks it off.
**When to use:** React components read state via selectors (`useGameStore(s => s.gameState.phase)`) and dispatch actions via `useGameStore(s => s.dispatch)`.

```typescript
// src/store/gameSlice.ts
import { create } from 'zustand'
import { gameReducer } from '../lib/gameReducer'
import type { GameState, GameAction } from '../types/game'

interface GameStore {
  gameState: GameState | null
  dispatch: (action: GameAction) => void
}

export const useGameStore = create<GameStore>()((set, get) => ({
  gameState: null,
  dispatch: (action: GameAction) => {
    const current = get().gameState
    if (!current) {
      // Allow START_GAME to initialize from null
      if (action.type === 'START_GAME') {
        set({ gameState: gameReducer(createInitialState(action.config), action) })
      }
      return
    }
    set({ gameState: gameReducer(current, action) })
  },
}))
```

### Pattern 5: rAF-Paced AI Hook

**What:** `useAI` is a React hook that watches `gameState.phase`. When phase is `AI_THINKING`, it schedules `findAIMove` inside `requestAnimationFrame`, then dispatches either `SUBMIT_WORD` or `ELIMINATE_PLAYER` based on the result.
**When to use:** Mount this hook once at the game screen level. It is the only consumer of `findAIMove`.

```typescript
// src/hooks/useAI.ts
import { useEffect } from 'react'
import { useGameStore } from '../store/gameSlice'
import { useDictionaryStore } from '../store/dictionarySlice'
import { findAIMove } from '../lib/aiEngine'

export function useAI() {
  const phase = useGameStore(s => s.gameState?.phase)
  const gameState = useGameStore(s => s.gameState)
  const dispatch = useGameStore(s => s.dispatch)
  const dictionary = useDictionaryStore(s => s.words)

  useEffect(() => {
    if (phase !== 'AI_THINKING' || !gameState) return

    let rafId: number
    rafId = requestAnimationFrame(() => {
      const aiPlayer = gameState.round.players['ai']
      const move = findAIMove(
        gameState.round.currentWord,
        aiPlayer.hand,
        getVocabularyForDifficulty(gameState.config.difficulty, dictionary),
        gameState.config
      )

      if (move) {
        dispatch({ type: 'SUBMIT_WORD', word: move, playerId: 'ai' })
      } else {
        dispatch({ type: 'ELIMINATE_PLAYER', playerId: 'ai' })
      }
    })

    return () => cancelAnimationFrame(rafId)
  }, [phase, gameState, dispatch, dictionary])
}
```

### Pattern 6: AIEngine Pure Function

**What:** `findAIMove(currentWord, hand, vocabulary, config) => string | null` searches the vocabulary for any word that is a valid extension of `currentWord` using one tile from `hand`. Returns the first valid candidate found, or `null`.
**When to use:** Called exclusively from `useAI`. Deterministic when given a stable vocabulary order.

```typescript
// src/lib/aiEngine.ts
import { validateTurn } from './wordValidator'
import type { ValidationConfig } from '../types/game'

/**
 * Searches vocabulary for a valid word extension.
 * Easy: vocabulary is the ~5K curated list
 * Medium: vocabulary is the ~20K frequency-filtered list
 * Hard: vocabulary is the full dictionary Set
 *
 * Returns the first valid candidate, or null if no move exists.
 * Does NOT pick the "best" move — randomization is handled by shuffling
 * the vocabulary iteration order (pass a pre-shuffled array for Easy/Medium).
 */
export function findAIMove(
  currentWord: string,
  hand: string[],
  vocabulary: string[],  // ordered array, not Set — order controls AI "personality"
  config: ValidationConfig
): string | null {
  // For each candidate word in vocabulary...
  for (const candidate of vocabulary) {
    const upper = candidate.toUpperCase()
    // Quick length guard: candidate must be currentWord.length + 1
    if (upper.length !== currentWord.length + 1) continue
    // Full validation via shared game rule engine
    const result = validateTurn(upper, currentWord, hand, /* dictionary param */ new Set(), config)
    // NOTE: vocabulary IS the dictionary for AI purposes — use isInDictionary separately
    if (result.valid) return upper
  }
  return null
}
```

**IMPORTANT DESIGN DECISION:** `findAIMove` receives `vocabulary` as a `string[]` (ordered array), not a `Set`. This allows randomization by shuffling the array before passing it to `findAIMove`. Easy AI gets a pre-shuffled ~5K list each turn. Hard AI gets the full dictionary words array iterated in consistent order (or shuffled for variety — planner's discretion).

**SECOND IMPORTANT DECISION:** The `vocabulary` passed to `findAIMove` must be an array of valid dictionary words that can also serve as the lookup source. The simplest approach: pass the vocabulary as the only validation source by using `isInDictionary(candidate, new Set(vocabulary))` — but this creates a new Set each call. Better: pre-build a `Set` from the vocabulary once per game, and pass both the ordered array (for iteration) and the Set (for validation).

**Revised signature:**
```typescript
export function findAIMove(
  currentWord: string,
  hand: string[],
  vocabularyArray: string[],     // for iteration (shuffled for randomness)
  vocabularySet: Set<string>,    // for O(1) lookup inside validateTurn
  config: ValidationConfig
): string | null
```

### Anti-Patterns to Avoid

- **Calling `findAIMove` synchronously in render:** This will block the main thread and freeze the UI. Always call from `useEffect` + `requestAnimationFrame`.
- **Putting game logic inside the Zustand store action:** The store's `dispatch` method calls `gameReducer` — it must not itself contain game rules. All rules live in `gameReducer.ts`.
- **Using `useReducer` directly instead of Zustand:** `useReducer` state is local to a component subtree. Phase 4 components (hand, board, score, etc.) all need game state — Zustand ensures global access without prop drilling.
- **Sharing mutable state between reducer and AI:** The reducer is pure; the AI hook reads from the store via selectors. Neither modifies the other directly.
- **Forgetting to `cancelAnimationFrame` in cleanup:** If the component unmounts while AI is "thinking," the rAF callback must be cancelled to prevent stale dispatches.
- **Hard-coding player IDs in the reducer:** The reducer should not hardcode `'human'` or `'ai'` — it should derive whose turn it is from `round.currentPlayerId` and the turn-advance logic.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Word validation in AI | Custom AI word check | `validateTurn()` from Phase 2 | All game rules (plural ban, superset, hand availability) already implemented and tested; AI must use the same code path as human turns |
| Scoring in reducer | Inline scoring formula | `scoreWord()` from Phase 2 | Consistent scoring between human and AI turns; single source of truth |
| State transitions | Ad-hoc if/else chains | `TurnPhase` enum + reducer switch | Named phases make illegal transitions explicit; every branch is individually testable |
| AI vocabulary filtering | Runtime dictionary scan at game start | Pre-committed curated word lists | Building the easy/medium vocab at runtime requires a frequency source that may not be bundled; static lists are instant and deterministic |
| AI "thinking" delay | `setTimeout(N)` with arbitrary milliseconds | `requestAnimationFrame` | rAF fires after paint (typically 16ms), giving React time to show the thinking state; `setTimeout(0)` may fire before paint in some browsers |

---

## Common Pitfalls

### Pitfall 1: Illegal Phase Transitions Swallowed Silently

**What goes wrong:** A `SUBMIT_WORD` action arrives while `phase === 'ROUND_END'`. The reducer silently returns the unchanged state. The UI appears to freeze with no error.
**Why it happens:** The guard `if (state.phase !== 'HUMAN_TURN') return state` is correct behavior, but the caller doesn't know why the dispatch was ignored.
**How to avoid:** In development mode, log a warning when a guard trips: `if (import.meta.env.DEV) console.warn('Illegal transition: ...')`. In tests, assert the final phase explicitly so unexpected no-ops are caught.
**Warning signs:** Dispatching an action appears to succeed (no error thrown) but state does not change.

### Pitfall 2: AI Dispatches on Stale State

**What goes wrong:** AI is computing in `requestAnimationFrame`. Before the rAF fires, the human performs an action that changes the phase. The rAF callback fires and dispatches `SUBMIT_WORD` for a turn that is no longer current.
**Why it happens:** `requestAnimationFrame` captures variables via closure at schedule time.
**How to avoid:** In the `useEffect` cleanup, `cancelAnimationFrame(rafId)`. This is handled by the cleanup function returned from `useEffect` — it fires whenever `phase` changes. Since the effect re-runs when `phase` changes, and cleanup cancels the previous rAF, stale dispatches are prevented.
**Warning signs:** Two `SUBMIT_WORD` actions arrive in rapid succession; score updates are applied twice.

### Pitfall 3: Dictionary Not Available When AI Computes

**What goes wrong:** `findAIMove` is called before `useDictionaryStore` status is `'ready'`. The vocabulary set is empty; AI always returns `null` and eliminates itself immediately.
**Why it happens:** Game starts (config submitted) before dictionary fetch completes.
**How to avoid:** The `START_GAME` action in the reducer (or the component dispatching it) must gate on `dictionaryStatus === 'ready'`. The `useAI` hook should also guard: `if (!dictionary || dictionary.size === 0) return`.
**Warning signs:** AI is eliminated on the first turn of every game; console shows empty Set.

### Pitfall 4: AI Vocabulary Includes Words Rejected by Config

**What goes wrong:** AI in Easy mode picks a word from the 5K vocabulary that ends in 'S'. With `banPluralS: true`, `validateTurn` rejects it. AI tries next candidate, finds another S-word, fails again — eventually returns `null` and eliminates itself unnecessarily.
**Why it happens:** The vocabulary was curated without filtering for the current config's rules.
**How to avoid:** This is intentional behavior — AI should not have special knowledge of config rules beyond what `validateTurn` enforces. If the AI cannot find a valid move given current rules, it is correctly eliminated. However, test that with `banPluralS: false`, the AI can find S-extending words; with `banPluralS: true`, those candidates are correctly rejected. The AI does not need to pre-filter its vocabulary by config — `validateTurn` handles it.
**Warning signs:** AI appears less capable than expected at Easy difficulty; vocabulary coverage is lower than anticipated.

### Pitfall 5: Round Score vs Running Score Confusion

**What goes wrong:** SCOR-03 wants "running score displayed during the game" (total across all rounds). SCOR-04 wants "end-of-round score summary shows points earned" (just this round). If `PlayerState.score` accumulates across rounds, deriving the per-round portion requires storing the pre-round score. If it resets each round, the running total is lost.
**Why it happens:** `RoundState` from Phase 2 has `PlayerState.score` that resets to 0 at round start (via `createRoundState`).
**How to avoid:** `GameState` must carry two scoring structures: `roundScores: Record<string, number>` (populated at `ROUND_END` from `turnHistory`) and `totalScores: Record<string, number>` (accumulated across `END_ROUND` actions). `PlayerState.score` in `RoundState` tracks the current round only — consistent with how Phase 2 built it. The reducer's `END_ROUND` handler: `totalScores[playerId] += roundScores[playerId]`.
**Warning signs:** After the second round, "running total" shows only round 2 points; or "points earned this round" shows the cumulative total.

### Pitfall 6: Turn Advance Logic Missing After Valid Move

**What goes wrong:** After a valid `SUBMIT_WORD`, the reducer updates `currentWord` and score but forgets to advance `currentPlayerId` to the next player. Both players think it's their turn.
**Why it happens:** Phase 2's `RoundState` has `currentPlayerId` but no `advanceTurn` function — that was left for Phase 3.
**How to avoid:** The `applyValidTurn` helper in `gameReducer.ts` must: (1) update `currentWord`, (2) add to `turnHistory`, (3) update `PlayerState.score` and draw tiles back to 9, and (4) advance `currentPlayerId` to the next player in `activePlayers`. The next player is `activePlayers[(activePlayers.indexOf(currentPlayerId) + 1) % activePlayers.length]`.
**Warning signs:** After human submits a word, phase transitions to `AI_THINKING` but AI uses the same `currentPlayerId` as the human.

### Pitfall 7: Tile Draw After Valid Turn

**What goes wrong:** After a human submits a valid word using one tile, the reducer updates the hand but forgets to call `drawToNine`. Player's hand shrinks by one tile each turn.
**Why it happens:** Phase 2's `validateTurn` checks that the hand contains the needed tile, but it does not mutate the hand. Mutation is the caller's responsibility.
**How to avoid:** In `applyValidTurn`: after accepting the word, call `drawToNine(updatedHand, state.round.bag)` and update both `PlayerState.hand` and `RoundState.bag` in the new state. This applies to both human and AI players.
**Warning signs:** Hand size decreases from 9 toward 0 over successive turns; eventually `letter_not_in_hand` errors appear even for valid plays.

---

## Code Examples

### GameState initialization

```typescript
// src/lib/gameReducer.ts
function createInitialGameState(config: GameConfig): GameState {
  const playerIds = ['human', 'ai']
  const playerNames = { human: 'You', ai: 'AI' }
  const round = createRoundState(playerIds, playerNames, config.tileDistribution, 1, 'human')

  return {
    phase: 'SETUP',
    round,
    config,
    roundScores: { human: 0, ai: 0 },
    totalScores: { human: 0, ai: 0 },
  }
}
```

### Turn advance helper

```typescript
// src/lib/gameReducer.ts
function advanceTurn(round: RoundState): string {
  const currentIndex = round.activePlayers.indexOf(round.currentPlayerId)
  const nextIndex = (currentIndex + 1) % round.activePlayers.length
  return round.activePlayers[nextIndex]
}

function applyValidTurn(
  round: RoundState,
  playerId: string,
  word: string,
  points: number,
  config: GameConfig
): RoundState {
  const player = round.players[playerId]
  // Remove used tile and draw back to 9
  // (find the diff letter, remove one from hand, draw)
  const usedLetter = multisetDiff(word, round.currentWord)[0]
  const handAfterPlay = removeOneLetter(player.hand, usedLetter)
  const { hand: newHand, bag: newBag } = drawToNineFromBag(handAfterPlay, round.bag)

  const updatedPlayer: PlayerState = {
    ...player,
    hand: newHand,
    score: player.score + points,
  }

  const nextPlayerId = advanceTurn(round)

  return {
    ...round,
    currentWord: word.toUpperCase(),
    currentPlayerId: nextPlayerId,
    bag: newBag,
    players: { ...round.players, [playerId]: updatedPlayer },
    turnHistory: [...round.turnHistory, { playerId, word: word.toUpperCase(), score: points }],
  }
}
```

### Vocabulary subsetting for AI difficulty

```typescript
// src/lib/aiEngine.ts
import { EASY_WORDS } from '../data/easyWords'
import { MEDIUM_WORDS } from '../data/mediumWords'  // or derived at runtime if frequency list bundled

export function getVocabulary(
  difficulty: 'easy' | 'medium' | 'hard',
  fullDictionary: Set<string>
): { array: string[], set: Set<string> } {
  if (difficulty === 'easy') {
    // Pre-validated static list; no runtime filtering needed
    return { array: [...EASY_WORDS], set: new Set(EASY_WORDS) }
  }
  if (difficulty === 'medium') {
    return { array: [...MEDIUM_WORDS], set: new Set(MEDIUM_WORDS) }
  }
  // Hard: full dictionary
  const array = [...fullDictionary]
  return { array, set: fullDictionary }
}
```

### Integration test skeleton (complete round)

```typescript
// src/lib/__tests__/gameReducer.test.ts (integration)
it('completes a round: human plays, AI plays, human eliminated', () => {
  const config: GameConfig = { difficulty: 'hard', banPluralS: false, tileDistribution: 'bananagrams' }
  const dict = new Set(['cat', 'cart', 'carts'])

  let state = createInitialGameState(config)
  expect(state.phase).toBe('SETUP')

  // Human submits starting word
  state = gameReducer(state, { type: 'SUBMIT_STARTING_WORD', word: 'CAT' })
  // ... manipulate state to set human hand and AI hand for test
  expect(state.phase).toBe('AI_THINKING')

  // AI submits (simulated — in real code, useAI dispatches this)
  state = gameReducer(state, { type: 'SUBMIT_WORD', word: 'CART', playerId: 'ai' })
  expect(state.phase).toBe('HUMAN_TURN')
  expect(state.round.currentWord).toBe('CART')

  // Human is eliminated (cannot play)
  state = gameReducer(state, { type: 'ELIMINATE_PLAYER', playerId: 'human' })
  expect(state.phase).toBe('ROUND_END')
  expect(state.round.activePlayers).toEqual(['ai'])
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Class-based state machines (e.g. XState v4) | Plain discriminated union reducers | 2022–2023 | Simpler, no library dependency, TypeScript narrows cleanly on `action.type` |
| `setTimeout` for AI "thinking" delay | `requestAnimationFrame` | Always best practice | rAF fires post-paint; setTimeout(0) may fire before React commits the phase change to the DOM |
| Global mutable game state | Zustand store with immutable reducer | Phase 1 decision | Already established — consistent pattern with existing slices |
| AI difficulty by search depth (minimax) | AI difficulty by vocabulary scope | Roadmap decision (STATE.md) | Correct approach for this game — depth search would also require move evaluation functions; scope-based difficulty is simpler and still feels meaningfully different at each level |

**Deprecated/outdated:**
- Hand-writing trie data structures for AI word lookup: unnecessary when vocabulary fits in memory as a flat array and linear scan is fast enough.
- Using `useReducer` local to a component: game state must cross many component boundaries; Zustand is the established project pattern.

---

## Open Questions

1. **Medium vocabulary source (AI-04, ~20K words)**
   - What we know: Easy is a committed static list (~5K). Hard is the full dictionary. Medium requires a word frequency source to select the top ~20K TWL words by frequency.
   - What's unclear: No frequency list is currently bundled or planned. Options: (a) Use COCA word frequency list (public domain subset), (b) use a manually curated pre-filtered subset similar to Easy but larger, (c) treat Medium as a random 20K-word sample from TWL at game initialization.
   - Recommendation: For v1, implement Medium as a statically committed `mediumWords.ts` file containing ~20K common TWL words. Source: filter the TWL word list against the [Google Books Ngram](https://storage.googleapis.com/books/ngrams/books/datasetsv3.html) top-50K English words (freely available) in a one-time offline script. Commit the result. This resolves the STATE.md blocker flagged under Phase 3.

2. **Starting word submission after NEXT_ROUND**
   - What we know: After a round ends and `NEXT_ROUND` is dispatched, the winner must submit a 3-letter starting word (GAME-01, GAME-07). The FSM should transition to `phase: 'SETUP'` with the winner as `currentPlayerId`.
   - What's unclear: If the winner is the AI, who submits the starting word? The AI must also be able to submit `SUBMIT_STARTING_WORD`. The `useAI` hook would need to handle `phase === 'SETUP' && currentPlayerId === 'ai'` as a secondary trigger.
   - Recommendation: Extend `useAI` to also handle the case where phase is `SETUP` and it's the AI's turn — select a random word from `STARTING_WORDS` and dispatch `SUBMIT_STARTING_WORD`. Alternatively, the reducer could auto-select a starting word for the AI when it becomes the starting player, avoiding the need for a special phase. **The planner should make this explicit in 03-01.**

3. **Easy words vocabulary curation**
   - What we know: STATE.md says AI-03 requires "a curated common-word vocabulary (~5K words)." The current `STARTING_WORDS` list is ~200 words.
   - What's unclear: Whether the easy word list should be a standalone file separate from `startingWords.ts`, and whether it must be limited to words achievable via the add-one-letter game mechanic (any length ≥ 4) or just any common 5K English words.
   - Recommendation: Create `src/data/easyWords.ts` as an independent export. It should be all-length TWL words (4+ letters) that appear in basic English vocabulary — not limited to word-game playability. The game mechanic constraint is enforced at runtime by `validateTurn`. A good source: the 5,000-word subset from the [Ogden's Basic English](https://en.wikipedia.org/wiki/Basic_English) or the top-5K from SCOWL (Size 50 en_US). This is a one-time data task.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.x |
| Config file | `vite.config.ts` (test block, already configured) |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AI-01 | `gameReducer` with two players alternates turns after each valid submission | integration | `npm test -- --run src/lib/__tests__/gameReducer.test.ts` | Wave 0 |
| AI-02 | `getVocabulary('easy', dict)` returns subset of `getVocabulary('hard', dict)` | unit | `npm test -- --run src/lib/__tests__/aiEngine.test.ts` | Wave 0 |
| AI-03 | Easy AI finds a valid move from 5K vocab given a solvable position | unit | `npm test -- --run src/lib/__tests__/aiEngine.test.ts` | Wave 0 |
| AI-04 | Medium vocab size is between 5K and full dict size | unit | `npm test -- --run src/lib/__tests__/aiEngine.test.ts` | Wave 0 |
| AI-05 | Hard AI vocabulary size equals full dictionary size | unit | `npm test -- --run src/lib/__tests__/aiEngine.test.ts` | Wave 0 |
| AI-06 | `findAIMove` with `banPluralS:true` does not return a simple plural extension | unit | `npm test -- --run src/lib/__tests__/aiEngine.test.ts` | Wave 0 |
| AI-07 | After valid human turn, `state.phase` transitions to `'AI_THINKING'` | unit | `npm test -- --run src/lib/__tests__/gameReducer.test.ts` | Wave 0 |
| SCOR-03 | After `SUBMIT_WORD`, `state.round.players[playerId].score` increases by `scoreWord(word)` | unit | `npm test -- --run src/lib/__tests__/gameReducer.test.ts` | Wave 0 |
| SCOR-04 | After `END_ROUND`, `state.roundScores` reflects points earned in that round | unit | `npm test -- --run src/lib/__tests__/gameReducer.test.ts` | Wave 0 |
| Integration | Full round: starting word → human turn → AI turn → elimination → ROUND_END | integration | `npm test -- --run src/lib/__tests__/gameReducer.test.ts` | Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test -- --run`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/lib/__tests__/gameReducer.test.ts` — covers AI-01, AI-07, SCOR-03, SCOR-04, full integration test
- [ ] `src/lib/__tests__/aiEngine.test.ts` — covers AI-02, AI-03, AI-04, AI-05, AI-06
- [ ] `src/lib/gameReducer.ts` — pure reducer implementation
- [ ] `src/lib/aiEngine.ts` — `findAIMove` and `getVocabulary` functions
- [ ] `src/store/gameSlice.ts` — Zustand store wrapping reducer
- [ ] `src/hooks/useAI.ts` — rAF-paced hook
- [ ] `src/data/easyWords.ts` — ~5K curated common words (one-time data task)
- [ ] `src/data/mediumWords.ts` — ~20K frequency-filtered words (one-time data task, resolves STATE.md blocker)
- [ ] `src/types/game.ts` — extended with `TurnPhase`, `GameConfig`, `GameState`, `GameAction` types

---

## Sources

### Primary (HIGH confidence)

- Project `src/types/game.ts` — existing `PlayerState`, `RoundState`, `TurnValidationResult` shapes that Phase 3 extends
- Project `src/lib/roundManager.ts` — `eliminatePlayer`, `checkRoundEnd`, `startNextRound`, `createRoundState` — all called from the reducer
- Project `src/lib/wordValidator.ts` — `validateTurn`, `validateStartingWord` — used by both reducer and AI engine
- Project `src/lib/scoreCalculator.ts` — `scoreWord` — called by reducer after every valid word
- Project `src/store/appSlice.ts` and `src/store/dictionarySlice.ts` — established Zustand store pattern to replicate for `gameSlice.ts`
- Project `STATE.md` — AI difficulty as vocabulary scope (locked decision); Medium vocabulary blocker (flagged concern)
- Project `.planning/ROADMAP.md` — Phase 3 plan list (03-01 GameReducer FSM, 03-02 AIEngine)

### Secondary (MEDIUM confidence)

- MDN Web Docs: `requestAnimationFrame` — fires after layout/paint, before next frame; correct tool for post-render side effects
- Zustand docs: `create()` pattern with selector access — consistent with existing project stores

### Tertiary (LOW confidence)

- Frequency-based vocabulary for Medium difficulty: specific word list source (COCA, Google Ngrams, SCOWL) is unverified and needs a one-time offline curation step before implementation

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; existing TypeScript/Vitest/Zustand setup confirmed working and matches established project patterns
- FSM/reducer pattern: HIGH — discriminated union reducers are the established TypeScript idiom; all Phase 2 pure functions are the building blocks
- AI engine design: HIGH — vocabulary scope approach is a locked decision from STATE.md; `validateTurn` handles all rule enforcement already
- rAF pacing: HIGH — MDN-documented behavior; correct for post-paint side effects; cancelation on cleanup is standard React pattern
- Easy/Medium vocabulary sources: MEDIUM — the mechanism is clear (static committed list) but the specific word list source requires a one-time curation decision
- Score accumulation design: HIGH — two-level scoring (roundScores + totalScores) is the direct mechanical solution to SCOR-03 vs SCOR-04 given Phase 2's round-resetting `PlayerState.score`

**Research date:** 2026-03-18
**Valid until:** 2026-05-18 (60 days — no external APIs or rapidly-evolving libraries involved)
