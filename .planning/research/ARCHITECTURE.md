# Architecture Research

**Domain:** UX/design audit — Tailwind v4 + React SPA (Word Chicken v1.1)
**Researched:** 2026-03-18
**Confidence:** HIGH — based on direct codebase reading + official Tailwind v4 docs

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     App (root shell)                             │
│  bg-surface min-h-screen font-jost [dark class toggle]          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ ConfigScreen │  │ LobbyScreen  │  │     GameScreen        │   │
│  │ min-h-screen │  │ min-h-screen │  │  flex flex-col        │   │
│  │ scrollable   │  │ scrollable   │  │  min-h-screen         │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│                                             │                    │
│                          ┌──────────────────┼──────────────┐    │
│                    ┌─────────┐       ┌──────────┐   ┌────────┐  │
│                    │ Top bar │       │ Middle   │   │ Overlay│  │
│                    │ flex-   │       │ flex-1   │   │ Cards  │  │
│                    │ shrink-0│       │ gap-4    │   │(fixed) │  │
│                    └─────────┘       └──────────┘   └────────┘  │
│                                          │                       │
│                          ┌───────────────┼──────────────┐        │
│                    ┌──────────┐  ┌────────────┐  ┌──────────┐   │
│                    │WordHist. │  │ PlayerHand │  │Chicken-O-│   │
│                    │sm:block  │  │ flex-1     │  │Meter     │   │
│                    │hidden    │  │ justify-end│  │flex-shrink│  │
│                    └──────────┘  └────────────┘  └──────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                       Zustand Stores                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ appSlice │  │gameSlice │  │multiplayer   │  │dictionary  │  │
│  │(screen,  │  │(gameState│  │(role, code,  │  │(words Set, │  │
│  │ darkMode)│  │ dispatch)│  │ status)      │  │ status)    │  │
│  └──────────┘  └──────────┘  └──────────────┘  └────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Responsibilities

| Component | Responsibility | Layout Role | Change Classification |
|-----------|---------------|-------------|----------------------|
| `App` | Dark mode class, screen routing, session restore | Root shell: `min-h-screen bg-surface` | **Structural** — switch to `h-svh flex flex-col` |
| `GameScreen` | Game orchestration, phase routing, multiplayer overlays | Full-screen flex column | **Structural** — inherit height from App, add `min-h-0` |
| `ConfigScreen` | Game config form, start buttons | Full-screen scrollable page | **Structural** — switch to `flex-1 overflow-y-auto` |
| `LobbyScreen` | P2P lobby creation/join, connection status | Full-screen scrollable page | **Structural** — switch to `flex-1 overflow-y-auto` |
| `TurnIndicator` | Whose-turn badge (top bar center) | Inline flex, absolute siblings | **Class tweak** — spacing/size audit |
| `SharedWordDisplay` | Current word as yellow tile row | Flex row, wraps on overflow | **Class tweak** — padding/rounding audit |
| `ScorePanel` | You vs AI/Them score comparison | Inline flex row | **Class tweak** — visual hierarchy |
| `WordHistory` | Per-turn word list | `hidden sm:block`, fixed `w-32` | **Class tweak** — max-height |
| `PlayerHand` | Tile selection, staging, submit, hint/give-up | `flex-1 flex-col justify-end pb-8` | **Structural** — fix justify-end on short viewports |
| `StagingArea` | Staged tiles + submit button | Stacked flex column inside PlayerHand | **Class tweak** — submit button prominence |
| `TileCard` | Individual tile button | Fixed size, `min-w-[44px] min-h-[44px]` | **Token fix** — yellow contrast |
| `ChickenOMeter` | Tension bar + word length label | `h-48 sm:h-64`, fixed width | **Token fix** — hardcoded hex gradient |
| `RoundEndCard` | Round result overlay (fixed inset-0) | Modal | **Class tweak** — short-viewport scroll |
| `GameOverScreen` | Game result overlay (fixed inset-0) | Modal | **Class tweak** — same |
| `HowToPlayModal` | Rules overlay (fixed inset-0) | Modal | **Class tweak** — animation, rounding |

---

## Current Layout Architecture: Diagnosed Problems

### Problem 1: Double min-h-screen, viewport not inherited

Both `App` and every screen (`ConfigScreen`, `LobbyScreen`, `GameScreen`) declare `min-h-screen`. `App` uses `min-h-screen` but does not pass height to children. Screens declare their own `min-h-screen`, so they always expand to at least the large viewport height — but on mobile, browser chrome (address bar) reduces visible space below 100vh. Content clusters at top or gets clipped below chrome.

**Current (broken on mobile):**
```tsx
// App.tsx — does not give height to children
<div className="bg-surface min-h-screen font-jost">
  <GameScreen />
</div>

// GameScreen.tsx — declares its own full height independently
<div className="flex flex-col min-h-screen bg-gradient-to-b ... p-2 sm:p-4">
```

**Fixed pattern:**
```tsx
// App.tsx — owns the viewport
<div className={`h-svh flex flex-col bg-surface font-jost overflow-hidden ${darkMode ? 'dark' : ''}`}>
  <GameScreen />
</div>

// GameScreen.tsx — fills the space App provides
<div className="flex flex-col flex-1 overflow-hidden bg-gradient-to-b ... p-2 sm:p-4">
```

### Problem 2: flex-1 middle section missing min-h-0

`GameScreen` has a `flex flex-1 gap-4` container holding WordHistory, PlayerHand, and ChickenOMeter. This is correct, but without `min-h-0`, flex children cannot shrink below their content size. On short viewports (iPhone SE: 667px height), the PlayerHand's tiles overflow instead of fitting within available space.

**Current:**
```tsx
<div className="flex flex-1 gap-4">
```

**Fixed:**
```tsx
<div className="flex flex-1 min-h-0 gap-4">
```

`min-h-0` is also needed on `PlayerHand`'s inner column (`flex flex-col flex-1 items-center justify-end`) to allow it to scroll or constrain its content.

### Problem 3: PlayerHand uses justify-end which pushes content to viewport bottom

`PlayerHand` renders inside a `flex-1 flex-col items-center justify-end pb-8` wrapper inside `GameScreen`. This means tiles always pin to the bottom edge of the available space. On desktop this is fine; on a short mobile viewport the staging area + tiles + action buttons stack vertically and can exceed the available height with no scrolling.

The fix depends on audit of the actual total height of the PlayerHand content stack (StagingArea + tile rows + action buttons). Options:
1. Change `justify-end` to `justify-center` if content is shorter than available space
2. Add `overflow-y-auto` on PlayerHand's wrapper to allow scrolling when tight

### Problem 4: Yellow tile contrast fails WCAG AA

`TileCard` with `color="yellow"` renders `bg-corbusier-yellow text-white`. Corbusier yellow (`#f5a623`) with white text has a contrast ratio of approximately 2.1:1 — well below WCAG AA (4.5:1 for normal text, 3:1 for large/bold). The Medium difficulty button in ConfigScreen has the same issue.

The fix is to change yellow-tile text to dark ink (`text-charcoal` or `text-ink`). Yellow is light enough that dark text reads well against it.

**Current:**
```tsx
yellow: 'bg-corbusier-yellow text-white shadow-md shadow-corbusier-yellow/30',
```

**Fixed:**
```tsx
yellow: 'bg-corbusier-yellow text-charcoal shadow-md shadow-corbusier-yellow/30',
```

`--color-charcoal: #3a3a3a` is already in `@theme`, giving a contrast ratio of approximately 7.5:1.

### Problem 5: ChickenOMeter gradient bypasses the token system

The gradient is hardcoded as an inline `style={}`:
```tsx
style={{ background: 'linear-gradient(to top, #003f91, #f5a623, #d0021b)' }}
```

These hex values correspond to `corbusier-blue`, `corbusier-yellow`, and `corbusier-red`, but they are disconnected from the token system. In dark mode the mask color is `bg-surface/90` which correctly uses the token, but the underlying gradient hex remains static. This also makes the gradient impossible to change from CSS alone.

**Fix:** Move the gradient to a CSS class in `index.css` using token references:
```css
.chicken-gradient {
  background: linear-gradient(
    to top,
    var(--color-corbusier-blue),
    var(--color-corbusier-yellow),
    var(--color-corbusier-red)
  );
}
```

### Problem 6: Low-opacity text tokens in dark mode may fail contrast

`text-ink/30`, `text-ink/40`, and `text-ink/50` are used throughout for secondary labels. In dark mode, `--color-ink` is `#e0ddd8`. At 30% opacity on `#1c1c24` (surface), the effective color is approximately `#4b4b52` — contrast ratio against surface is roughly 2.1:1. At 40% it is approximately 2.8:1. Both fail WCAG AA.

These labels (History header, round number, "vs" separator, helper text) are intentionally de-emphasized, but should remain at least 3:1 for readability. Increase minimums: `text-ink/30` → `text-ink/50`, `text-ink/40` → `text-ink/60` throughout. In dark mode this gives approximately 3.5:1 and 4.7:1 respectively.

---

## Recommended Architecture for Design Fixes

### Pattern 1: Viewport-filling root shell with h-svh

**What:** Replace `min-h-screen` on `App` with `h-svh flex flex-col overflow-hidden`. Screens inherit the full viewport height via `flex-1`.

**When to use:** Any full-screen app where page-level scrolling is not the intended UX. All three Word Chicken screens expect to fill the viewport.

**Why svh over dvh:** `100svh` (small viewport height) resolves to the viewport with browser chrome visible — the smallest stable size. `100dvh` recalculates continuously as the toolbar appears/disappears, causing layout jank on iOS Safari. For a game UI, stable layout beats dynamic sizing. Both are Baseline Widely Available as of June 2025 (HIGH confidence — MDN, CanIUse).

**Trade-offs:**
- Pro: Eliminates double min-h-screen; stable across mobile Chrome/Safari
- Con: On desktop, if the game content is very short, `h-svh` can leave empty space at the bottom — acceptable for a game UI; screens should fill the space

**Example — App.tsx:**
```tsx
<div className={`h-svh flex flex-col bg-surface font-jost overflow-hidden ${darkMode ? 'dark' : ''}`}>
  {screen === 'config' && <ConfigScreen />}
  {screen === 'lobby' && <LobbyScreen />}
  {screen === 'game' && <GameScreen />}
</div>
```

**Example — GameScreen.tsx:**
```tsx
<div className="flex flex-col flex-1 overflow-hidden bg-gradient-to-b from-surface to-surface/80 p-2 sm:p-4">
  {/* fixed-height top bar */}
  <div className="flex-shrink-0 relative flex items-center justify-center mb-3">
    ...
  </div>

  {/* flex-1 middle — min-h-0 required for children to shrink */}
  <div className="flex flex-1 min-h-0 gap-4">
    ...
  </div>
</div>
```

**Example — ConfigScreen.tsx / LobbyScreen.tsx:**
```tsx
<div className="flex-1 overflow-y-auto">
  <div className="max-w-md mx-auto p-4">
    ...
  </div>
</div>
```

### Pattern 2: Semantic token layering in @theme + .dark override

**What:** `@theme` defines utility-generating tokens with light mode defaults. The `.dark {}` selector block overrides only the CSS variable values at runtime. Brand colors are static and live only in `@theme`.

**Confirmed behavior (HIGH confidence — official docs):**
- `@theme` variables must be top-level; they cannot be conditional or nested
- `@theme` creates utility classes (`--color-surface` → `bg-surface`, `text-surface`, etc.)
- Dark mode token overrides go in a plain `.dark {}` selector block, NOT inside `@theme`
- `@custom-variant dark (&:where(.dark, .dark *))` in `index.css` is the correct v4 class-based dark mode pattern — already correctly implemented

**Current token structure — sound, no architectural change needed:**
```css
@theme {
  /* Brand colors — static, no dark override */
  --color-corbusier-red: #d0021b;
  --color-corbusier-blue: #003f91;
  --color-corbusier-yellow: #f5a623;

  /* Semantic tokens — light defaults */
  --color-surface: #f2f0eb;
  --color-card: #ffffff;
  --color-ink: #3a3a3a;
  --color-charcoal: #3a3a3a;
}

.dark {
  /* Override semantic tokens only */
  --color-surface: #1c1c24;
  --color-card: #2a2a34;
  --color-ink: #e0ddd8;
}
```

**Additions to consider:**
```css
@theme {
  /* Add if multiple inset wells need a subtle background */
  --color-surface-subtle: #e8e4dd;
}

.dark {
  --color-surface-subtle: #23232e;
}
```

### Pattern 3: Single breakpoint discipline (sm: only)

**What:** Use `sm:` (640px) as the single meaningful breakpoint. Design mobile-first at 375px; apply `sm:` adjustments for tablet/desktop at 640px+. Do not introduce `md:` or `lg:`.

**When to use:** This game has exactly two layout modes:
- Mobile (< 640px): 3/4/3 tile rows, WordHistory hidden, compact spacing
- Desktop (≥ 640px): flex-wrap tiles, WordHistory visible, larger spacing

A third breakpoint creates a half-broken intermediate state with no clear design intent.

**Current breakpoint inventory — assessment:**

| Location | Pattern | Assessment |
|----------|---------|------------|
| `GameScreen p-2 sm:p-4` | Responsive padding | Good |
| `WordHistory hidden sm:block` | Mobile hide | Good |
| `ChickenOMeter h-48 sm:h-64` | Height scale | Good |
| `ScorePanel gap-6 sm:gap-10` | Responsive gap | Good |
| `ScorePanel text-xl sm:text-2xl` | Font scale | Good |
| `PlayerHand sm:hidden / hidden sm:flex` | Two tile layouts | Good |
| `ConfigScreen text-4xl sm:text-5xl` | Title scale | Good |
| `LobbyScreen text-3xl sm:text-4xl` | Title scale | Good |
| `PlayerHand justify-end pb-8` (no breakpoint) | No mobile adaptation | Problem — audit needed |
| `StagingArea` button sizing (no breakpoint) | No mobile adaptation | Minor — audit size |

### Pattern 4: Dark mode contrast audit by component

**Systematic approach:** Check each color combination against WCAG AA (4.5:1 text, 3:1 large/UI).

**Identified failures and fixes:**

| Element | Context | Current | Issue | Fix |
|---------|---------|---------|-------|-----|
| Yellow tile letter | `TileCard color="yellow"` | `#f5a623` bg, `white` text | ~2.1:1, fails AA | Change to `text-charcoal` (#3a3a3a) → ~7.5:1 |
| Medium difficulty button | ConfigScreen | `bg-corbusier-yellow text-white` | Same as above | Change to `text-charcoal` |
| Secondary labels dark mode | All | `text-ink/30` on `#1c1c24` | ~2.1:1, fails AA | Raise to `text-ink/50` minimum |
| Tertiary labels dark mode | All | `text-ink/40` on `#1c1c24` | ~2.8:1, fails AA | Raise to `text-ink/60` |
| ChickenOMeter gradient | ChickenOMeter | Hardcoded hex | No dark adaptation | Move to CSS class using var(--color-*) |
| Blue tile letter | `TileCard color="blue"` | `#003f91` bg, `white` text | ~8.6:1, passes | No change |
| Red tile letter | `TileCard color="red"` | `#d0021b` bg, `white` text | ~5.1:1, passes AA | No change |

---

## Data Flow (Design-Relevant)

### Dark mode cascade

```
appSlice.darkMode (boolean)
    ↓ (read in App)
<div className={`... ${darkMode ? 'dark' : ''}`}>
    ↓ (CSS cascade via @custom-variant dark)
.dark { --color-surface: ...; --color-card: ...; --color-ink: ...; }
    ↓ (all components using bg-surface, bg-card, text-ink update automatically)
No component code changes needed for dark mode to work
```

**Important:** The `dark` class is applied to the root `div` in `App`, not on `<html>`. This works correctly with `@custom-variant dark (&:where(.dark, .dark *))` — all descendants pick up the overrides. This is the correct Tailwind v4 class-based pattern.

### Viewport height cascade

```
App: h-svh flex flex-col
    ↓ (height is definite — 100svh)
GameScreen: flex-1 (expands to fill App's height)
    ↓ (height is definite — remaining after App's own content)
Middle section: flex-1 min-h-0 (expands to fill GameScreen's remaining space)
    ↓ (height is definite — min-h-0 allows children to shrink)
PlayerHand: flex-1 flex-col (fills left column of middle section)
    ↓ (constrained — will not overflow parent)
```

**The `min-h-0` is load-bearing.** Without it, `flex-1` containers in a flex column do not constrain their children — children overflow instead of fitting within bounds.

### Responsive layout (breakpoints)

```
Browser at < 640px:
  PlayerHand renders sm:hidden div (3/4/3 tile rows)
  WordHistory: hidden
  ChickenOMeter: h-48

Browser at >= 640px:
  PlayerHand renders hidden sm:flex div (flex-wrap tiles)
  WordHistory: block (w-32 sidebar)
  ChickenOMeter: h-64
```

No React state involved — pure CSS. Breakpoint behavior is not affected by any proposed changes; the `sm:` threshold stays at 640px.

---

## Build Order for Design Fixes

Dependencies flow downward: shell must be correct before screens can inherit height. Structural changes must precede class tweaks to the same component.

```
Step 1: App.tsx — viewport shell
  min-h-screen → h-svh flex flex-col overflow-hidden
  [All screens now inherit correct height]

Step 2: GameScreen.tsx — remove min-h-screen, add flex-1 + overflow-hidden
  Add min-h-0 to middle flex container
  [PlayerHand now has a bounded, correct parent]

Step 3: PlayerHand.tsx — audit justify-end pb-8 on short viewports
  Consider overflow-y-auto on the column if content can exceed bounds

Step 4: ConfigScreen.tsx + LobbyScreen.tsx — structural
  min-h-screen → flex-1 overflow-y-auto
  [Screens scroll within the fixed shell]

Step 5: index.css — token and contrast fixes
  Raise text-ink/30 minimum to text-ink/50 sitewide
  Add .chicken-gradient CSS class
  Consider --color-surface-subtle token if needed

Step 6: TileCard.tsx — yellow contrast
  colorClasses.yellow: text-white → text-charcoal
  [Affects PlayerHand, StagingArea, SharedWordDisplay simultaneously]

Step 7: ChickenOMeter.tsx — remove hardcoded gradient hex
  Apply .chicken-gradient class from index.css

Step 8: Screen-specific polish (any order)
  ConfigScreen: spacing, button sizing, HowToPlay modal polish
  LobbyScreen: lobby code display, input sizing
  RoundEndCard + GameOverScreen: short-viewport scroll audit
  ScorePanel: leading-score visual hierarchy
  SharedWordDisplay: padding/rounding
  StagingArea: submit button size
  TurnIndicator: spacing
  WordHistory: max-h on desktop
```

**Cross-cutting vs screen-specific:**

| Change | Cross-cutting | Screen-specific |
|--------|--------------|-----------------|
| `h-svh` shell | Yes (App.tsx) | — |
| `flex-1 overflow-y-auto` screens | Yes (same pattern) | ConfigScreen, LobbyScreen |
| `min-h-0` flex containers | Yes (pattern) | GameScreen, PlayerHand |
| Yellow tile text color | Yes (TileCard, ConfigScreen button) | — |
| Opacity floor (`/50` min) | Yes (global) | — |
| Chicken gradient class | No | ChickenOMeter only |
| Overlay scroll audit | No | RoundEndCard, GameOverScreen |

---

## Anti-Patterns

### Anti-Pattern 1: Re-declaring min-h-screen on every screen

**What people do:** Each screen declares `min-h-screen` to ensure it fills the viewport.
**Why it's wrong:** Creates double-height intent; does not propagate flex growth; uses the large viewport height on mobile, so content sits small at the top with empty space below, or gets clipped under chrome.
**Do this instead:** `App` owns the viewport with `h-svh`. Screens grow to fill it via `flex-1`. Each screen is responsible only for its internal layout, not for claiming the viewport.

### Anti-Pattern 2: Adding dark: variants to every utility class

**What people do:** Add `dark:bg-gray-800 dark:text-white` to each element when making something dark-mode aware.
**Why it's wrong:** Scattered; hard to audit; breaks when new components are added that forget the `dark:` prefix.
**Do this instead:** Use semantic tokens (`bg-surface`, `bg-card`, `text-ink`). The `.dark` block in `index.css` handles all semantic color changes in one place. Only truly brand-specific colors that need dark variants (unlikely) should use `dark:` prefixes.

### Anti-Pattern 3: Hardcoding color values in style= attributes

**What people do:** `style={{ background: 'linear-gradient(to top, #003f91, #f5a623, #d0021b)' }}`
**Why it's wrong:** Bypasses the token system; does not respond to dark mode; cannot be audited centrally.
**Do this instead:** Define a CSS class in `index.css` that uses `var(--color-corbusier-*)` tokens. Apply the class with `className`. The gradient values then update automatically if tokens ever change.

### Anti-Pattern 4: Missing min-h-0 on flex scroll containers

**What people do:** Create `flex flex-col flex-1` containers expecting children to fit or scroll, but omit `min-h-0`.
**Why it's wrong:** Flex items default to `min-height: auto`, meaning they cannot shrink below their content size regardless of the available space. The container overflows instead of constraining children.
**Do this instead:** Any `flex-1` column container that must constrain its children needs `min-h-0` alongside `flex-1`. This is especially important in the GameScreen middle section and PlayerHand column.

### Anti-Pattern 5: Intermediate breakpoints for a two-state layout

**What people do:** Add `md:` and `lg:` breakpoints for intermediate states between mobile and desktop.
**Why it's wrong:** Word Chicken has exactly two valid layout states. A third breakpoint creates a middle state that was never designed, producing half-broken tile layouts or partially-visible sidebars.
**Do this instead:** Commit to `sm:` (640px) as the single breakpoint. Design for 375px (mobile) and 768px+ (desktop) as the only two cases that need dedicated attention.

---

## Integration Points

### Internal Boundaries

| Boundary | Communication | Design Relevance |
|----------|---------------|-----------------|
| `App` → all screens | Conditional render, `className` wraps all content | Dark class and viewport sizing live here — must be correct first |
| `App` → screen height | No explicit prop; CSS inheritance via flex | `h-svh flex flex-col` on App + `flex-1` on screens is the contract |
| `GameScreen` → `PlayerHand` | No layout props; PlayerHand manages its own classes | GameScreen's flex container dimensions directly constrain PlayerHand |
| `GameScreen` → `ChickenOMeter` | `wordLength` prop | Layout: `flex-shrink-0` in right column; height is self-contained |
| `index.css @theme` → all components | CSS cascade via Tailwind utility classes | Any `@theme` or `.dark {}` change affects every component using those tokens |
| `TileCard.colorClasses` → consumers | Three components: PlayerHand, StagingArea, SharedWordDisplay | Color change in TileCard is cross-cutting — affects all tile rendering |

---

## Tailwind v4 @theme — Verified Behaviors

Verified against official docs (tailwindcss.com/docs/theme, tailwindcss.com/docs/dark-mode) — HIGH confidence.

- `@theme` variables must be top-level; they cannot be nested in selectors or media queries
- `@theme` variables generate utility classes (`--color-surface` → `bg-surface`, `text-surface`, `fill-surface`, etc.)
- To override tokens for dark mode: use a plain `.dark {}` selector block — NOT inside `@theme`
- `@custom-variant dark (&:where(.dark, .dark *))` is the correct v4 class-based dark mode pattern — already correctly implemented in `index.css`
- `@theme { --color-*: initial; }` resets entire color namespace (not needed for this audit)
- CSS variables defined in `@theme` are native CSS custom properties and can be used in `var(--color-*)` arbitrary CSS

---

## Sources

- Official Tailwind v4 theme docs: https://tailwindcss.com/docs/theme
- Official Tailwind v4 dark mode docs: https://tailwindcss.com/docs/dark-mode
- Tailwind v4 dark mode token discussion: https://github.com/tailwindlabs/tailwindcss/discussions/15083
- Tailwind v4 theming best practices: https://github.com/tailwindlabs/tailwindcss/discussions/18471
- Viewport units (svh/dvh/lvh) explained: https://www.bram.us/2021/07/08/the-large-small-and-dynamic-viewports/
- dvh jank on iOS Safari: https://iifx.dev/en/articles/460170745/fixing-ios-safari-s-shifting-ui-with-dvh
- svh vs dvh practical guide: https://medium.com/@tharunbalaji110/understanding-mobile-viewport-units-a-complete-guide-to-svh-lvh-and-dvh-0c905d96e21a

---
*Architecture research for: Word Chicken v1.1 UX/design audit*
*Researched: 2026-03-18*
