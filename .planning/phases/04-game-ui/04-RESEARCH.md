# Phase 4: Game UI - Research

**Researched:** 2026-03-18
**Domain:** React component architecture, Tailwind v4 animations, localStorage persistence, FSM-driven UI
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Tile interaction & word building**
- Click/tap tiles from hand to build words in a staging area above the hand
- Tapped tiles move from hand to staging area; tap staged tile to remove it
- No keyboard typing input — tap/click only
- Submit button below staging area to confirm word
- Invalid submissions: staged tiles briefly shake and flash red, with small error text showing the reason
- AI thinking state: animated placeholder tiles ([?]) in staging area that cycle through random letters, resolving into the AI's word when done

**Shared word display**
- Large Corbusier-colored letter tiles displayed as a row at the top of the game area
- Word grows visually as letters are added each turn
- Tiles shrink slightly as the word gets longer to fit the viewport

**Chicken-o-meter**
- Vertical thermometer bar on the right side of the game area
- Fills from bottom to top as the word grows longer
- Color gradient: blue (short word / low tension) → yellow (medium) → red (long word / high tension)
- Purely abstract — no label, number, or icon
- Smooth CSS transition (~300ms) when the word grows

**Config screen**
- Stacked card selectors with Corbusier color coding
- Difficulty: three cards (Easy = blue / "Common words", Medium = yellow / "Broader vocabulary", Hard = red / "Full dictionary")
- Rules section below: toggle for plurals (S), selector for tile distribution (Bananagrams/Scrabble)
- Start Game button at bottom
- "How to Play" link on config screen opens a modal overlay with rules explanation and "Got It" dismiss button
- Settings persisted to localStorage — returning players see their previous selections
- Defaults: Medium difficulty, plurals banned, Bananagrams distribution

**Game length & round flow**
- Endless rounds — game continues until the player decides to stop
- Running score accumulates across rounds
- No round count selector needed

**Elimination**
- When a player is eliminated, their hand tiles scatter/fall off screen with animation
- Visually dramatic, reinforces the "you're out" moment

**Round end**
- Full-screen results card showing: round winner, word chain for that round, points earned, running total score
- "Next Round" button to continue

**Game over**
- Victory/defeat card with full stats: WIN or LOSS prominently displayed, final scores, per-round point breakdown, longest word played
- Two buttons: "Rematch" (same settings, new game) and "New Game" (returns to config screen)

### Claude's Discretion
- Word history display design and positioning
- Turn indicator styling (whose turn it is)
- Responsive layout breakpoints and mobile adaptations
- Exact tile sizes, spacing, and typography scale
- Loading skeleton for game initialization
- Tile scatter animation implementation approach
- How to handle the "quit game" action (button placement, confirmation)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UI-01 | Current word displayed prominently, updated each turn | SharedWordDisplay component wired to `gameState.round.currentWord` |
| UI-02 | Player's 9-tile hand displayed as clickable/tappable tiles | PlayerHand component with staging area; tiles from `round.players.human.hand` |
| UI-03 | Clear turn indicator showing whose turn it is (player vs AI) | Phase-derived indicator: HUMAN_TURN vs AI_THINKING, SETUP |
| UI-04 | Game over screen with win/loss result, score summary, and "play again" option | GAME_OVER phase renders GameOverScreen; dispatch RESET_GAME to return |
| UI-05 | Word history display showing the sequence of words and who played each turn | `round.turnHistory` array: `{ playerId, word, score }` — map to styled list |
| UI-06 | Tension ramp visualization ("chicken-o-meter") showing escalating pressure as the word grows | ChickenOMeter: `currentWord.length / MAX_WORD` → fill %, CSS gradient transition |
| UI-07 | Round start and round end transitions are visually clear | SETUP phase → prompt for starting word; ROUND_END phase → full-screen results card |
| CONF-01 | Pre-game screen to select AI difficulty (Easy/Medium/Hard) | ConfigScreen with 3 card selectors; persisted to localStorage |
| CONF-02 | Pre-game toggle for allowing/banning plurals (S) | Toggle component in ConfigScreen; stored in config state |
| CONF-03 | Pre-game selection of tile distribution (Bananagrams or Scrabble style) | Card selector in ConfigScreen; stored in config state |
| CONF-04 | Sensible defaults: Medium difficulty, plurals banned, Bananagrams distribution | localStorage read on mount; fall back to defaults if nothing stored |
| UX-01 | Keyboard input support — desktop users can type to select tiles | NOTE: CONTEXT.md overrides this — tap/click ONLY, no keyboard typing |
| UX-02 | "How to Play" modal explaining the rules for first-time players | Modal overlay triggered by link on ConfigScreen; dismissed with "Got It" |
| UX-03 | Responsive layout — playable on both desktop and mobile browsers | Tailwind responsive prefixes (sm:/md:); min-touch-target 44px for tiles |
| SCOR-03 | Running score is displayed during the game | ScorePanel reads `gameState.totalScores` live during play |
| SCOR-04 | End-of-round score summary shows points earned | RoundEnd card renders `gameState.roundScores` + `totalScores` |
</phase_requirements>

---

## Summary

Phase 4 wires a complete, playable UI on top of the engine (Phases 1-3). All game logic — validation, tile management, AI, scoring, FSM — is done. This phase is exclusively about React components that read from `useGameStore` / `useAppStore`, dispatch actions, and render the visual layer.

The project uses React 19, Tailwind v4, Zustand v5, and Vitest 4 with React Testing Library. No new runtime dependencies are needed: everything the UI requires is either already in package.json or achievable with pure CSS/Tailwind. The existing FSM (`TurnPhase`) maps cleanly to UI states — each phase value directly determines which UI to render, making the component logic straightforward conditional rendering.

The most complex per-plan work is (1) the Config screen with localStorage persistence and modal, (2) the GameBoard layout wiring the shared word, turn history, and chicken-o-meter, (3) the PlayerHand staging-area interaction with error animation, and (4) the score/game-over screens plus responsive layout. Each plan is independently testable because the store can be seeded with arbitrary `GameState` before render.

**Primary recommendation:** Drive all UI from `gameState.phase` — each TurnPhase maps to a distinct render branch; use local React state only for ephemeral UI (staged tiles, modal open/closed, shake animation trigger).

---

## Standard Stack

### Core (already installed — no new dependencies needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.0 | Component rendering | Project foundation |
| Tailwind v4 | 4.0 | Utility styling + animations | Project standard; @theme already defines Corbusier palette |
| Zustand | 5.0 | Global game state | Already used for appSlice, dictionarySlice, gameSlice |
| Vitest | 4.1 | Unit + integration tests | Project test framework |
| @testing-library/react | 16.3 | Component rendering in tests | Already in devDependencies |
| @testing-library/user-event | 14.6 | Simulating clicks/taps | Already in devDependencies |

### No New Dependencies Required

All UI features are achievable with existing stack:
- CSS animations (shake, scatter, slot-machine): Tailwind `@keyframes` in `index.css` or inline `style` prop
- localStorage: Native browser API
- Modal overlay: Pure Tailwind `fixed inset-0 z-50` pattern
- Smooth transitions: Tailwind `transition-all duration-300`
- Responsive layout: Tailwind responsive prefixes (`sm:`, `md:`)

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS @keyframes for animations | Framer Motion | Framer Motion adds ~25KB; native CSS is sufficient for shake + scatter effects |
| Native localStorage | Zustand persist middleware | Middleware adds complexity; direct `localStorage.getItem/setItem` is clearer for small config object |
| Tailwind gradient utilities | Canvas / SVG | Canvas/SVG overkill for a 1D fill bar; `bg-gradient-to-t` + height % achieves the chicken-o-meter |

---

## Architecture Patterns

### Recommended Component Structure

```
src/
├── screens/
│   ├── ConfigScreen.tsx         # Game config + "How to Play" link (CONF-01–04, UX-02)
│   └── GameScreen.tsx           # Top-level game orchestrator (mounts useAI hook)
├── components/
│   ├── HowToPlayModal.tsx       # Modal overlay (UX-02)
│   ├── SharedWordDisplay.tsx    # Large letter row at top (UI-01)
│   ├── ChickenOMeter.tsx        # Vertical fill bar on right (UI-06)
│   ├── WordHistory.tsx          # Turn-by-turn word log (UI-05)
│   ├── TurnIndicator.tsx        # Whose turn it is (UI-03)
│   ├── PlayerHand.tsx           # Tile rack + staging area (UI-02)
│   ├── StagingArea.tsx          # Staged tiles + Submit button
│   ├── TileCard.tsx             # Single reusable tile (hand / shared word / history)
│   ├── ScorePanel.tsx           # Running scores (SCOR-03)
│   ├── RoundEndCard.tsx         # Full-screen round results (UI-07, SCOR-04)
│   └── GameOverScreen.tsx       # Win/loss final screen (UI-04)
└── store/
    ├── appSlice.ts              # Screen navigation (extend with GameConfig)
    ├── dictionarySlice.ts       # Dictionary loading
    └── gameSlice.ts             # Game FSM state
```

### Pattern 1: Phase-Driven Render Branching

**What:** `GameScreen` renders different sub-views based on `gameState.phase`. No separate router needed.
**When to use:** Any component that changes behavior based on `TurnPhase`.

```typescript
// GameScreen.tsx — drives all view switching
const phase = useGameStore(s => s.gameState?.phase)

if (!gameState) return <LoadingSkeleton />

switch (phase) {
  case 'SETUP':    return <SetupView />    // Starting word entry
  case 'HUMAN_TURN': return <PlayView />  // Main gameplay
  case 'AI_THINKING': return <PlayView /> // Same layout, PlayerHand locked
  case 'ROUND_END': return <RoundEndCard />
  case 'GAME_OVER': return <GameOverScreen />
}
```

### Pattern 2: Local State for Ephemeral UI Only

**What:** Use `useState` only for things that don't belong in global store (staging area contents, modal open, shake animation trigger).
**When to use:** Any interaction that is purely visual and doesn't affect game logic.

```typescript
// PlayerHand.tsx
const [staged, setStaged] = useState<string[]>([])  // tiles moved to staging
const [error, setError] = useState<string | null>(null)
const [shaking, setShaking] = useState(false)

function triggerShake() {
  setShaking(true)
  setTimeout(() => setShaking(false), 500)
}
```

### Pattern 3: Zustand Selector Granularity

**What:** Subscribe to the minimum slice of state each component needs. Avoids re-renders when unrelated state changes.

```typescript
// Fine-grained selectors — preferred
const currentWord = useGameStore(s => s.gameState?.round.currentWord ?? '')
const humanHand   = useGameStore(s => s.gameState?.round.players['human']?.hand ?? [])
const phase       = useGameStore(s => s.gameState?.phase)
```

### Pattern 4: localStorage Config Persistence

**What:** Read config on ConfigScreen mount; write on any config change. Use a local state object in ConfigScreen, persist it to localStorage and also store it in appSlice or a new configSlice before navigating to the game.

```typescript
const STORAGE_KEY = 'word-chicken-config'

function loadConfig(): StoredConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : DEFAULT_CONFIG
  } catch {
    return DEFAULT_CONFIG
  }
}

function saveConfig(cfg: StoredConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg))
}
```

**IMPORTANT:** `GameConfig.dictionary` (a `Set<string>`) must NOT be stored in localStorage. Persist only `{ difficulty, banPluralS, tileDistribution }` — the dictionary comes from `useDictionaryStore`.

### Pattern 5: Chicken-O-Meter Fill Calculation

**What:** Derive fill percentage from current word length. The max tension point (word length where meter is full / red) should be set to a playable number — around 12–15 letters works for Word Chicken.

```typescript
const MAX_TENSION_LENGTH = 15  // word this long = full red bar

function tensionPercent(wordLength: number): number {
  return Math.min(100, (wordLength / MAX_TENSION_LENGTH) * 100)
}

// In ChickenOMeter.tsx
<div
  className="w-4 rounded-t transition-all duration-300"
  style={{
    height: `${tensionPercent(currentWord.length)}%`,
    background: `linear-gradient(to top, #003f91, #f5a623, #d0021b)`,
    // backgroundPositionY drives the color — clip via height
  }}
/>
```

Better approach: fixed-height gradient container, clip inner bar from bottom.

```typescript
// Outer container: full height, gradient background
// Inner mask: white overlay that shrinks from top as tension rises
// This avoids gradient shift as bar grows
<div className="relative h-full w-4 bg-gradient-to-t from-corbusier-blue via-corbusier-yellow to-corbusier-red rounded">
  <div
    className="absolute top-0 left-0 right-0 bg-concrete transition-all duration-300"
    style={{ height: `${100 - tensionPercent(currentWord.length)}%` }}
  />
</div>
```

### Pattern 6: Tile Scatter Animation (Elimination)

**What:** On elimination, set a local `eliminated` flag; each tile receives a random `transform` + `opacity: 0` transition via inline style. Remove from DOM after transition ends.

```typescript
// In PlayerHand.tsx
const [eliminating, setEliminating] = useState(false)

// When phase changes to ROUND_END and this player was eliminated:
useEffect(() => {
  if (playerEliminated) setEliminating(true)
}, [playerEliminated])

// Per-tile style when eliminating
const tileStyle = eliminating ? {
  transform: `translate(${randomX()}px, ${randomY()}px) rotate(${randomDeg()}deg)`,
  opacity: 0,
  transition: 'all 0.6s ease-in',
} : {}
```

### Pattern 7: AI Thinking Slot-Machine Animation

**What:** During `AI_THINKING` phase, the staging area shows animated placeholder tiles cycling through random letters. Use `setInterval` in a `useEffect` to cycle displayed letters; clear interval when phase changes.

```typescript
const LETTERS = 'ABCDEFGHIJKLMNOPRSTUW'
const [displayLetters, setDisplayLetters] = useState<string[]>([])

useEffect(() => {
  if (phase !== 'AI_THINKING') return
  const interval = setInterval(() => {
    setDisplayLetters(prev => prev.map(() =>
      LETTERS[Math.floor(Math.random() * LETTERS.length)]
    ))
  }, 80)
  return () => clearInterval(interval)
}, [phase])
```

### Anti-Patterns to Avoid

- **Storing dictionary in localStorage:** `Set<string>` is 5MB+; breaks JSON.stringify silently. Only persist `{ difficulty, banPluralS, tileDistribution }`.
- **Deriving game state in components:** Never re-validate a word in a component. Trust the reducer. Show errors only from state, not component-level checks.
- **Sharing staged tiles in global store:** Staging area is ephemeral UI state. Putting it in Zustand causes unnecessary re-renders and complicates the game state model.
- **Animating via JavaScript timers for CSS transitions:** Use CSS `transition` with Tailwind for smooth 300ms changes. Only use `setInterval` for the slot-machine effect that requires programmatic letter cycling.
- **Using `useEffect` for derived values:** Compute `tensionPercent`, `currentPlayerName`, `isHumanTurn` etc. directly during render — not in effects.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Modal overlay | Custom portal/DOM injection | Tailwind `fixed inset-0 z-50 bg-black/50` | Portals add complexity; Tailwind fixed positioning works cleanly for a single modal |
| State persistence | Custom serialization | `localStorage.getItem/setItem` with `JSON.parse/stringify` | Config is a flat 3-field object; no library needed |
| Touch event handling | Custom pointer event logic | Standard `onClick` handler | React 19 handles both click and touch via onClick; no need for separate touch events |
| Responsive grid | Custom CSS grid math | Tailwind `grid grid-cols-5 sm:grid-cols-9` | Tailwind responsive utilities handle tile rack layout |
| Shake animation | JS-driven position oscillation | CSS `@keyframes shake` in `index.css` | CSS animation is GPU-accelerated; JS oscillation is janky |

**Key insight:** This is a pure React/Tailwind/CSS phase. The game logic is done. Every visual pattern here is achievable without any new package — adding libraries would create more maintenance surface than value.

---

## Common Pitfalls

### Pitfall 1: Config-to-Game State Handoff

**What goes wrong:** The `GameConfig` includes `dictionary: Set<string>` which must come from `useDictionaryStore`, but the user's config choices (difficulty, banPluralS, distribution) come from the ConfigScreen. These are merged at "Start Game" press.
**Why it happens:** Two sources of truth converge at one moment.
**How to avoid:** In ConfigScreen's "Start Game" handler, read `useDictionaryStore.getState().words` directly (not via hook) to construct the full `GameConfig`, then dispatch `START_GAME`:

```typescript
function handleStartGame() {
  const dictionary = useDictionaryStore.getState().words
  dispatch({
    type: 'START_GAME',
    config: { difficulty, banPluralS, tileDistribution, dictionary }
  })
  setScreen('game')
}
```

### Pitfall 2: UX-01 vs CONTEXT.md Conflict

**What goes wrong:** REQUIREMENTS.md specifies UX-01 "keyboard input support." CONTEXT.md's locked decision is "No keyboard typing input — tap/click only."
**Why it happens:** The user explicitly overrode UX-01 during the discuss-phase.
**How to avoid:** Do NOT implement keyboard tile-selection. UX-01 is satisfied by the locked decision (click/tap is the input method). Document this in the plan.

### Pitfall 3: Re-render Storm from Coarse Zustand Selectors

**What goes wrong:** Subscribing to the entire `gameState` object causes every component to re-render on every action, including AI turns and tile draws that only affect a subset of state.
**Why it happens:** Object reference changes on every Zustand update.
**How to avoid:** Use fine-grained selectors (`s => s.gameState?.round.currentWord`) — see Pattern 3 above.

### Pitfall 4: Stale Staged Tiles After Round Transition

**What goes wrong:** Player has tiles in the staging area when the round ends (e.g., AI gets eliminated mid-composition). Staged tiles persist as local state when the new round starts.
**Why it happens:** Local `useState` for staged tiles doesn't reset when game state changes.
**How to avoid:** Include `gameState?.round.roundNumber` in a `useEffect` dependency that calls `setStaged([])`.

```typescript
useEffect(() => {
  setStaged([])
  setError(null)
}, [gameState?.round.roundNumber, gameState?.phase])
```

### Pitfall 5: Submit with Empty Staging Area

**What goes wrong:** Player clicks Submit with no staged tiles; reducer rejects the empty string silently, leaving the UI in a confusing state.
**Why it happens:** The reducer's `validateTurn` on an empty staged word returns `not_a_word`.
**How to avoid:** Disable the Submit button when `staged.length === 0`. Never dispatch on empty staging.

### Pitfall 6: Tile Deduplication in Hand

**What goes wrong:** Player hand can have duplicate letters (e.g., two E's). Clicking one E should move that instance — not all E's — to staging. Identifying tiles by value alone causes both to highlight or deselect.
**Why it happens:** Array items identified by value, not index.
**How to avoid:** Track staged tiles as **indices** into the hand array, not letter values.

```typescript
const [stagedIndices, setStagedIndices] = useState<number[]>([])

function handleTileClick(idx: number) {
  setStagedIndices(prev =>
    prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
  )
}
```

---

## Code Examples

### Shake Animation (CSS + Tailwind)

```css
/* src/index.css — add to existing file */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-6px); }
  40%       { transform: translateX(6px); }
  60%       { transform: translateX(-4px); }
  80%       { transform: translateX(4px); }
}

.animate-shake {
  animation: shake 0.4s ease-in-out;
}
```

```typescript
// Usage in PlayerHand.tsx
<div className={`flex gap-2 ${shaking ? 'animate-shake' : ''}`}>
  {staged.map(...)}
</div>
```

### TileCard Component

```typescript
interface TileCardProps {
  letter: string          // Single char; 'Q' renders as 'Qu'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  color?: 'red' | 'blue' | 'yellow' | 'concrete'
  disabled?: boolean
}

export function TileCard({ letter, size = 'md', onClick, color = 'concrete', disabled }: TileCardProps) {
  const display = letter === 'Q' ? 'Qu' : letter
  const sizeClass = { sm: 'w-8 h-8 text-sm', md: 'w-10 h-10 text-base', lg: 'w-12 h-12 text-lg' }[size]
  const colorClass = {
    red: 'bg-corbusier-red text-white',
    blue: 'bg-corbusier-blue text-white',
    yellow: 'bg-corbusier-yellow text-white',
    concrete: 'bg-concrete text-charcoal',
  }[color]

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${sizeClass} ${colorClass} font-jost font-bold uppercase flex items-center justify-center`}
    >
      {display}
    </button>
  )
}
```

### HowToPlay Modal Pattern

```typescript
// Modal uses Tailwind fixed overlay — no portal needed
{isOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="bg-white max-w-md w-full mx-4 p-6">
      <h2 className="font-jost font-bold uppercase tracking-widest text-2xl mb-4">
        How to Play
      </h2>
      {/* rules content */}
      <button
        onClick={() => setIsOpen(false)}
        className="mt-6 bg-corbusier-blue text-white font-jost font-bold uppercase px-6 py-2"
      >
        Got It
      </button>
    </div>
  </div>
)}
```

### Word History Item

```typescript
// round.turnHistory: Array<{ playerId: string; word: string; score: number }>
{turnHistory.map((entry, i) => (
  <div key={i} className="flex items-center gap-3 py-1">
    <span className={`text-xs font-jost uppercase ${entry.playerId === 'human' ? 'text-corbusier-blue' : 'text-corbusier-red'}`}>
      {entry.playerId === 'human' ? 'You' : 'AI'}
    </span>
    <span className="font-jost font-bold tracking-wider text-charcoal">{entry.word}</span>
    <span className="text-xs text-concrete ml-auto">+{entry.score}</span>
  </div>
))}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind v3 `theme.extend` in tailwind.config.js | Tailwind v4 `@theme` directive in CSS | v4.0 (2024) | Colors defined in `index.css` — no tailwind.config.js |
| React class components for complex local state | React hooks (`useState`, `useEffect`, `useReducer`) | React 16.8+ | All component logic uses hooks |
| `localStorage` via Zustand persist middleware | Direct `localStorage` API | N/A | Config is simple 3-field object; middleware adds unnecessary complexity |
| `e.preventDefault()` for touch events | `onClick` handles both mouse and touch | React 19 | No separate `onTouchStart` needed |

**Deprecated/outdated:**
- `react-modal` or similar packages: Not needed for a single HowToPlay modal; pure Tailwind overlay is lighter.
- `classnames` / `clsx`: Not needed with Tailwind v4's utility composition; use template literals for conditional classes.

---

## Open Questions

1. **GAME_OVER trigger — who decides?**
   - What we know: The FSM has a `GAME_OVER` phase in the type definition, but the reducer never transitions to it (no `GAME_OVER` action exists).
   - What's unclear: Is the game endless (per CONTEXT.md: "endless rounds") or does the human decide to quit?
   - Recommendation: Implement a "End Game" / "Quit" button in GameScreen that dispatches `RESET_GAME` (returns to config screen). The `GAME_OVER` phase may be vestigial — verify with gameReducer.ts before plan execution. The CONTEXT.md game-over screen with WIN/LOSS may only be reachable if a "quit" button is added.

2. **Round winner determination after ELIMINATE_PLAYER**
   - What we know: `ELIMINATE_PLAYER` sets phase to `ROUND_END` when only one active player remains. The `NEXT_ROUND` action requires `winnerId`.
   - What's unclear: The UI must determine `winnerId` from `round.activePlayers[0]` after elimination to pass to `NEXT_ROUND`.
   - Recommendation: In `RoundEndCard`, derive `winnerId = round.activePlayers[0]` and pass to the "Next Round" dispatch.

3. **Shared word tile shrinkage implementation**
   - What we know: Tiles should "shrink slightly as the word gets longer to fit the viewport."
   - What's unclear: At what length does shrinking start? How much? Fixed size steps or continuous scale?
   - Recommendation: Use CSS `transform: scale()` driven by word length thresholds: length ≤ 7 = `scale(1)`, 8-11 = `scale(0.85)`, 12+ = `scale(0.7)`. Apply to the container, not individual tiles.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `vite.config.ts` (test section with `globals: true`, `environment: jsdom`) |
| Quick run command | `npx vitest run --reporter=verbose src/` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UI-01 | SharedWordDisplay renders `currentWord` | unit | `npx vitest run src/components/__tests__/SharedWordDisplay.test.tsx` | ❌ Wave 0 |
| UI-02 | PlayerHand renders tiles, staging area works | unit | `npx vitest run src/components/__tests__/PlayerHand.test.tsx` | ❌ Wave 0 |
| UI-03 | TurnIndicator shows correct player for each phase | unit | `npx vitest run src/components/__tests__/TurnIndicator.test.tsx` | ❌ Wave 0 |
| UI-04 | GameOverScreen renders with RESET_GAME dispatch | unit | `npx vitest run src/components/__tests__/GameOverScreen.test.tsx` | ❌ Wave 0 |
| UI-05 | WordHistory renders turnHistory entries | unit | `npx vitest run src/components/__tests__/WordHistory.test.tsx` | ❌ Wave 0 |
| UI-06 | ChickenOMeter fill % matches word length | unit | `npx vitest run src/components/__tests__/ChickenOMeter.test.tsx` | ❌ Wave 0 |
| UI-07 | RoundEndCard renders on ROUND_END phase | unit | `npx vitest run src/components/__tests__/RoundEndCard.test.tsx` | ❌ Wave 0 |
| CONF-01–04 | ConfigScreen renders options, defaults, persists | unit | `npx vitest run src/screens/__tests__/ConfigScreen.test.tsx` | ❌ Wave 0 |
| UX-02 | HowToPlayModal opens and dismisses | unit | `npx vitest run src/components/__tests__/HowToPlayModal.test.tsx` | ❌ Wave 0 |
| UX-03 | Layout classes present at mobile breakpoint | smoke | `npx vitest run src/screens/__tests__/GameScreen.test.tsx` | ❌ Wave 0 |
| SCOR-03 | ScorePanel shows totalScores during game | unit | `npx vitest run src/components/__tests__/ScorePanel.test.tsx` | ❌ Wave 0 |
| SCOR-04 | RoundEndCard shows roundScores + totalScores | unit | (same as UI-07 test file) | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/` (all tests, ~5s)
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/__tests__/` — directory (covers UI-01–07, SCOR-03–04, UX-02)
- [ ] `src/screens/__tests__/ConfigScreen.test.tsx` — covers CONF-01–04
- [ ] `src/screens/__tests__/GameScreen.test.tsx` — covers UX-03, phase-switching
- [ ] `src/components/__tests__/PlayerHand.test.tsx` — covers UI-02 (tile staging interaction)

---

## Sources

### Primary (HIGH confidence)

- Existing source code (`src/types/game.ts`, `src/lib/gameReducer.ts`, `src/store/gameSlice.ts`) — FSM actions, state shape, store patterns
- Existing source code (`src/index.css`, `vite.config.ts`) — Tailwind v4 @theme setup, Vitest config
- Existing source code (`src/hooks/useAI.ts`) — rAF pattern, store access pattern
- Existing test (`src/__tests__/App.test.tsx`) — Testing pattern: `useGameStore.setState`, render, userEvent

### Secondary (MEDIUM confidence)

- CONTEXT.md (2026-03-18) — User locked decisions verified against existing code patterns

### Tertiary (LOW confidence)

- None — all research is grounded in the existing codebase directly

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified from `package.json` and existing imports
- Architecture: HIGH — patterns derived directly from existing code conventions and FSM shape
- Pitfalls: HIGH — identified from direct code inspection (e.g., dictionary not serializable, tile index deduplication)
- Component structure: HIGH — driven by locked CONTEXT.md decisions and existing screen placeholders

**Research date:** 2026-03-18
**Valid until:** 2026-04-17 (stable stack — React 19, Tailwind v4, Zustand v5 all stable releases)
