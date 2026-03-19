# Phase 5: Viewport Foundation - Research

**Researched:** 2026-03-19
**Domain:** Mobile browser viewport layout — iOS Safari viewport units, overscroll background, dark mode surface bleed
**Confidence:** HIGH — all findings grounded in actual source files; viewport and dark mode claims verified against prior project research (STACK.md, PITFALLS.md) which were cross-referenced with official MDN and Tailwind v4 docs

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VPRT-01 | App fills the visible viewport on mobile without overflow or wasted space on first load | Replace `min-h-screen` (resolves to `100vh` = large viewport) with `min-h-dvh` on screens, `min-h-svh` on static shells — documented in Standard Stack section |
| VPRT-02 | Game content does not require scrolling during active gameplay on any standard phone size (375px+) | GameScreen needs `flex flex-col min-h-dvh` + `flex-1` mid-section so PlayerHand is always visible within the viewport — Architecture Patterns section |
| VPRT-03 | Config and Lobby screens scroll gracefully when content exceeds viewport height | `min-h-dvh` outer containers with natural scrolling flow — no fixed heights that clip content — Architecture Patterns section |
| VPRT-05 | Dark mode does not show white background bleed on iOS overscroll rubber-banding | `document.documentElement.classList.toggle('dark', darkMode)` in App.tsx useEffect, or `html:has(.dark) { background-color: var(--color-surface) }` global CSS — documented in Pitfalls section |
</phase_requirements>

---

## Summary

Phase 5 fixes four concrete mobile browser layout defects in an existing React + Tailwind v4 app. The root cause of three of the four requirements (VPRT-01, VPRT-02, VPRT-03) is a single pattern: every screen and the App root shell use `min-h-screen`, which Tailwind maps to `min-height: 100vh`. On mobile browsers, `100vh` resolves to the *large* viewport height — the height when the address bar is fully hidden. On first load, the address bar is visible and the actual usable area is shorter than `100vh`, causing the game layout to extend below the fold and content to "sit small" at the bottom.

The fix is purely a CSS unit swap with no behavioral changes: replace `min-h-screen` with `min-h-dvh` on all screen containers and `min-h-svh` on the App loading/error state wrappers. `dvh` (dynamic viewport height) adapts in real-time to browser chrome changes; `svh` (small viewport height) always equals the most conservative height — never overflows on first paint. Both units reached Baseline Widely Available in June 2025 with no polyfill required.

The fourth requirement (VPRT-05) is a separate, one-line fix: iOS Safari's overscroll rubber-banding reveals the `<html>` element's background when the React app's `.dark` class is only on the root `div`, not on `<html>`. Adding `document.documentElement.classList.toggle('dark', darkMode)` in a `useEffect` in `App.tsx`, or a single `html:has(.dark)` CSS rule in `index.css`, closes the gap.

Note: VPRT-04 (notch/Dynamic Island safe area insets) is **not** in Phase 5 scope — it is assigned to Phase 6. However, Phase 5 MUST add `viewport-fit=cover` to `index.html` because this is the prerequisite gate for Phase 6's `env(safe-area-inset-*)` work. Add it now, use it later.

**Primary recommendation:** Four targeted file changes — `index.html`, `App.tsx`, `ConfigScreen.tsx`/`LobbyScreen.tsx`, `GameScreen.tsx` — and one CSS rule in `index.css`. No new libraries. No structural refactoring.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tailwind v4 | 4.x (already installed) | `min-h-dvh`, `h-dvh`, `min-h-svh`, `overscroll-none` utilities | All required viewport units are built-in; zero config needed |
| React 19 | 19.x (already installed) | `useEffect` for `document.documentElement` dark mode side effect | Existing pattern; all layout fixes are pure CSS + one useEffect |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| No new dependencies | — | All fixes use native CSS and existing Tailwind utilities | — |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `min-h-dvh` | `min-h-svh` on game screens | `svh` is always the minimum height — correct for static shells but wrong for game screens where content must grow to fill the visible area as the address bar hides |
| `document.documentElement.classList` approach | `html:has(.dark)` CSS rule | CSS rule is simpler (one line in index.css), no DOM manipulation outside React. Either works. CSS rule preferred. |
| `viewport-fit=cover` | Leave `index.html` unchanged | Cannot be deferred: Phase 6 safe-area-inset work requires this meta tag to be present; add in Phase 5 |

**Installation:** No new packages required.

---

## Architecture Patterns

### Current State (What Needs to Change)

```
App.tsx (root)
  - Loading/error divs: min-h-screen → needs min-h-svh
  - Main game wrapper div: min-h-screen → needs min-h-dvh

ConfigScreen.tsx
  - Outer div: min-h-screen → needs min-h-dvh

LobbyScreen.tsx
  - Outer div: min-h-screen → needs min-h-dvh

GameScreen.tsx
  - Outer div: min-h-screen → needs min-h-dvh + overscroll-none
  - Fixed overlays (reconnecting/disconnect): add h-dvh alongside fixed inset-0

index.html
  - viewport meta: add viewport-fit=cover

index.css
  - Add: html:has(.dark) { background-color: var(--color-surface); }
    (for VPRT-05 overscroll surface bleed)
```

### Pattern 1: Screen Container — Scrollable (Config, Lobby)

**What:** Full-height container that allows natural content scrolling when content is taller than the viewport.
**When to use:** Config and Lobby screens — content is a vertical list, may overflow on small phones.

```tsx
// ConfigScreen.tsx and LobbyScreen.tsx outer div
// Before:
<div className="min-h-screen bg-gradient-to-br ...">

// After:
<div className="min-h-dvh bg-gradient-to-br ...">
```

The `max-w-md mx-auto` inner container and padding are unchanged. Content exceeding `dvh` naturally scrolls — no additional changes needed.

### Pattern 2: Game Screen — Fixed-Height Flex Column

**What:** Full-viewport flex column where the middle section (`flex-1`) fills remaining space between a fixed top bar and fixed bottom action area.
**When to use:** GameScreen — the interactive canvas where no scrolling should occur.

```tsx
// GameScreen.tsx outer div
// Before:
<div className="flex flex-col min-h-screen bg-gradient-to-b ... p-2 sm:p-4">

// After:
<div className="flex flex-col min-h-dvh overscroll-none bg-gradient-to-b ... p-2 sm:p-4">
```

The existing `flex-1` on the middle section (line 203 in GameScreen.tsx) correctly fills remaining height once `min-h-dvh` is in place.

### Pattern 3: App Shell Loading/Error States

**What:** Static full-height centering wrapper. Uses `svh` (conservative) because these states never need to be taller than the smallest viewport.
**When to use:** Loading/error divs in App.tsx.

```tsx
// App.tsx — loading state, error state
// Before:
<div className={`bg-surface min-h-screen font-jost flex items-center justify-center ...`}>

// After:
<div className={`bg-surface min-h-svh font-jost flex items-center justify-center ...`}>
```

### Pattern 4: Fixed Overlay — Full Viewport Coverage

**What:** Fixed overlays that must cover the entire visible viewport, including areas below the bottom of `inset-0` when dynamic viewport is smaller than the layout viewport.
**When to use:** Reconnecting/disconnected modals in GameScreen.tsx.

```tsx
// GameScreen.tsx reconnecting/disconnect overlays
// Before:
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">

// After:
<div className="fixed inset-0 h-dvh z-50 flex items-center justify-center bg-black/50">
```

### Pattern 5: Dark Mode Surface Bleed Fix (VPRT-05)

**What:** Extend the dark surface color to the `<html>` element so iOS overscroll rubber-banding reveals dark background instead of browser-default white.
**When to use:** index.css global stylesheet.

```css
/* src/index.css — add after existing .dark { ... } block */

/* VPRT-05: Prevent white overscroll bleed in dark mode on iOS Safari.
   The .dark class lives on a React div, not on <html>.
   This rule extends the dark surface to <html> so overscroll reveals
   the correct background color. :has() is Baseline 2023. */
html:has(.dark) {
  background-color: var(--color-surface);
}
```

Alternatively (if a useEffect approach is preferred for any reason):

```tsx
// App.tsx — in the existing or new useEffect
useEffect(() => {
  document.documentElement.classList.toggle('dark', darkMode)
}, [darkMode])
```

The CSS rule approach is preferred: no React tree side effects, no ref needed, single line.

### Pattern 6: viewport-fit=cover in index.html

**What:** Extend the app's rendering surface to cover the full screen including notch/Dynamic Island areas, enabling `env(safe-area-inset-*)` to return non-zero values on notched iPhones.
**When to use:** index.html — one-time change, prerequisite for Phase 6.

```html
<!-- index.html — update existing meta tag -->
<!-- Before: -->
<meta name="viewport" content="width=device-width, initial-scale=1.0" />

<!-- After: -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

Phase 5 adds this. Phase 6 consumes it via `env(safe-area-inset-bottom)`.

### Anti-Patterns to Avoid

- **Using `dvh` on App.tsx loading/error wrappers:** These are static centering states; use `svh` to guarantee no overflow on first paint. `dvh` would continuously resize the wrapper as the address bar animates.
- **Using `dvh` on fixed overlays without `h-dvh`:** `fixed inset-0` positions to the layout viewport, not the visual viewport. Add `h-dvh` explicitly to ensure overlay covers dynamic viewport on iOS.
- **Applying `overscroll-none` globally to `body` or `html`:** Breaks scroll on Config and Lobby screens. Apply only to GameScreen's outer container where elastic bounce is unwanted.
- **Moving `.dark` class to `<html>` instead of using the CSS rule:** The Tailwind `@custom-variant dark (&:where(.dark, .dark *))` scopes dark to elements inside `.dark`. Moving the class to `<html>` changes the selector root and could affect descendant scoping. The `html:has(.dark)` CSS rule avoids this entirely.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Viewport height that excludes browser chrome | JS `window.innerHeight` listener in React state | `dvh` CSS unit | JS approach causes re-renders on every scroll event; `dvh` is handled entirely by the browser compositor with no JS involvement |
| Dark mode body background | `document.body.style.backgroundColor = ...` or a separate `<meta name="theme-color">` hack | `html:has(.dark)` CSS rule | One-line CSS rule; no runtime cost; no React state synchronization required |
| Safari overscroll prevention | `touchmove` event listeners with `preventDefault()` | `overscroll-none` Tailwind class | Event listener approach breaks nested scrolling (modal content can't scroll); `overscroll-behavior: none` is the CSS standard |

**Key insight:** Every viewport problem in this phase has a one-line CSS solution. Any approach requiring JS, listeners, or `window.innerHeight` is strictly worse.

---

## Common Pitfalls

### Pitfall 1: Using `dvh` on App.tsx Loading Wrapper (Wrong Unit Choice)

**What goes wrong:** Applying `min-h-dvh` to the App loading/error wrapper causes the wrapper to continuously resize as the browser address bar shows/hides during any scroll on these static states.
**Why it happens:** `dvh` is the right answer for game screens; it's reflexively applied everywhere.
**How to avoid:** Use `min-h-svh` on App.tsx loading/error divs. `svh` is always the minimum height — it never causes overflow on first paint and never changes size.
**Warning signs:** Loading spinner visually bounces/shifts when user scrolls on the loading state.

### Pitfall 2: `dvh` on GameScreen Creates Reflow Jitter During Gameplay

**What goes wrong:** If `h-dvh` (not `min-h-dvh`) is used on GameScreen's outer container, and the user scrolls slightly, the container resizes in real time. The tile hand area at the bottom (`justify-end pb-8`) visibly shifts position during gameplay.
**Why it happens:** `dvh` is fully dynamic — it updates on every address bar animation frame. `min-h-dvh` is correct: it sets the floor but does not constrain growth or cause continuous resize.
**How to avoid:** Use `min-h-dvh flex flex-col` on GameScreen. The `flex-1` section absorbs any growth. Do not use `h-dvh` (exact height) on interactive containers.
**Warning signs:** The PlayerHand tile grid visually jumps or shifts mid-game on iPhone when the address bar animates.

### Pitfall 3: `viewport-fit=cover` Added But `env()` Called Before Phase 6

**What goes wrong:** Adding `viewport-fit=cover` in Phase 5 is correct. But if any developer also adds `env(safe-area-inset-bottom)` CSS speculatively in Phase 5, it will overlap with Phase 6 work, which is scoped to handle notch/Dynamic Island specifically (VPRT-04).
**Why it happens:** The two changes are related; a developer may add both at once.
**How to avoid:** Phase 5 adds only the `viewport-fit=cover` meta tag. All `env(safe-area-inset-*)` usage belongs in Phase 6. The meta tag gate is safe to add early.

### Pitfall 4: Dark Mode `.dark` Class Location Change Breaks Tailwind Scoping

**What goes wrong:** If the VPRT-05 fix is implemented by moving the `.dark` class from the React root div to `document.documentElement`, the Tailwind `@custom-variant dark (&:where(.dark, .dark *))` variant still works (it looks for `.dark` anywhere in the ancestor chain). But if the App root div no longer has `.dark`, any component that checks for `.dark` in JS (e.g., `document.querySelector('.dark')`) would break.
**Why it happens:** The `html:has(.dark)` CSS approach is the correct choice — it does not move the `.dark` class. Only the `document.documentElement.classList` approach moves the class, which carries this risk.
**How to avoid:** Use the `html:has(.dark)` CSS rule. Do not move the `.dark` class from the React root div.
**Warning signs:** Dark mode toggle stops working visually after the change; inspect `document.querySelector('.dark')` in console — if null, the class was moved.

### Pitfall 5: `fixed inset-0` Overlays Don't Cover Full Dynamic Viewport

**What goes wrong:** On iOS Safari with dynamic viewport, `fixed inset-0` positions to the layout viewport boundaries, not the visual viewport. When the browser chrome is visible (smaller visual viewport), the overlay bottom edge may not extend to the real screen bottom.
**Why it happens:** `inset-0` is `top:0; right:0; bottom:0; left:0` — these resolve against the layout viewport in iOS Safari, not the visual viewport.
**How to avoid:** Add `h-dvh` to the fixed overlay alongside `inset-0`. `h-dvh` forces the height to the dynamic visual viewport height.
**Warning signs:** The black translucent overlay on the reconnecting/disconnect modal shows a gap at the bottom on iPhone.

---

## Code Examples

Verified patterns from codebase + official sources:

### App.tsx — Full Updated Wrapper

```tsx
// App.tsx — loading/error states use min-h-svh; main wrapper uses min-h-dvh
// Loading state
<div className={`bg-surface min-h-svh font-jost flex items-center justify-center ${darkMode ? 'dark' : ''}`}>
  <span className="text-ink">Loading dictionary...</span>
</div>

// Error state
<div className={`bg-surface min-h-svh font-jost flex items-center justify-center ${darkMode ? 'dark' : ''}`}>
  <span className="text-corbusier-red">Failed to load dictionary.</span>
</div>

// Main wrapper
<div className={`bg-surface min-h-dvh font-jost ${darkMode ? 'dark' : ''}`}>
  {screen === 'config' && <ConfigScreen />}
  {screen === 'lobby' && <LobbyScreen />}
  {screen === 'game' && <GameScreen />}
</div>
```

### GameScreen.tsx — Outer Container

```tsx
// GameScreen.tsx line 175 — outer container
<div className="flex flex-col min-h-dvh overscroll-none bg-gradient-to-b from-surface to-surface/80 p-2 sm:p-4">
```

### ConfigScreen.tsx and LobbyScreen.tsx

```tsx
// ConfigScreen.tsx line 94 outer div
<div className="min-h-dvh bg-gradient-to-br from-surface via-surface to-corbusier-blue/5 p-4">

// LobbyScreen.tsx line 146 outer div
<div className="min-h-dvh bg-gradient-to-br from-surface via-surface to-corbusier-blue/5 p-4">
```

### GameScreen.tsx — Fixed Overlays

```tsx
// Both reconnecting and disconnect overlays
<div className="fixed inset-0 h-dvh z-50 flex items-center justify-center bg-black/50">
```

### index.html — Viewport Meta Tag

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

### index.css — Dark Mode Surface Fix

```css
/* Add after existing .dark { ... } block */
/* VPRT-05: Extend dark surface to <html> so iOS overscroll
   rubber-banding reveals dark background, not browser-default white.
   :has() is Baseline 2023 (Chrome 105+, Firefox 121+, Safari 15.4+). */
html:has(.dark) {
  background-color: var(--color-surface);
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `100vh` for full-screen mobile layouts | `dvh` / `svh` based on scroll behavior needed | CSS Baseline Widely Available — June 2025 | Eliminates the "wrong height on first paint" class of iOS Safari bugs |
| `document.body.style.background` for theme bleed | `html:has(.dark)` CSS rule | CSS `:has()` Baseline 2023 | Single CSS line replaces JS DOM manipulation |
| `touchmove` event prevention for overscroll | `overscroll-behavior: none` (Tailwind: `overscroll-none`) | CSS standard, 2018+ | No JS, no broken nested scroll |

**Deprecated/outdated:**
- `min-h-screen` on mobile page containers: maps to `100vh` = large viewport, always wrong for mobile-first apps
- `-webkit-overflow-scrolling: touch`: deprecated, removed from modern iOS — do not use
- `window.innerHeight` for layout calculations: causes React re-renders on every scroll frame — replaced by CSS viewport units

---

## Open Questions

1. **VPRT-05 fix approach — CSS rule vs useEffect**
   - What we know: Both `html:has(.dark)` and `document.documentElement.classList.toggle` work correctly
   - What's unclear: Whether any existing JS logic already reads `.dark` from `document.documentElement` (if so, the useEffect approach would be consistent)
   - Recommendation: Use CSS rule — it's one line, no JS, no side effects. If a useEffect approach is chosen, verify that `@custom-variant dark (&:where(.dark, .dark *))` still resolves correctly (it will, because `.dark` stays on the React root div).

2. **Real-device verification requirement**
   - What we know: DevTools simulation does not accurately model iOS Safari's `viewport-fit=cover` gate or dynamic viewport behavior
   - What's unclear: Whether a real device test is feasible within this workflow
   - Recommendation: Flag Phase 5 verification (in `/gsd:verify-work`) as requiring a real phone or BrowserStack iOS Safari session. DevTools testing is sufficient for the CSS changes themselves, but end-to-end validation of VPRT-01/VPRT-02 on initial load requires real iOS.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.x + Testing Library 16.x |
| Config file | `vite.config.ts` (test block with jsdom environment) |
| Quick run command | `npm test -- --run src/__tests__/App.test.tsx` |
| Full suite command | `npm test -- --run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VPRT-01 | App root renders with `min-h-dvh` class, not `min-h-screen` | unit | `npm test -- --run src/__tests__/App.test.tsx` | ✅ (extend existing) |
| VPRT-01 | Loading state renders with `min-h-svh` class | unit | `npm test -- --run src/__tests__/App.test.tsx` | ✅ (extend existing) |
| VPRT-02 | GameScreen outer div has `min-h-dvh flex flex-col overscroll-none` | unit | `npm test -- --run src/__tests__/viewport.test.tsx` | ❌ Wave 0 |
| VPRT-03 | ConfigScreen outer div has `min-h-dvh` | unit | `npm test -- --run src/__tests__/viewport.test.tsx` | ❌ Wave 0 |
| VPRT-03 | LobbyScreen outer div has `min-h-dvh` | unit | `npm test -- --run src/__tests__/viewport.test.tsx` | ❌ Wave 0 |
| VPRT-05 | Dark mode: `<html>` element has dark surface color applied (CSS rule present) | unit | `npm test -- --run src/__tests__/viewport.test.tsx` | ❌ Wave 0 |
| VPRT-05 | index.html contains `viewport-fit=cover` | manual | inspect `index.html` | ❌ Wave 0 (manual verify) |

Note: jsdom does not simulate actual viewport rendering or `dvh`/`svh` behavior. Unit tests verify class presence (the right CSS is applied), not visual correctness. Real-device testing is the only valid verification for VPRT-01/VPRT-02 visual behavior.

### Sampling Rate

- **Per task commit:** `npm test -- --run src/__tests__/App.test.tsx`
- **Per wave merge:** `npm test -- --run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/__tests__/viewport.test.tsx` — covers VPRT-02 (GameScreen classes), VPRT-03 (ConfigScreen/LobbyScreen classes), VPRT-05 (dark mode CSS rule verification)
- [ ] Extend `src/__tests__/App.test.tsx` — add assertions for `min-h-dvh` on main wrapper and `min-h-svh` on loading/error states

*(Note: `html:has(.dark)` CSS rule presence can be verified by checking `src/index.css` source content or by checking that the rule is in the document stylesheet in jsdom — the latter is unreliable due to jsdom CSS limitations. A simpler test: assert the CSS file contains the rule string.)*

---

## Sources

### Primary (HIGH confidence)

- Project PITFALLS.md (`.planning/research/PITFALLS.md`) — Pitfall 1 (`dvh` vs `svh`), Pitfall 7 (dark mode surface bleed) — directly applicable to VPRT-01, VPRT-02, VPRT-05
- Project STACK.md (`.planning/research/STACK.md`) — Viewport Height: The Core Fix section — maps `min-h-screen` to specific file locations with exact replacement classes
- `src/App.tsx` — confirmed `min-h-screen` on all three render paths (lines 73, 82, 88)
- `src/screens/ConfigScreen.tsx` — confirmed `min-h-screen` on outer div (line 94)
- `src/screens/LobbyScreen.tsx` — confirmed `min-h-screen` on outer div (line 146)
- `src/screens/GameScreen.tsx` — confirmed `min-h-screen flex flex-col` on outer div (line 175); confirmed `fixed inset-0` on both overlays (lines 60, 124)
- `index.html` — confirmed missing `viewport-fit=cover`; confirmed current meta tag format
- `src/index.css` — confirmed `.dark` class applied to React root div (not `<html>`); confirmed `--color-surface` is a CSS custom property usable in the `:has()` rule
- [Tailwind CSS Min-Height Docs](https://tailwindcss.com/docs/min-height) — `min-h-dvh`, `min-h-svh` confirmed built-in in v4
- [web.dev: Large, small, and dynamic viewport units](https://web.dev/blog/viewport-units) — authoritative semantics for dvh/svh/lvh, Baseline Widely Available June 2025
- [MDN: CSS env()](https://developer.mozilla.org/en-US/docs/Web/CSS/env) — `viewport-fit=cover` gate requirement confirmed

### Secondary (MEDIUM confidence)

- STATE.md accumulated decisions — "Root cause of all mobile layout issues is `min-h-screen`... Fix: `h-svh flex flex-col` on App root, `flex-1` screens" and "`viewport-fit=cover` must be in index.html before any `env(safe-area-inset-*)` CSS will return non-zero on real iOS" — prior research decision, backed by official sources

### Tertiary (LOW confidence)

- None — all claims in this document are backed by either source file inspection or HIGH/MEDIUM confidence sources.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries; all Tailwind utilities confirmed in v4 docs
- Architecture: HIGH — specific file/line changes identified from direct source inspection
- Pitfalls: HIGH — pitfalls are grounded in prior project research which cross-referenced official iOS Safari and Tailwind documentation
- Validation: MEDIUM — jsdom does not simulate viewport; unit tests verify class presence only; real-device testing remains manual

**Research date:** 2026-03-19
**Valid until:** Stable — `dvh`/`svh` are at Baseline Widely Available; `overscroll-behavior` and `:has()` are stable CSS standards. No expiry concern within the v1.1 timeline.
