# Roadmap: Word Chicken

## Milestones

- ✅ **v1.0 Core Game** - Phases 1-4 (shipped 2026-03-18)
- 🚧 **v1.1 Design Audit** - Phases 5-8 (in progress)

## Phases

<details>
<summary>✅ v1.0 Core Game (Phases 1-4) - SHIPPED 2026-03-18</summary>

### Phase 1: Foundation
**Goal**: Project toolchain and dictionary are in place so all engine work can begin with zero infrastructure blockers
**Depends on**: Nothing (first phase)
**Requirements**: WVAL-01
**Success Criteria** (what must be TRUE):
  1. Running `npm run dev` opens the app in a browser with no errors
  2. Running `npm test` executes a passing Vitest suite
  3. The TWL dictionary is loaded via fetch, parsed into a `Set<string>`, and ready for lookup within two seconds of first render — not bundled as a JS array
  4. The app shell routes between at least a placeholder Config screen and a placeholder Game screen
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md — Vite + React + TypeScript + Tailwind + Zustand + Vitest scaffold with Corbusier theme
- [x] 01-02-PLAN.md — Dictionary fetch-and-parse module with loading state

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
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md — WordValidator: dictionary lookup, Q expansion, multiset superset check, plural ban
- [x] 02-02-PLAN.md — TileBag: Bananagrams/Scrabble distributions, Fisher-Yates shuffle, deal, draw-to-9
- [x] 02-03-PLAN.md — ScoreCalculator and RoundManager: scoring, starting word corpus, elimination, round lifecycle

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
**Plans**: 2 plans

Plans:
- [x] 03-01-PLAN.md — GameReducer FSM: pure reducer, GameState types, TurnPhase enum, Zustand gameSlice store
- [x] 03-02-PLAN.md — AIEngine: findAIMove, vocabulary subsetting (Easy/Medium/Hard), curated word lists, useAI hook with rAF pacing

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
**Plans**: 4 plans

Plans:
- [x] 04-01-PLAN.md — TileCard component, ConfigScreen with localStorage persistence, HowToPlayModal
- [x] 04-02-PLAN.md — GameScreen orchestrator, SharedWordDisplay, ChickenOMeter, TurnIndicator, WordHistory, ScorePanel
- [x] 04-03-PLAN.md — PlayerHand with staging area tile interaction, validation feedback, AI thinking animation
- [x] 04-04-PLAN.md — RoundEndCard, GameOverScreen, tile scatter animation, responsive layout pass

</details>

### 🚧 v1.1 Design Audit (In Progress)

**Milestone Goal:** Make the game feel polished and professional across all screen sizes — fix viewport and layout breakage, bring touch targets and color contrast to standard, and refine visual hierarchy.

#### Phase 5: Viewport Foundation
**Goal**: The app owns the full visible viewport on every mobile browser — no overflow, no wasted space, no iOS overscroll surface bleed
**Depends on**: Phase 4
**Requirements**: VPRT-01, VPRT-02, VPRT-03, VPRT-05
**Success Criteria** (what must be TRUE):
  1. On first load on a real phone with the address bar visible, the app fills the screen top-to-bottom with no blank space below the content
  2. During an active game on a 375px-wide phone, no scrolling is required to reach any game element — all content fits in the visible area
  3. Config and Lobby screens scroll smoothly when content is taller than the viewport, with no hard clip at the bottom
  4. In dark mode on iOS Safari, overscrolling past the top or bottom of the page does not reveal a white background surface
**Plans**: 2 plans

Plans:
- [ ] 05-01-PLAN.md — Replace min-h-screen with dvh/svh on App shell, ConfigScreen, and LobbyScreen
- [ ] 05-02-PLAN.md — GameScreen viewport fix, dark mode overscroll bleed fix, viewport-fit=cover prerequisite

#### Phase 6: Mobile Layout and Touch Audit
**Goal**: Every interactive element is reachable by thumb and nothing is obscured by device hardware affordances
**Depends on**: Phase 5
**Requirements**: VPRT-04, TUCH-01, TUCH-02, TUCH-03
**Success Criteria** (what must be TRUE):
  1. On an iPhone with a notch or Dynamic Island, no game text or UI element is clipped by the device chrome — safe-area insets are applied
  2. The Submit button and staging area consistently appear in the lower third of the screen, reachable without shifting the grip
  3. All secondary action buttons (Quit, Give Up, Show a Word, How to Play, Back, Copy Code) have touch targets of at least 44px in both dimensions
  4. On the Lobby screen, the Back button remains tappable and visible when the virtual keyboard is open
**Plans**: TBD

Plans: TBD

#### Phase 7: Color and Contrast Audit
**Goal**: All text in both light and dark mode passes WCAG AA contrast — no text is invisible on any surface
**Depends on**: Phase 6
**Requirements**: COLR-01, COLR-02, COLR-03, COLR-04
**Success Criteria** (what must be TRUE):
  1. In light mode, every text element passes 4.5:1 contrast against its background when measured with a contrast tool — no exceptions
  2. In dark mode, no informational text uses an opacity below /50 — all text is readable on OLED displays
  3. Yellow tile and button backgrounds display dark charcoal text instead of white, passing WCAG AA
  4. The ChickenOMeter gradient is driven by CSS design tokens rather than hardcoded hex values — changing a color token updates the gradient automatically
**Plans**: TBD

Plans: TBD

#### Phase 8: Visual Polish and Hierarchy
**Goal**: The game's key status signals have clear visual weight — turn state, score, and tension are readable at a glance
**Depends on**: Phase 7
**Requirements**: PLSH-01, PLSH-02, PLSH-03, PLSH-04, PLSH-05
**Success Criteria** (what must be TRUE):
  1. The turn indicator in the top bar is visually dominant over the round counter and Quit button — a new player can immediately tell whose turn it is
  2. The score panel distinguishes round score (larger/bolder) from total score (secondary) without requiring the player to read labels
  3. The ChickenOMeter reads as a tension bar on mobile — wide enough (32-40px) that its fill level is perceptible at a glance
  4. A staged tile in the PlayerHand has an unambiguous "taken" appearance — clearly distinct from an available tile, not just slightly dimmed
  5. The RoundEndCard appears as an overlay consistent with the GameOverScreen, not inline in the game layout
**Plans**: TBD

Plans: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 5 → 6 → 7 → 8

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 2/2 | Complete | 2026-03-18 |
| 2. Core Engine | v1.0 | 3/3 | Complete | 2026-03-18 |
| 3. AI and State Machine | v1.0 | 2/2 | Complete | 2026-03-18 |
| 4. Game UI | v1.0 | 4/4 | Complete | 2026-03-18 |
| 5. Viewport Foundation | 2/2 | Complete   | 2026-03-19 | - |
| 6. Mobile Layout and Touch Audit | v1.1 | 0/TBD | Not started | - |
| 7. Color and Contrast Audit | v1.1 | 0/TBD | Not started | - |
| 8. Visual Polish and Hierarchy | v1.1 | 0/TBD | Not started | - |
