# Roadmap: Word Chicken

## Overview

Word Chicken ships as a pure client-side single-page application. Four phases build from the bottom up: the project scaffold and dictionary loading first, then the pure-TypeScript game engine (validator, tile bag, scorer, rules), then the AI opponent and FSM state machine that ties the engine into a playable game, then the full UI layer that makes it playable in a browser. Each phase is independently verifiable before the next begins.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Vite + React + TypeScript scaffold with dictionary loading and dev tooling
- [ ] **Phase 2: Core Engine** - Pure-TypeScript game logic: word validation, tile bag, scoring, and all game rules
- [ ] **Phase 3: AI and State Machine** - FSM reducer wiring all engine modules into a playable loop; AI opponent at three difficulty levels
- [ ] **Phase 4: Game UI** - All browser-facing components: board, hand, config screen, score, responsive layout

## Phase Details

### Phase 1: Foundation
**Goal**: Project toolchain and dictionary are in place so all engine work can begin with zero infrastructure blockers
**Depends on**: Nothing (first phase)
**Requirements**: WVAL-01
**Success Criteria** (what must be TRUE):
  1. Running `npm run dev` opens the app in a browser with no errors
  2. Running `npm test` executes a passing Vitest suite
  3. The TWL dictionary is loaded via fetch, parsed into a `Set<string>`, and ready for lookup within two seconds of first render — not bundled as a JS array
  4. The app shell routes between at least a placeholder Config screen and a placeholder Game screen
**Plans**: TBD

Plans:
- [ ] 01-01: Vite + React + TypeScript + Tailwind + Zustand + Vitest scaffold
- [ ] 01-02: Dictionary fetch-and-parse module with loading state

### Phase 2: Core Engine
**Goal**: All game rules exist as pure TypeScript functions that are fully unit-tested before any UI is built on top of them
**Depends on**: Phase 1
**Requirements**: WVAL-02, WVAL-03, WVAL-04, TILE-01, TILE-02, TILE-03, TILE-04, TILE-05, GAME-01, GAME-02, GAME-03, GAME-04, GAME-05, GAME-06, GAME-07, GAME-08, GAME-09, GAME-10, GAME-11, SCOR-01, SCOR-02
**Success Criteria** (what must be TRUE):
  1. A submitted word is validated against the dictionary and returns a typed result distinguishing "not a valid word" from "letters not available in hand"
  2. Q tile is stored as a single character everywhere in game state and expands to "Qu" only at dictionary lookup time — unit tests confirm "QACK" → invalid, "QUACK" lookup works correctly via Q tile
  3. A turn submission is rejected if the new word is not a strict multiset superset of the previous word plus exactly one tile from the player's hand
  4. Dealing a hand of 9 tiles from a Bananagrams-weighted bag produces at least 2 vowels — unit tests confirm distribution properties
  5. A word's score is calculated from its length plus bonus points for rare letters (Q, Z, X, J) and the scorer returns 0 for invalid words without throwing
**Plans**: TBD

Plans:
- [ ] 02-01: WordValidator module (dictionary lookup, Q expansion, plural filter, multiset superset check)
- [ ] 02-02: TileBag module (Bananagrams distribution, deal, draw-to-9, Scrabble-style alternative)
- [ ] 02-03: ScoreCalculator and RoundManager (scoring, elimination detection, round lifecycle, starting word corpus)

### Phase 3: AI and State Machine
**Goal**: A complete game loop runs — human and AI take turns, words grow, players are eliminated, rounds end — all driven by a FSM reducer that prevents illegal state transitions
**Depends on**: Phase 2
**Requirements**: AI-01, AI-02, AI-03, AI-04, AI-05, AI-06, AI-07, SCOR-03, SCOR-04
**Success Criteria** (what must be TRUE):
  1. An integration test drives a complete round from start (3-letter seed word) through player elimination to round end without any illegal state transition
  2. Easy AI selects from a curated ~5K common-word vocabulary; Hard AI uses the full dictionary; both AIs respect the plurals toggle and all configured game rules
  3. AI computation runs off the main thread (via requestAnimationFrame or worker) — the game does not freeze while the AI picks a move
  4. Running score is updated after every valid turn and is accessible from game state
  5. End-of-round state includes each player's points earned in that round
**Plans**: TBD

Plans:
- [ ] 03-01: GameReducer FSM (GameState shape, TurnPhase enum, all action types, GameContext)
- [ ] 03-02: AIEngine module (Easy/Medium/Hard strategy, vocabulary subsetting, useAI hook with rAF pacing)

### Phase 4: Game UI
**Goal**: The game is fully playable in a browser — a human can configure a game, play complete rounds against the AI, and see results
**Depends on**: Phase 3
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05, UI-06, UI-07, CONF-01, CONF-02, CONF-03, CONF-04, UX-01, UX-02, UX-03, SCOR-03, SCOR-04
**Success Criteria** (what must be TRUE):
  1. A player opens the app, selects difficulty and optional rule changes on the config screen, and starts a game — no tutorial required for the flow itself
  2. During a turn, the player can click tiles or type on a keyboard to compose a word, see the growing shared word prominently displayed, and receive specific error feedback if their submission is invalid
  3. The chicken-o-meter (tension visualization) updates visibly as the shared word grows longer
  4. The word history shows the sequence of words played and which player played each one
  5. After a game ends, the player sees win/loss result, round scores, and can start a new game without refreshing the page
  6. The layout is usable on a mobile browser — tile hand and word display are tappable and readable at phone screen widths
**Plans**: TBD

Plans:
- [ ] 04-01: Config screen and HowToPlay modal
- [ ] 04-02: GameBoard component (shared word display, word history, chicken-o-meter, turn indicator)
- [ ] 04-03: PlayerHand component (tile rack, click/keyboard selection, validation feedback, AI thinking state)
- [ ] 04-04: Score panel, GameOver screen, responsive layout pass

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/2 | Not started | - |
| 2. Core Engine | 0/3 | Not started | - |
| 3. AI and State Machine | 0/2 | Not started | - |
| 4. Game UI | 0/4 | Not started | - |
