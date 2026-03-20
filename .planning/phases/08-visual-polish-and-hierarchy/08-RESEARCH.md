# Phase 8: Visual Polish and Hierarchy - Research

**Researched:** 2026-03-19
**Domain:** Tailwind v4 CSS, visual hierarchy, component layout polish
**Confidence:** HIGH

## Summary

Phase 8 is a targeted visual polish pass on five specific UI problems already identified and scoped. There are no new libraries to install, no new architecture patterns to introduce, and no external dependencies to resolve. Every fix is a surgical change to existing component CSS — changing Tailwind utility classes, widths, and structural patterns that are already in the codebase.

All five requirements are observable and testable via static source analysis (the same pattern used successfully in Phase 7 tests). The test strategy follows the established Phase 7 pattern: Vitest static-analysis tests that read component source files and assert the presence or absence of specific class strings. The existing test infrastructure in `src/__tests__/color-contrast.test.ts` is the model; Phase 8 adds a parallel `visual-polish.test.ts` file.

The RoundEndCard already uses the correct overlay pattern (`fixed inset-0 z-40 flex items-center justify-center bg-black/50 animate-fade-in`) matching GameOverScreen exactly — PLSH-05 needs no structural change, only a cosmetic alignment check.

**Primary recommendation:** Make five targeted class-level edits across four components. Add a `visual-polish.test.ts` with static-analysis assertions matching Phase 7 test patterns.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PLSH-01 | Turn indicator has clear visual dominance over round counter and Quit button in the top bar | TurnIndicator uses `text-sm` same size as context text; fix is to increase to `text-base` or `text-lg` with a heavier font-weight signal; round counter uses `text-[10px]` already small — gap needs widening |
| PLSH-02 | Score panel visually distinguishes round score (primary) from total score (secondary) | ScorePanel currently receives `roundScores` prop but ignores it (_roundScores). Round score must be displayed more prominently than total score |
| PLSH-03 | ChickenOMeter is wide enough to read as a tension indicator on mobile (32-40px vs current 20px) | Current width is `w-5` (20px). Target is `w-8` (32px) to `w-10` (40px) — a one-class change |
| PLSH-04 | Staged tiles have an unambiguous "taken" visual state in the player hand | Current staged state: same color (`concrete`) + `disabled` prop (opacity-50 + cursor-not-allowed). This is ambiguous — "slightly dim" is not "taken". Fix: use a visually distinct state (different bg, border, or a struck-through/faded look with a distinct color) |
| PLSH-05 | RoundEndCard displays as an overlay consistent with GameOverScreen styling | RoundEndCard already has `fixed inset-0 z-40 flex items-center justify-center bg-black/50 animate-fade-in` and `bg-card max-w-md w-full mx-4 p-8 rounded-2xl text-center shadow-2xl animate-scale-in` — IDENTICAL to GameOverScreen. Requirement is already met structurally; verify and confirm no regressions needed |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind CSS v4 | ^4.0.0 | All styling | Already in project; `@theme` tokens in index.css |
| React 19 | ^19.0.0 | Component rendering | Project foundation |
| Vitest | ^4.1.0 | Testing | Already in project; Phase 7 tests use it |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @testing-library/react | ^16.3.2 | Component testing | Available but NOT needed for Phase 8 — static analysis is sufficient |

**Installation:** No new packages needed. All dependencies are already present.

## Architecture Patterns

### Pattern 1: Tailwind v4 @theme Token System
**What:** All colors are CSS custom properties defined in `src/index.css` under `@theme {}`. Dark mode overrides in `.dark {}`.
**When to use:** All color references. Never use raw hex or hardcoded values.

Token map (HIGH confidence from index.css):
```css
/* src/index.css */
--color-corbusier-red: #d0021b;
--color-corbusier-blue: #003f91;
--color-corbusier-yellow: #f5a623;
--color-surface: #f2f0eb;       /* dark: #1c1c24 */
--color-card: #ffffff;           /* dark: #2a2a34 */
--color-ink: #3a3a3a;            /* dark: #e0ddd8 */
--color-ink-secondary: #6b6967;  /* dark: #a09e9a */
--color-accent-primary: #003f91; /* dark: #5b8de0 */
--color-accent-danger: #d0021b;  /* dark: #f07070 */
```

### Pattern 2: Phase 7 Static Analysis Test Style
**What:** Tests read component source files with `readFileSync` and assert on class string content.
**When to use:** When requirements are observable as CSS class presence/absence in source.

```typescript
// Source: src/__tests__/color-contrast.test.ts (verified in codebase)
import { readFileSync } from 'fs'
import { resolve, basename } from 'path'

const source = readFileSync(resolve(__dirname, '../components/ComponentName.tsx'), 'utf-8')
expect(source).toContain('w-8')       // assert presence
expect(source).not.toContain('w-5')   // assert absence
```

### Pattern 3: TileCard Disabled vs. Staged States
**What:** TileCard currently conflates "disabled" (grey, dim, no cursor) with "staged" (in staging area). These are semantically different — staged tiles are "taken" and should look claimed, not broken.
**Correct approach:** Add a `staged` visual variant either via a new `color` option in TileCard, or by passing a distinct CSS className override. The simplest path consistent with the component API is adding a `'staged'` entry to the `colorClasses` map in TileCard.tsx.

```typescript
// Current (ambiguous):
color={isStaged ? 'concrete' : isCommunity ? 'yellow' : 'concrete'}
disabled={isStaged}
// Both staged and un-staged hand tiles are 'concrete' — only opacity separates them

// Target (distinct visual state):
// Option A: New color variant 'staged' with visually distinct bg
// Option B: Pass className override for staged tiles
// Option C: Use a distinct existing color (e.g., 'blue' tinted) for staged state
```

### Recommended Project Structure
No new directories needed. All changes are in existing files:
```
src/
├── __tests__/
│   ├── color-contrast.test.ts    (existing, unchanged)
│   └── visual-polish.test.ts     (NEW — Phase 8 tests)
├── components/
│   ├── TurnIndicator.tsx          (PLSH-01 — text size/weight)
│   ├── ScorePanel.tsx             (PLSH-02 — show round scores)
│   ├── ChickenOMeter.tsx          (PLSH-03 — width w-5 → w-8)
│   ├── TileCard.tsx               (PLSH-04 — new staged color variant)
│   └── RoundEndCard.tsx           (PLSH-05 — verify, likely no change)
└── screens/
    └── PlayerHand.tsx             (PLSH-04 — use staged state)
```

### Anti-Patterns to Avoid
- **Inline styles for visual states:** Don't add `style={{ opacity: 0.3 }}` for staged tiles — use Tailwind utilities.
- **Text size alone for hierarchy:** Size is needed but font-weight reinforces dominance; use both.
- **Ignoring dark mode:** Any new color classes added (especially for staged tile state) must work in both light and dark mode — use `accent-primary`/`accent-danger`/`ink-secondary` tokens, not raw corbusier colors.
- **Breaking existing tests:** TileCard changes must not break COLR-03 test assertions about `text-charcoal` on yellow tiles.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Staged tile visual state | Custom CSS class / inline style animation | New entry in TileCard `colorClasses` map | Consistent with existing component API; respects dark mode tokens |
| Visual hierarchy signals | Font-size alone | Tailwind `text-base`/`text-lg` + `font-bold` + size contrast between elements | Both size AND weight signal dominance — size alone is weak |
| Overlay consistency | Rewriting RoundEndCard structure | Verify classes match GameOverScreen — likely already done | PLSH-05 is already structurally correct per code review |

**Key insight:** All five requirements are class-level CSS changes. No new components, no new hooks, no state changes.

## Common Pitfalls

### Pitfall 1: ScorePanel Round Score Data Is Already Received But Ignored
**What goes wrong:** Developer misses that `roundScores` is passed to ScorePanel but aliased as `_roundScores` and never rendered. PLSH-02 requires actually displaying it.
**Why it happens:** The prop was added when the data model was built but display was deferred.
**How to avoid:** The fix adds round score display — the data is already flowing in via `GameScreen.tsx` line 199.
**Warning signs:** If ScorePanel renders only total scores, PLSH-02 is not implemented.

### Pitfall 2: Staged Tile State Must Not Lose Touch Target
**What goes wrong:** Making a staged tile visually "taken" (e.g., adding `cursor-not-allowed` only) keeps `min-h-[44px] min-w-[44px]` but the user can't click to unstage. The PlayerHand logic uses `onClick={() => handleTileClick(idx)}` to toggle — so staged tiles still need to be clickable.
**Why it happens:** Confusion between "visually distinct" and "functionally disabled."
**How to avoid:** Staged tiles should look claimed (different color/border) but remain clickable. The `disabled` prop should be removed from staged tiles — or the `handleTileClick` already supports toggling (unstaging a staged tile). Review: `setStagedIndices` in PlayerHand handles the case `prev.indexOf(handIndex) !== -1` → removes it. So tiles must NOT be `disabled={true}` when staged — they need clicks to unstage.
**Warning signs:** Users cannot unstage a tile after tapping it.

### Pitfall 3: ChickenOMeter Width Change Affects Layout Flex Sizing
**What goes wrong:** Widening ChickenOMeter from `w-5` to `w-8` or `w-10` changes the right column width in the three-column layout in GameScreen. The left WordHistory column is `w-32 flex-shrink-0` and the ChickenOMeter is also `flex-shrink-0`. Widening it by 12-20px is safe given the existing `flex-1` center column absorbs the space.
**Why it happens:** Not accounting for flex layout impact of the width change.
**How to avoid:** The center `flex-1` column absorbs the delta — this change is safe. Verify on mobile (375px) that PlayerHand area doesn't become too narrow.

### Pitfall 4: TurnIndicator Dominance Requires Size AND Contrast Gap
**What goes wrong:** Simply increasing `text-sm` to `text-base` in TurnIndicator doesn't create enough visual dominance if the round counter is already small (`text-[10px]`).
**Why it happens:** The gap is already 10px vs 14px — doubling to 18-20px with bold weight makes the dominance clear.
**How to avoid:** The turn indicator should be `text-lg font-bold` or `text-xl font-bold` to create an obvious size gap vs the `text-[10px]` round counter and `text-xs` Quit button.

### Pitfall 5: PLSH-05 May Already Pass
**What goes wrong:** Developer implements unnecessary changes to RoundEndCard.
**Why it happens:** Reading requirements without checking current code.
**How to avoid:** RoundEndCard line 51-52 shows `fixed inset-0 z-40 flex items-center justify-center bg-black/50 animate-fade-in` and `bg-card max-w-md w-full mx-4 p-8 rounded-2xl text-center shadow-2xl animate-scale-in`. GameOverScreen line 51-52 shows identical classes. PLSH-05 is structurally already correct — the test should CONFIRM this, not require changes.

## Code Examples

Verified current state from source files:

### PLSH-01: Current TurnIndicator top bar structure (GameScreen.tsx lines 177-188)
```tsx
// Source: src/screens/GameScreen.tsx
<div className="relative flex items-center justify-center mb-3">
  <span className="absolute left-0 text-ink-secondary text-[10px] uppercase font-jost tracking-wider">
    R{round.roundNumber}
  </span>
  <TurnIndicator phase={phase} currentPlayerId={round.currentPlayerId} />
  <button
    className="absolute right-0 text-ink-secondary text-xs uppercase font-jost ..."
  >
    Quit
  </button>
</div>
```
Round counter: `text-[10px]` (10px). Quit: `text-xs` (12px). TurnIndicator: `text-sm` (14px) + `font-bold`.
Fix: TurnIndicator needs `text-lg` (18px) or `text-xl` (20px) to create unambiguous dominance.

### PLSH-02: Current ScorePanel (ignores roundScores)
```tsx
// Source: src/components/ScorePanel.tsx
export function ScorePanel({ totalScores, roundScores: _roundScores }: ScorePanelProps) {
  // _roundScores is received but never used — round scores not displayed
  const myScore = totalScores[localPlayerId] ?? 0
  ...
}
```
Fix: Display round score large/bold as primary, total score smaller as secondary context.

### PLSH-03: Current ChickenOMeter width
```tsx
// Source: src/components/ChickenOMeter.tsx line 17
className="relative h-48 sm:h-64 w-5 rounded-full overflow-hidden gradient-tension"
// w-5 = 20px. Change to w-8 (32px) or w-9 (36px)
```

### PLSH-04: Current staged tile state (PlayerHand.tsx lines 343-352)
```tsx
// Source: src/screens/PlayerHand.tsx
const isStaged = stagedIndices.includes(idx)
return (
  <div key={idx} style={entranceStyle(idx)}>
    <TileCard
      letter={letter}
      color={isStaged ? 'concrete' : isCommunity ? 'yellow' : 'concrete'}
      // isStaged → same color as unstaged hand tile
      size="md"
      onClick={() => handleTileClick(idx)}
      disabled={isStaged}  // Only visual: opacity-50 + cursor-not-allowed
    />
  </div>
)
```
Fix: staged tiles need a distinct `color` value (e.g., new `'staged'` variant) AND must remain clickable (remove `disabled={isStaged}`).

### PLSH-05: RoundEndCard vs GameOverScreen overlay classes (already matching)
```tsx
// RoundEndCard line 51-52:
<div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 animate-fade-in">
  <div className="bg-card max-w-md w-full mx-4 p-8 rounded-2xl text-center shadow-2xl animate-scale-in">

// GameOverScreen line 51-52:
<div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 animate-fade-in">
  <div className="bg-card max-w-md w-full mx-4 p-8 rounded-2xl text-center shadow-2xl animate-scale-in">
```
These are identical. PLSH-05 is already met — the test should assert this is true.

### TileCard colorClasses map (for adding staged variant)
```tsx
// Source: src/components/TileCard.tsx
const colorClasses = {
  red: 'bg-corbusier-red text-white shadow-md shadow-corbusier-red/30',
  blue: 'bg-corbusier-blue text-white shadow-md shadow-corbusier-blue/30',
  yellow: 'bg-corbusier-yellow text-charcoal shadow-md shadow-corbusier-yellow/30',
  concrete: 'bg-card text-ink border border-ink/10 shadow-sm',
  // Add: staged: 'bg-ink/10 text-ink-secondary border border-ink/30 shadow-sm'
  // Or use a cross-out / hatched appearance with a border change
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Inline style gradients with hex | CSS `@theme` token-based gradient utilities | Phase 7 | Consistent with design system |
| Opacity suffixes for semantic hierarchy | Token-based named colors (`ink-secondary`) | Phase 7 | Better dark mode support |

**Phase 8 change:** Move from "slightly dimmed" staged tile (opacity-50) to "distinctly claimed" staged tile (new color variant).

## Open Questions

1. **Exact staged tile visual treatment for PLSH-04**
   - What we know: The current `opacity-50 concrete` is confirmed ambiguous; a visually distinct treatment is needed
   - What's unclear: Whether to use a crossed-out border, a fill color change, or a badge/indicator
   - Recommendation: Use a new `colorClasses` entry in TileCard — `'staged': 'bg-ink/15 text-ink-secondary border-2 border-ink/40 shadow-none'` — gives a clearly "used/claimed" look without being invisible. This removes `disabled={isStaged}` so tiles remain clickable for unstaging.

2. **Round score display layout in ScorePanel (PLSH-02)**
   - What we know: `roundScores` prop is already passed in, just unused. Data is available.
   - What's unclear: Exact layout — should round scores be above/below/beside total, or should the panel have a two-row treatment?
   - Recommendation: Display round score as the larger primary number (e.g., `text-2xl font-bold`), total score below it as `text-sm text-ink-secondary` with a "Total: N" label. This creates an immediate visual hierarchy without requiring the player to read labels.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.0 |
| Config file | vite.config.ts (vitest config inline) |
| Quick run command | `npx vitest run src/__tests__/visual-polish.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PLSH-01 | TurnIndicator uses text-lg or text-xl (not text-sm) | unit (static) | `npx vitest run src/__tests__/visual-polish.test.ts` | ❌ Wave 0 |
| PLSH-02 | ScorePanel renders roundScores (not aliased as `_roundScores`) | unit (static) | `npx vitest run src/__tests__/visual-polish.test.ts` | ❌ Wave 0 |
| PLSH-03 | ChickenOMeter has w-8 or w-9 or w-10 (not w-5) | unit (static) | `npx vitest run src/__tests__/visual-polish.test.ts` | ❌ Wave 0 |
| PLSH-04 | PlayerHand staged tiles use a distinct color variant (not `isStaged ? 'concrete'`) | unit (static) | `npx vitest run src/__tests__/visual-polish.test.ts` | ❌ Wave 0 |
| PLSH-05 | RoundEndCard outer div has `fixed inset-0` and `bg-black/50` | unit (static) | `npx vitest run src/__tests__/visual-polish.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/__tests__/visual-polish.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/visual-polish.test.ts` — covers PLSH-01, PLSH-02, PLSH-03, PLSH-04, PLSH-05

## Sources

### Primary (HIGH confidence)
- Direct source read: `src/components/TurnIndicator.tsx` — current class audit
- Direct source read: `src/components/ScorePanel.tsx` — roundScores ignored confirmed
- Direct source read: `src/components/ChickenOMeter.tsx` — w-5 width confirmed
- Direct source read: `src/screens/PlayerHand.tsx` — staged tile color logic confirmed
- Direct source read: `src/components/RoundEndCard.tsx` — overlay classes confirmed matching GameOverScreen
- Direct source read: `src/components/GameOverScreen.tsx` — reference overlay structure
- Direct source read: `src/components/TileCard.tsx` — colorClasses API confirmed
- Direct source read: `src/__tests__/color-contrast.test.ts` — Phase 7 test pattern confirmed
- Direct source read: `src/index.css` — full token system confirmed

### Secondary (MEDIUM confidence)
- None needed — all findings based on direct source code analysis.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies, all tools already in use
- Architecture: HIGH — all five fixes identified with exact file/line locations
- Pitfalls: HIGH — derived from direct code analysis, not assumptions
- Test strategy: HIGH — mirrors exactly the Phase 7 test pattern already proven

**Research date:** 2026-03-19
**Valid until:** 2026-04-18 (stable, no external dependencies to go stale)
