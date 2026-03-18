# Project Research Summary

**Project:** Word Chicken
**Domain:** Browser-based tile word game with AI opponent (single-player v1)
**Researched:** 2026-03-18
**Confidence:** MEDIUM-HIGH

## Executive Summary

Word Chicken is a pure client-side single-page application — no backend required for v1. The game's core mechanic (players take turns adding one letter from their hand to a shared growing word, with the player who cannot extend eliminated) has no direct browser-game competitor, but borrows heavily from established word game conventions. Experts build this class of product using React + Zustand for UI/state, a bundled dictionary loaded as a JavaScript Set for O(1) validation, and a layered architecture that keeps all game logic in pure TypeScript separated from UI components. The most important architectural commitment is modeling the game as a finite state machine (FSM) — this prevents illegal state transitions and makes all the phase logic testable without a browser.

The recommended approach is to build bottom-up: data layer first (word list, tile config), then pure engine logic (validator, tile bag, scorer, round manager), then AI, then state/reducer, then UI components. This order ensures every layer is independently testable before the next depends on it. The word list choice is between TWL06 (~178K words, smaller bundle, North American familiarity) and SOWPODS (~267K words, international). TWL06 is the better v1 default. Dictionary loading should use a fetch-on-demand pattern with gzip, not a bundled JS array — bundle size is the single most dangerous technical pitfall for this project.

The highest risks are: (1) the Q="Qu" tile data model — if implemented as a display-layer concern rather than a data model decision, it breaks scoring, validation, and permutation logic everywhere; (2) the add-one-letter validation rule — it appears simple but requires multiset superset checking, not string length comparison; (3) AI difficulty — naive "best move = hard" produces an AI that feels impossible rather than challenging. All three must be addressed in the core mechanics phase before any UI polish work begins.

## Key Findings

### Recommended Stack

The entire stack runs in the browser with no server. React 19 + TypeScript 6 + Vite 8 is the current standard scaffold for interactive browser games. Zustand 5 handles shared game state across components without the boilerplate overhead of Redux. Tailwind 4 handles tile-grid and rack layout efficiently. The word list ships with the app, loaded via `fetch` after first render and parsed into a JavaScript `Set<string>` for O(1) lookup. Vitest 4 tests all engine logic without a DOM. Framer-motion 11 is optional for tile animations and should be deferred until the game loop is stable.

See `.planning/research/STACK.md` for full version matrix and installation commands.

**Core technologies:**
- React 19 + TypeScript 6: UI framework and type safety — game state is complex enough to require types
- Vite 8: Build tool with Rolldown (Rust bundler); near-instant HMR critical for game feel iteration
- Zustand 5: Game state management — hook-native, no boilerplate, appropriate scale for single-page game
- Tailwind 4: Tile-grid layout — utility classes faster than hand-written CSS for grid-heavy UI
- TWL06 (scrabble-dict): Bundled dictionary — ~178K words, browser-compatible, compressed internally
- Vitest 4: Unit testing — zero-config with Vite, critical for engine and AI behavior verification

### Expected Features

See `.planning/research/FEATURES.md` for full prioritization matrix and feature dependency graph.

**Must have (table stakes):**
- Word Validation Engine — client-side, bundled dictionary; every other feature depends on it
- Game State Machine — round lifecycle: seed word → turns → elimination → next round → game over
- Tile Distribution + Hand Dealing — Bananagrams default, 9 tiles per hand, new hand each round
- Q="Qu" tile — single tile, renders as "Qu," validates Qu-prefix words correctly
- Turn submission with validation feedback — shake animation for invalid; error type specified
- 1v1 AI opponent — Easy/Medium/Hard via vocabulary scoping, not search depth
- Current word display and hand tile display — prominent, updated each turn
- Keyboard input support — desktop users type to select tiles
- Pre-game config screen — difficulty, plurals toggle, tile distribution mode
- How to Play modal — novel mechanic requires explanation for first-time players
- Score display and game over screen — expected by all word game players

**Should have (competitive differentiators):**
- AI flavor text / commentary — pre-scripted per game event; makes AI feel alive without LLM cost
- Tension ramp visualization (chicken-o-meter) — amplifies escalating pressure that is the game's core value
- Word history display — post-round replay of how the word grew; creates narrative arc
- Sound effects — audio feedback for valid/invalid words, elimination; add after visual loop is stable

**Defer (v2+):**
- Online multiplayer — requires server, WebSocket, matchmaking; doubles scope; validate mechanic first
- User accounts and leaderboards — meaningless without multiplayer or social graph
- Multiple simultaneous AI opponents — 3-player balance unvalidated; add after 1v1 is proven

### Architecture Approach

Word Chicken uses a four-layer client-side architecture: data (word list, tile config, rule defaults), engine (pure TypeScript functions — validator, tile bag, scorer, round manager, AI), state (FSM reducer + React context), and components (thin UI that reads from context and dispatches actions only). No game logic lives in components. The AI is part of the engine layer, triggered by a `useAI` hook that uses `requestAnimationFrame` to avoid blocking the render thread. The word list is imported once as a module singleton and shared across all engine functions.

See `.planning/research/ARCHITECTURE.md` for full project structure, data flow diagrams, and FSM phase definitions.

**Major components:**
1. GameReducer (FSM) — central state machine owning all phase transitions; no component mutates state directly
2. WordValidator — pure function wrapping the singleton word Set; enforces plural rules and Q="Qu" expansion
3. TileBag — letter distribution, deal, draw-to-9 after each play
4. AIEngine — dispatches to Easy/Medium/Hard strategy based on vocabulary-scoped word search
5. GameBoard + PlayerHand — thin React components rendering FSM state; dispatch actions on interaction

### Critical Pitfalls

See `.planning/research/PITFALLS.md` for full pitfall catalog, UX pitfall table, and "Looks Done But Isn't" checklist.

1. **Dictionary bundle kills initial load** — never bundle the word list as a plain JS array; serve as compressed `.txt` via `fetch` after first render; parse into `Set<string>` once. TWL06 is ~400 KB gzipped; SOWPODS is ~750 KB gzipped.
2. **Q="Qu" data model inconsistency** — treat Q as a single character `'Q'` everywhere in game state and logic; expand to "QU" only in the validator at lookup time; display as "Qu" only in the render layer. Getting this wrong requires a full data model migration to fix.
3. **Add-one-letter validation is non-trivial** — the legal move check is a letter-multiset superset check, not a string length comparison. New word = old word letters + one tile from hand. Validate this before dictionary lookup; write unit tests for substitution attempts, duplicate letters, and Q tile edge cases.
4. **Hard AI feels impossible, not challenging** — implement difficulty as vocabulary scope (Easy = ~5K common words, Medium = ~20K, Hard = full list), not search depth or delay. AI that always finds the optimal move wins 95%+ of rounds and destroys player trust.
5. **Starting word dead ends** — do not pick round-starting 3-letter words randomly from all valid dictionary 3-letter words; many have no common 4-letter extensions. Curate a corpus of ~200-500 starting words pre-filtered for extendability.

## Implications for Roadmap

Based on research, the architecture's explicit build order (data → engine → AI → state → UI) maps directly to phases. The dependency graph from FEATURES.md confirms this ordering: Word Validation Engine and Game State Machine must exist before any other feature can be built or tested.

### Phase 1: Foundation and Project Scaffold

**Rationale:** Everything depends on the word list and project toolchain being in place. The dictionary bundle pitfall (Pitfall 1) must be solved before any game logic is written — the loading pattern affects every other module.
**Delivers:** Vite + React + TypeScript + Tailwind + Zustand scaffold; word list loaded and parsed into `Set<string>` via fetch; Vitest configured; basic app shell routing (Config → Game → GameOver).
**Addresses:** Word Validation Engine (foundation only), dictionary loading strategy
**Avoids:** Dictionary bundle size pitfall; establishes correct loading pattern before AI or validation work begins
**Research flag:** Standard patterns — skip phase research. Vite react-ts scaffold + Tailwind 4 + Vitest 4 are well-documented.

### Phase 2: Core Game Engine

**Rationale:** Pure engine logic must exist before state or UI. The engine layer (wordValidator, tileBag, scoreCalculator, roundManager) has no React dependencies and is fully unit-testable. Q="Qu" data model (Pitfall 3) and add-one-letter validation (Pitfall 2) must be solved here, before any UI is built on top of them.
**Delivers:** `engine/` module — WordValidator (with Q="Qu" expansion), TileBag (Bananagrams distribution with vowel/consonant guard), ScoreCalculator (length + rarity), RoundManager (turn order, elimination detection). Full unit test coverage for all edge cases.
**Addresses:** Word Validation Engine, Tile Distribution + Hand Dealing, Q="Qu" tile, Plurals toggle (at filter layer), Starting word corpus curation
**Avoids:** Q="Qu" data model inconsistency, add-one-letter validation error, unwinnable hands from bad distribution, plurals toggle AI inconsistency
**Research flag:** Standard patterns — FSM and pure-function engine patterns are well-documented. No phase research needed.

### Phase 3: Game State Machine and Turn Loop

**Rationale:** The FSM reducer ties all engine modules together into a playable (if UI-minimal) game. The full turn loop (human submit → validate → AI turn → validate → elimination → round end) must be wired and tested before UI components are built on top of it. Mutable game state anti-pattern (see ARCHITECTURE.md) must be avoided here.
**Delivers:** `state/` module — GameState shape, TurnPhase enum, all action types, gameReducer (FSM), GameContext. A playable console-driven or minimal-UI game loop. End-to-end integration tests covering complete round lifecycle including elimination and game over.
**Addresses:** Game State Machine, Turn Submission with Validation Feedback, No Max Word Length Elimination, Round Start / Round End state
**Avoids:** Mutable game state anti-pattern; illegal state transitions; game logic leaking into components
**Research flag:** Standard FSM patterns — skip phase research.

### Phase 4: AI Opponent

**Rationale:** AI depends on both WordValidator and the game state machine. Difficulty must be implemented as vocabulary scoping before any UI is built that exposes difficulty selection — the PITFALLS.md finding that naive "best move = hard" produces an unbeatable AI is a design constraint that must inform the implementation from the start.
**Delivers:** `engine/ai/` module — EasyAI (common 5K-word vocabulary, shortest extension), MediumAI (20K-word vocabulary, moderate length preference), HardAI (full word list, prefers hard-to-extend words). `useAI` hook with requestAnimationFrame pacing and artificial thinking delay. Win rate playtesting: Easy ~20%, Medium ~40%, Hard ~65% target.
**Addresses:** 1v1 AI opponent (Easy/Medium/Hard), AI difficulty configuration
**Avoids:** Perfect-play hard AI pitfall; synchronous AI computation blocking UI thread
**Research flag:** May benefit from phase research on word frequency lists for vocabulary subsetting. The specific threshold values (5K / 20K words) need playtesting validation.

### Phase 5: UI Layer and Full Game Loop

**Rationale:** With all engine, state, and AI in place, UI components are thin render/dispatch surfaces. This is the phase where the game becomes playable end-to-end in the browser. Pre-game config, how-to-play, and all table-stakes UX features ship here.
**Delivers:** All P1 UI features — GameBoard (word tiles), PlayerHand (9-tile rack with click/keyboard selection), ScorePanel, ConfigScreen (difficulty + plurals + distribution), HowToPlay modal, GameOver screen. Responsive layout (mobile touch and desktop keyboard). Full manual QA against PITFALLS.md "Looks Done But Isn't" checklist.
**Addresses:** All remaining table-stakes features from FEATURES.md P1 list
**Avoids:** Game logic in components anti-pattern; API-based dictionary validation; drag-and-drop over-engineering
**Research flag:** Standard React patterns — skip phase research. Keyboard focus management and tile selection UX may need design iteration.

### Phase 6: Polish and Differentiators

**Rationale:** Once the core mechanic is validated as playable and fun, add the differentiating features that increase engagement and personality. These are P2 features in the FEATURES.md matrix — valuable but not blocking launch.
**Delivers:** AI flavor text (pre-scripted commentary by game event), tension ramp visualization (chicken-o-meter keyed to word length and letter rarity), word history display, optional sound effects (Web Audio API), session stats on game over screen.
**Addresses:** P2 features from FEATURES.md — AI personality, engagement hooks, polish
**Avoids:** LLM integration anti-feature (flavor text uses lookup table, not AI API)
**Research flag:** Skip phase research. All patterns are standard UI enhancement work.

### Phase Ordering Rationale

- **Bottom-up build order** directly follows the architecture's dependency graph: data → engine → AI → state → UI. Each phase can be verified before the next begins.
- **Engine-before-UI** is the critical decision: solving Q="Qu" data model and add-one-letter validation at the engine level (Phase 2) prevents cascading refactors if discovered after UI is built.
- **AI before UI** (Phase 4 before Phase 5) ensures difficulty configuration is a real system before the config screen exposes it to players.
- **Polish deferred** (Phase 6) follows FEATURES.md's anti-feature analysis: framer-motion, sound, and AI personality are explicitly called out as scope creep risks if added before the game loop is proven.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (AI Opponent):** Word frequency list sourcing for vocabulary subsetting (Easy = 5K, Medium = 20K words). Need a specific, licensable frequency-ranked English word list. The specific win-rate thresholds need playtesting calibration.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Vite + React + TypeScript scaffold is thoroughly documented.
- **Phase 2 (Core Engine):** Pure TypeScript FSM + Set-based dictionary lookup are textbook patterns.
- **Phase 3 (State Machine):** Reducer pattern for game state is well-established.
- **Phase 5 (UI Layer):** Standard React component patterns throughout.
- **Phase 6 (Polish):** Standard UI enhancement patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core choices (React 19, Vite 8, Zustand 5, Tailwind 4) confirmed via official sources with current version numbers. Dictionary library choice is MEDIUM — npm ecosystem for this niche is thin, but both candidates (pf-sowpods, scrabble-dict) have confirmed browser compatibility. |
| Features | MEDIUM | Word game conventions are well-established. Novel mechanic (letter-by-letter extension with elimination) has no direct comparators, so feature priority calls are inference from adjacent games, not direct research. P1 feature list is solid; P2 priority order may shift with playtesting. |
| Architecture | MEDIUM-HIGH | FSM + pure engine layer + bundled dictionary patterns are verified via game programming resources. The specific project structure is reasoned design, not copied from a reference implementation of this exact game type. |
| Pitfalls | MEDIUM | Critical pitfalls (dictionary bundle size, Q="Qu" data model, add-one-letter validation) are verified via adjacent project experience and game design literature. AI difficulty calibration values (20%/40%/65% win rates) are targets, not verified benchmarks — playtesting will determine actual numbers. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Word frequency list source:** Phase 4 (AI Opponent) requires a frequency-ranked word list for vocabulary subsetting. No specific source was identified during research. Options: use a publicly available frequency list (e.g., from the Corpus of Contemporary American English), extract from a Scrabble word-frequency tool, or manually curate. Needs resolution before AI phase planning.
- **Starting word corpus curation method:** The recommendation to curate ~200-500 starting words is clear; the automated method for pre-computing extendability (which 3-letter words have 5+ common 4-letter extensions) is not specified. This requires a one-time script during Phase 2 using the word list itself.
- **Plurals filtering heuristic accuracy:** The recommended approach for filtering plurals (words ending in S where the base exists) is acknowledged as imperfect in PITFALLS.md. Edge cases (LENS, MASS, etc.) will surface during testing. Acceptable to ship conservative filtering and tune.
- **Tile distribution balance values:** The Bananagrams distribution was designed for a different game mode. The specific vowel/consonant guardrails for dealing are not validated — "minimum 2 vowels, maximum 1 rare consonant" is a reasonable starting point but requires playtesting to confirm.

## Sources

### Primary (HIGH confidence)
- https://react.dev/versions — React 19.0.4 current stable confirmed
- https://vite.dev/blog/announcing-vite8 — Vite 8 with Rolldown confirmed
- https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html — TS 6.0 release confirmed
- https://tailwindcss.com/blog/tailwindcss-v4 — Tailwind v4 stable confirmed
- https://www.npmjs.com/package/zustand — Zustand 5.0.12, 20M weekly downloads confirmed
- https://vitest.dev/guide/browser/ — Vitest 4 browser mode stable confirmed
- https://github.com/pillowfication/pf-sowpods — SOWPODS trie, 267,751 words confirmed
- https://github.com/siddharthvader/scrabble-dict — TWL, TypeScript, browser-compatible confirmed
- https://gameprogrammingpatterns.com/state.html — FSM pattern for game phase management
- https://en.wikipedia.org/wiki/Scrabble_letter_distributions — tile distribution reference

### Secondary (MEDIUM confidence)
- https://iamkate.com/code/wordle-dictionary/ — word list compression strategies
- https://medium.com/@robin.david/thoughts-on-designing-word-building-games-f530792a46e1 — hand management and vowel balance
- https://boardgamedesigncourse.com/game-mechanics-how-to-make-a-great-word-game/ — hand quality and downtime analysis
- https://dev.to/themachinepulse/do-you-need-state-management-in-2025-react-context-vs-zustand-vs-jotai-vs-redux-1ho — Zustand vs Redux community consensus
- https://www.freecodecamp.org/news/how-i-built-a-react-game-with-react-dnd-and-react-flip-move-26300156a825/ — React word game architecture patterns
- https://fintelics.medium.com/ai-in-game-difficulty-adjustment-adapting-challenges-to-player-skill-levels-b7f7767c96b — AI difficulty calibration approaches

### Tertiary (LOW confidence)
- https://johnresig.com/blog/javascript-trie-performance-analysis/ — trie approach for JS dictionary lookups (older post, algorithm still valid)
- https://tvtropes.org/pmwiki/pmwiki.php/Main/TheComputerIsACheatingBastard — AI fairness perception analysis

---
*Research completed: 2026-03-18*
*Ready for roadmap: yes*
