# Phase 4: Game UI - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

All browser-facing components that make the game playable: config screen with game options, gameplay screen with tile interaction and word building, chicken-o-meter tension visualization, word history, score display, round transitions, game-over results, and responsive layout. The game engine (validator, tile bag, scorer, round manager) and AI opponent are already built in prior phases — this phase wires them into a complete, playable UI.

</domain>

<decisions>
## Implementation Decisions

### Tile interaction & word building
- Click/tap tiles from hand to build words in a staging area above the hand
- Tapped tiles move from hand to staging area; tap staged tile to remove it
- No keyboard typing input — tap/click only
- Submit button below staging area to confirm word
- Invalid submissions: staged tiles briefly shake and flash red, with small error text showing the reason
- AI thinking state: animated placeholder tiles ([?]) in staging area that cycle through random letters, resolving into the AI's word when done

### Shared word display
- Large Corbusier-colored letter tiles displayed as a row at the top of the game area
- Word grows visually as letters are added each turn
- Tiles shrink slightly as the word gets longer to fit the viewport

### Chicken-o-meter
- Vertical thermometer bar on the right side of the game area
- Fills from bottom to top as the word grows longer
- Color gradient: blue (short word / low tension) → yellow (medium) → red (long word / high tension)
- Purely abstract — no label, number, or icon
- Smooth CSS transition (~300ms) when the word grows

### Config screen
- Stacked card selectors with Corbusier color coding
- Difficulty: three cards (Easy = blue / "Common words", Medium = yellow / "Broader vocabulary", Hard = red / "Full dictionary")
- Rules section below: toggle for plurals (S), selector for tile distribution (Bananagrams/Scrabble)
- Start Game button at bottom
- "How to Play" link on config screen opens a modal overlay with rules explanation and "Got It" dismiss button
- Settings persisted to localStorage — returning players see their previous selections
- Defaults: Medium difficulty, plurals banned, Bananagrams distribution

### Game length & round flow
- Endless rounds — game continues until the player decides to stop
- Running score accumulates across rounds
- No round count selector needed

### Elimination
- When a player is eliminated, their hand tiles scatter/fall off screen with animation
- Visually dramatic, reinforces the "you're out" moment

### Round end
- Full-screen results card showing: round winner, word chain for that round, points earned, running total score
- "Next Round" button to continue

### Game over
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

</decisions>

<specifics>
## Specific Ideas

- Difficulty cards colored to match Corbusier palette: Easy=blue, Medium=yellow, Hard=red — the color itself communicates intensity
- AI thinking animation should feel alive — tiles cycling through random letters before resolving, like a slot machine settling
- Tile scatter on elimination should feel physical — tiles falling or flying off screen, not just fading
- The chicken-o-meter should be ambient, not demanding attention — it builds subconscious tension through color shift

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useAppStore` (Zustand): Screen navigation (`config` | `game`), can be extended with game config state
- `useDictionaryStore` (Zustand): Dictionary loading with status states (`idle`, `loading`, `loaded`, `error`)
- Tailwind v4 theme: Corbusier colors (`corbusier-red`, `corbusier-blue`, `corbusier-yellow`, `concrete`, `charcoal`), Jost font
- `ConfigScreen` placeholder: exists at `src/screens/ConfigScreen.tsx`, ready to be fleshed out
- `GameScreen` placeholder: exists at `src/screens/GameScreen.tsx`, ready to be fleshed out

### Established Patterns
- Zustand stores with `create()` and selector pattern (`useAppStore((s) => s.screen)`)
- Tailwind utility classes for styling (no CSS modules or styled-components)
- Font: Jost with `font-bold uppercase tracking-widest` for headings
- Color blocking: bold primary colors on white text for buttons/tiles

### Integration Points
- Engine modules to wire in: `wordValidator`, `tileBag`, `scoreCalculator`, `roundManager`, `startingWords`
- Types: `PlayerState`, `RoundState`, `TurnValidationResult`, `StartingWordResult`, `ValidationConfig`
- Phase 3 will add: GameReducer FSM (`GameState`, `TurnPhase`, actions), AIEngine module, `useAI` hook
- App.tsx screen routing: currently `config` | `game` via `useAppStore`
- Dictionary available via `useDictionaryStore` once loaded

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-game-ui*
*Context gathered: 2026-03-18*
