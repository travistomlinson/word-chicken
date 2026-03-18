# Architecture Research

**Domain:** Browser-based tile word game (single-player vs AI)
**Researched:** 2026-03-18
**Confidence:** MEDIUM-HIGH

## Standard Architecture

### System Overview

Word Chicken is a pure client-side SPA. No backend is needed for v1 — all game logic, dictionary lookup, and AI computation runs in the browser.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                        │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│  GameBoard   │  PlayerHand  │  ScorePanel  │  ConfigScreen      │
│  (word tiles)│  (9 tiles)   │  (per-round) │  (rules toggles)   │
└──────┬───────┴──────┬───────┴──────┬───────┴─────────┬──────────┘
       │              │              │                 │
┌──────┴──────────────┴──────────────┴─────────────────┴──────────┐
│                       Game State Layer                           │
│  ┌───────────────┐  ┌────────────────┐  ┌─────────────────────┐  │
│  │  GameReducer  │  │  RoundManager  │  │   ScoreCalculator   │  │
│  │  (FSM phases) │  │  (turn order,  │  │   (length, rarity)  │  │
│  │               │  │   elimination) │  │                     │  │
│  └───────────────┘  └────────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                       Domain Logic Layer                         │
│  ┌───────────────┐  ┌────────────────┐  ┌─────────────────────┐  │
│  │  WordValidator │  │  TileBag       │  │   AIEngine          │  │
│  │  (Set lookup) │  │  (distribution,│  │   (Easy/Med/Hard)   │  │
│  │               │  │   draw, return)│  │                     │  │
│  └───────────────┘  └────────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                       Data / Asset Layer                         │
│  ┌───────────────┐  ┌────────────────┐  ┌─────────────────────┐  │
│  │  WordList     │  │  TileConfig    │  │   RulesConfig       │  │
│  │  (TWL/SOWPODS │  │  (Bananagrams  │  │   (plurals toggle,  │  │
│  │   as JS Set)  │  │   distribution)│  │    distribution)    │  │
│  └───────────────┘  └────────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|----------------|-------------------|
| GameBoard | Renders the growing word as placed tiles; accepts tile drop or click-to-append input | PlayerHand (tile source), GameReducer (dispatches play) |
| PlayerHand | Displays the human player's 9 tiles; manages selection/ordering before submission | GameBoard (tile target), TileBag (draw after play) |
| ScorePanel | Shows per-round and cumulative score for each player | ScoreCalculator (subscribes to round-end events) |
| ConfigScreen | Pre-game rules toggles (plurals, tile distribution mode) | RulesConfig (writes), GameReducer (initialises game) |
| GameReducer | Central FSM — owns phase transitions: Config → Dealing → Turn → Validation → Elimination → RoundEnd → GameOver | All other components read state from here |
| RoundManager | Tracks whose turn it is, manages elimination list, detects last-player-standing | GameReducer (dispatches events) |
| ScoreCalculator | Pure function: word string + tile rarity config → numeric score | Called at round end by RoundManager |
| WordValidator | Checks if a submitted string exists in the word list; enforces plural rule | Pure function; used by GameReducer on submission |
| TileBag | Initialises letter distribution, deals starting hands, handles draws after a play | Called by RoundManager at round start and after each valid play |
| AIEngine | Given current word + AI hand + difficulty, selects a valid extension or signals "can't play" | GameReducer (turn dispatch), WordValidator (verify candidates) |
| WordList | Bundled TWL/SOWPODS word set loaded once at startup; exposes `has(word)` | WordValidator only |
| TileConfig | Bananagrams-style letter counts and weights; configurable alternative distributions | TileBag |
| RulesConfig | Persists current game configuration (plurals allowed, distribution style) | ConfigScreen writes; GameReducer + WordValidator read |

## Recommended Project Structure

```
src/
├── engine/               # Pure domain logic — no React, no DOM
│   ├── wordValidator.ts  # WordList.has() wrapper + plural/rules checks
│   ├── tileBag.ts        # Letter distribution, draw, shuffle
│   ├── scoreCalculator.ts# Scoring formula (length, rarity)
│   ├── roundManager.ts   # Turn order, elimination, round-end detection
│   └── ai/
│       ├── aiEngine.ts   # Dispatcher: picks strategy by difficulty
│       ├── easyAI.ts     # Short, common-word heuristic
│       ├── mediumAI.ts   # Scored word search within hand permutations
│       └── hardAI.ts     # Optimal extension search (trie or sorted set)
├── state/
│   ├── gameReducer.ts    # FSM reducer: action → new GameState
│   ├── gameActions.ts    # Action type definitions
│   ├── gameTypes.ts      # GameState, PlayerState, TurnPhase enums
│   └── GameContext.tsx   # React context + useGameDispatch / useGameState
├── data/
│   ├── wordlist.ts       # Imports/parses bundled word file → Set<string>
│   ├── tileConfig.ts     # Letter counts and point values
│   └── defaultRules.ts   # Default RulesConfig values
├── components/
│   ├── GameBoard.tsx     # Rendered word as tile row
│   ├── PlayerHand.tsx    # Human's 9 tiles with selection state
│   ├── OpponentHand.tsx  # AI tile count indicator (no peek)
│   ├── ScorePanel.tsx    # Score display per player
│   ├── ConfigScreen.tsx  # Pre-game configuration UI
│   └── ui/               # Shared: Tile, Button, Modal, etc.
├── hooks/
│   ├── useGameState.ts   # Thin wrapper over GameContext
│   ├── useTurn.ts        # Encapsulates submit/pass logic
│   └── useAI.ts          # Triggers AI turn with requestAnimationFrame pacing
└── App.tsx               # Route: Config → Game → GameOver
```

### Structure Rationale

- **engine/**: Pure TypeScript with zero UI dependencies. Can be unit-tested without a DOM. The AI lives here because it is deterministic logic, not view logic.
- **state/**: All mutable game state lives in one reducer. Components never mutate state directly — they dispatch actions. This matches the write-only DOM pattern: state drives the UI, UI never reads state from DOM.
- **data/**: Assets (word list, tile config) are separated so they can be swapped without touching game logic. The word list is imported once and shared as a singleton module.
- **components/**: Thin — they read from context and dispatch actions. No game logic lives in components.
- **hooks/**: Bridge between React and the engine. `useAI` uses `requestAnimationFrame` to avoid blocking the render thread during AI computation.

## Architectural Patterns

### Pattern 1: Finite State Machine for Game Phase

**What:** The game progresses through discrete phases (Config, Dealing, HumanTurn, AITurn, Validating, Eliminated, RoundEnd, GameOver). A reducer function maps `(state, action) → nextState`, making illegal transitions impossible.

**When to use:** Any turn-based game with clear phase boundaries. Prevents bugs where UI is shown in the wrong phase (e.g., tile submission accepted during AI turn).

**Trade-offs:** Verbose action definitions upfront; pays off immediately when adding new features because invalid states are unreachable.

**Example:**
```typescript
type TurnPhase =
  | 'config'
  | 'dealing'
  | 'humanTurn'
  | 'aiTurn'
  | 'validating'
  | 'roundEnd'
  | 'gameOver';

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (state.phase) {
    case 'humanTurn':
      if (action.type === 'SUBMIT_WORD') {
        const valid = wordValidator.check(action.word, state.rules);
        return valid
          ? { ...state, phase: 'aiTurn', currentWord: action.word }
          : { ...state, phase: 'eliminated', eliminatedPlayer: 'human' };
      }
      return state;
    // ... other phases
  }
}
```

### Pattern 2: Bundled Word List as Singleton Set

**What:** Load TWL/SOWPODS once at module initialisation into a JavaScript `Set<string>`. All lookups are O(1). No network calls, no async delay during play.

**When to use:** Any word game requiring fast, offline-capable validation. A Set of ~180,000 words uses roughly 6–10 MB of memory, acceptable for a modern browser tab.

**Trade-offs:** Initial bundle parse time (< 1 second on modern hardware); must be loaded before the first game starts. Lazy-loading behind a spinner at app start is the standard solution.

**Example:**
```typescript
// data/wordlist.ts — loaded once, imported by wordValidator
import rawWords from './twl06.txt?raw'; // Vite raw import

const WORD_SET: Set<string> = new Set(
  rawWords.split('\n').map(w => w.trim().toUpperCase())
);

export function isValidWord(word: string): boolean {
  return WORD_SET.has(word.toUpperCase());
}
```

### Pattern 3: AI Candidate Search via Hand Permutations

**What:** The AI engine generates candidate words by checking all subsets/arrangements of its hand tiles against the current word (append one tile, rearrange). It filters candidates through the WordValidator and ranks them by difficulty heuristic.

**When to use:** Word extension games where legal moves are constrained by the player's current hand. The hand size (9 tiles) keeps the search space manageable — permutation count is bounded.

**Trade-offs:** Hard difficulty may need pruning to avoid frame drops. For Easy AI, a curated short-word frequency list avoids exhaustive search entirely.

**Example:**
```typescript
function findAIMove(
  currentWord: string,
  hand: Tile[],
  difficulty: 'easy' | 'medium' | 'hard'
): string | null {
  const candidates: string[] = [];
  for (const tile of hand) {
    const extended = currentWord + tile.letter; // append
    const allArrangements = getPermutations([...currentWord, ...hand.map(t => t.letter)]);
    for (const arrangement of allArrangements) {
      if (isValidWord(arrangement) && isAnagramOf(arrangement, extended)) {
        candidates.push(arrangement);
      }
    }
  }
  return rankByDifficulty(candidates, difficulty)[0] ?? null;
}
```

## Data Flow

### Turn Flow (Human)

```
User selects tiles and clicks Submit
    ↓
useTurn.submit(arrangedWord)
    ↓
Dispatch: SUBMIT_WORD { word, playedTiles }
    ↓
gameReducer → WordValidator.check(word, rules)
    ↓ valid                      ↓ invalid
State: aiTurn                State: eliminated (human)
CurrentWord updated          Human removed from round
TileBag.draw() → replenish
    ↓
GameBoard re-renders new word
AIEngine picks move on next tick
```

### Turn Flow (AI)

```
State enters 'aiTurn'
    ↓
useAI hook detects phase change
    ↓
requestAnimationFrame → aiEngine.pickMove(state)
    ↓ found move              ↓ no move
Dispatch: AI_SUBMIT_WORD    Dispatch: AI_CANNOT_PLAY
State: humanTurn            State: eliminated (AI)
CurrentWord updated         Round may end if last player
```

### Round Start Data Flow

```
RoundEnd or GameStart
    ↓
Dispatch: START_ROUND
    ↓
TileBag.reset() → shuffle full distribution
TileBag.deal(9) → human hand
TileBag.deal(9) × N → AI hands
RoundManager picks starting player (last round winner or random)
Starting player must play 3-letter seed word from their hand
    ↓
State: humanTurn (or aiTurn if AI starts)
```

### State Management Shape

```
GameState {
  phase: TurnPhase
  rules: RulesConfig
  currentWord: string
  players: PlayerState[]     // human first, then AIs
  activePlayerIndex: number
  round: number
  tileBag: TileBag
  scores: Record<PlayerId, number>
  roundHistory: RoundResult[]
}

Components subscribe via useGameState()
    ↓ (read)
Components dispatch via useGameDispatch()
    ↓ (write)
gameReducer produces new GameState
    ↓
React re-renders changed subtrees
```

## Scaling Considerations

This is a pure client-side game. "Scaling" means performance in the browser, not server load.

| Concern | At launch (v1) | If multiplayer added later |
|---------|----------------|---------------------------|
| Word lookup | O(1) Set.has() — no concern | Same; each client holds the Set |
| AI computation | Bounded by hand size (9 tiles); < 50ms on Easy/Medium | Per-client; no server compute needed |
| Hard AI search | May need Web Worker if permutation space causes jank | Web Worker isolation still applies |
| State size | Tiny — one game, no history server | Needs backend + WebSocket for sync |
| Bundle size | Word list is the main cost (~2–4 MB raw text) | Gzip on CDN; 300–600 KB over wire |

### Scaling Priorities

1. **First bottleneck — Hard AI jank:** Move `aiEngine.pickMove()` into a Web Worker so it doesn't block the UI thread. Communicate via `postMessage`. This is the most likely v1 performance concern.
2. **Second bottleneck — Word list parse time:** If startup is slow, lazy-load the word list file and show a loading state. Parsing into a Set is fast once the file is fetched; the bottleneck is file size.

## Anti-Patterns

### Anti-Pattern 1: Game Logic in Components

**What people do:** Put word validation, AI move selection, or elimination checks directly inside React components or event handlers.

**Why it's wrong:** Logic becomes untestable (requires DOM/React renderer), duplicated across components, and tightly coupled to UI decisions. A bug in scoring logic requires hunting through JSX.

**Do this instead:** All game logic in `engine/` as pure TypeScript functions. Components dispatch actions and render state — nothing more.

### Anti-Pattern 2: API-Based Dictionary Validation

**What people do:** Call a third-party word validation API (e.g., Merriam-Webster, Datamuse) on every submission.

**Why it's wrong:** Adds network latency to every turn, creates hard dependency on uptime, introduces per-query cost, and breaks offline play. For a word game, 200ms+ latency on validation feels broken.

**Do this instead:** Bundle the word list with the app. TWL06 is ~180K words; compressed it adds ~1.5 MB to the bundle — acceptable. Load once, validate in microseconds.

### Anti-Pattern 3: Mutable Game State

**What people do:** Mutate player hands, the current word, or the tile bag in place (e.g., `player.hand.splice(...)`).

**Why it's wrong:** Makes undo/replay impossible, causes subtle React re-render bugs (reference equality checks fail to detect changes), and makes AI "what-if" simulation dangerous (AI explores moves that contaminate real state).

**Do this instead:** Immutable state updates via reducer. AI simulation clones state before exploration. Undo is a free side effect.

### Anti-Pattern 4: Encoding Q as Two Characters in Logic

**What people do:** Represent the "Q=Qu" tile as the string "QU" throughout the codebase, causing length-counting, display, and permutation logic to diverge.

**Why it's wrong:** A 4-letter word using Q is stored as 5 characters, breaking all length comparisons, scoring, and word validation (dictionary entries use standard spelling).

**Do this instead:** Store the tile as the single character `'Q'` everywhere in game state. The display layer renders it as "Qu". The word validator strips/expands Q→QU only at validation time, consistently in one place.

## Integration Points

### External Dependencies

| Dependency | Integration Pattern | Notes |
|------------|---------------------|-------|
| TWL06 / SOWPODS word list | Bundled as static asset; Vite `?raw` import or public folder fetch | Free to distribute TWL06; SOWPODS license is more restrictive — verify |
| Bananagrams tile distribution | Hard-coded config object (not a library) | Counts: A×13, B×3, C×3, etc. |
| Web Worker (Hard AI) | `new Worker('ai.worker.ts')` with `postMessage` protocol | Optional for v1; add when jank is observed |

### Internal Module Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Components → State | React context dispatch (actions only) | Components never call engine functions directly |
| State → Engine | Reducer calls pure functions synchronously | gameReducer imports from engine/; engine has no React imports |
| AI → WordValidator | Direct function call within engine/ | AI is in engine/ so this is an intra-layer call |
| AI (Hard) → Main Thread | Web Worker postMessage if extracted | Protocol: `{ type: 'PICK_MOVE', state }` → `{ type: 'MOVE_RESULT', word }` |
| Data (WordList) → Engine | Module singleton — imported at startup | Never re-initialised; safe to import in engine/ and tests |

## Build Order Implications

Dependencies flow upward: data layer must exist before engine, engine before state, state before components.

```
Phase 1: Data layer
  → wordlist.ts (Set<string>)
  → tileConfig.ts
  → defaultRules.ts

Phase 2: Engine (pure logic, fully testable immediately)
  → wordValidator.ts
  → tileBag.ts
  → scoreCalculator.ts
  → roundManager.ts

Phase 3: AI Engine
  → easyAI.ts (simplest — short common words)
  → mediumAI.ts
  → hardAI.ts (most complex — defer if needed)

Phase 4: State layer
  → gameTypes.ts + gameActions.ts
  → gameReducer.ts (integrates all engine modules)
  → GameContext.tsx

Phase 5: UI Components
  → ConfigScreen (no game logic — just config)
  → GameBoard + PlayerHand (core interaction)
  → ScorePanel + OpponentHand (display only)

Phase 6: Polish
  → Animations (tile placement, elimination)
  → Web Worker for Hard AI (if jank observed)
```

## Sources

- Game Programming Patterns — State Pattern: https://gameprogrammingpatterns.com/state.html
- Game Programming Patterns — Game Loop: https://gameprogrammingpatterns.com/game-loop.html
- Board Game Logic in React (Medium): https://medium.com/@tylercmasterson/board-game-logic-in-react-199d6983fc23
- Building a Scrabble-like Word Game in React (freeCodeCamp): https://www.freecodecamp.org/news/how-i-built-a-react-game-with-react-dnd-and-react-flip-move-26300156a825/
- Word lists for computer word games: https://www.kith.org/words/2022/03/19/word-lists-for-writing-computer-word-games/
- JavaScript Trie Performance Analysis (John Resig): https://johnresig.com/blog/javascript-trie-performance-analysis/
- Finite State Machines in Game Development (Game Developer): https://www.gamedeveloper.com/programming/designing-a-simple-game-ai-using-finite-state-machines
- Blossom Word Game Technical Architecture: https://zprostudio.com/blossom-word-game/

---
*Architecture research for: browser-based tile word game (Word Chicken)*
*Researched: 2026-03-18*
