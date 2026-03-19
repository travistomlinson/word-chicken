# Stack Research

**Domain:** UX/Design audit and fix pass — React + Tailwind v4 web game
**Researched:** 2026-03-18
**Confidence:** HIGH

## Overview

This is a design-only milestone. The validated stack (React 18, Vite, Tailwind v4, Zustand, PeerJS, Vitest) stays unchanged. No new runtime dependencies are needed or wanted. This document catalogues the CSS techniques, Tailwind v4 utilities, and browser-native tooling needed to fix the known layout and accessibility issues without adding package weight.

---

## Recommended Stack (No Changes — Techniques Only)

### Core Technologies (Existing — Confirmed Adequate)

| Technology | Version | Purpose | Why Adequate for Design Pass |
|------------|---------|---------|------------------------------|
| Tailwind v4 | 4.x | Utility CSS | Ships `h-dvh`, `min-h-dvh`, `h-svh`, `min-h-svh`, `overscroll-none` built-in — no config needed |
| React 18 | 18.x | UI rendering | No changes needed; all layout fixes are pure CSS |
| Vite | 5.x | Build | No changes needed |

---

## Viewport Height: The Core Fix

### Problem in This Codebase

`App.tsx`, `ConfigScreen.tsx`, `LobbyScreen.tsx`, and `GameScreen.tsx` all use `min-h-screen`, which maps to `min-height: 100vh`. On mobile browsers, `100vh` is calculated against the *large* viewport (browser UI hidden). On initial page load — when the address bar is fully visible — `100vh` exceeds the actual visible area. The result: content that should fill the screen appears small and tucked at the bottom, and buttons below the fold fall off-screen.

### The Fix: Replace `min-h-screen` with `min-h-dvh`

Three modern viewport height units solve this with no JavaScript:

| Unit | Meaning | Use When |
|------|---------|----------|
| `dvh` | Dynamic — adjusts in real-time as browser chrome shows/hides | Game screens where content must fill visible area at all times |
| `svh` | Small — always equals height with browser UI fully visible | Static shells, loading states — never overflows on first paint |
| `lvh` | Large — equals height when browser UI is hidden | Never use as `min-height` on page containers |

**Why `dvh` for game screens:** The game UI must respond correctly both when the browser chrome is visible (page load) and hidden (mid-scroll). `dvh` adapts to both states. `vh` only matches `lvh` — always too tall on initial load.

**Why `svh` for the App wrapper:** The outermost wrapper that shows loading/error states never needs to be taller than the smallest viewport. `svh` guarantees no overflow on first paint, which is a strictly better behavior than `dvh` for static content.

**Tailwind v4 classes (all built-in, zero configuration):**

| Class | CSS Property | Replace |
|-------|-------------|---------|
| `min-h-dvh` | `min-height: 100dvh` | `min-h-screen` on game/config/lobby screens |
| `h-dvh` | `height: 100dvh` | Full-screen overlays in GameScreen |
| `min-h-svh` | `min-height: 100svh` | App wrapper loading/error states |
| `h-svh` | `height: 100svh` | Fixed shells where content must never overflow |

**Browser support (HIGH confidence):** `dvh`, `svh`, `lvh` reached Baseline Widely Available in June 2025 — Chrome 108+, Firefox 101+, Safari 15.4+, Edge 108+. Approximately 95% global coverage as of early 2026. No polyfill or fallback needed.

### Specific Changes Required by File

```
App.tsx:          min-h-screen → min-h-svh (loading and error divs)
                  min-h-screen → min-h-dvh (main game wrapper div)
ConfigScreen.tsx: min-h-screen → min-h-dvh (outer div)
LobbyScreen.tsx:  min-h-screen → min-h-dvh (outer div)
GameScreen.tsx:   min-h-screen → min-h-dvh (flex col outer div)
                  fixed inset-0 overlays → add h-dvh (reconnecting/disconnect modals)
```

---

## Safe Area Insets (iOS Notch / Dynamic Island)

### Problem

The game has no `viewport-fit=cover` or `env(safe-area-inset-*)` handling. On iPhones with a notch or Dynamic Island, the home indicator gesture zone at the bottom clips interactive elements — specifically the PlayerHand action buttons (Submit Word, Show a Word, Give Up) which are positioned at the bottom of the flex layout.

### The Fix: Two-Step Approach

**Step 1 — Update `index.html` viewport meta tag:**

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

`viewport-fit=cover` tells the browser to extend the app into the notch/gesture area (instead of letterboxing). This is required before `env(safe-area-inset-*)` values become non-zero.

**Step 2 — Add safe area padding to bottom interactive zones:**

Use Tailwind arbitrary value syntax to pass the CSS `env()` function through directly:

```html
<!-- On the PlayerHand action row (Give Up / Show a Word) -->
<div class="flex items-center gap-6 mt-4 pb-[env(safe-area-inset-bottom,0px)]">

<!-- On the GameScreen outer container -->
<div class="flex flex-col min-h-dvh bg-... p-2 sm:p-4 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
```

Alternatively, add a CSS custom property in `@theme` (already the project pattern):

```css
/* src/index.css — inside @theme block */
@theme {
  /* ...existing colors... */
  --spacing-safe-b: env(safe-area-inset-bottom, 0px);
}
```

Then use `pb-safe-b` as a utility class (Tailwind v4 auto-generates utilities from `@theme` spacing entries).

**Browser support (HIGH confidence):** `env(safe-area-inset-*)` is fully supported in all iOS Safari 11.2+ and all modern Android browsers. MDN-documented web standard.

---

## Touch Target Sizes

### Current State

`TileCard.tsx` already applies `min-w-[44px] min-h-[44px]` — the tiles themselves meet requirements. The problem is secondary interactive elements:

| Element | Estimated Touch Area | Issue |
|---------|---------------------|-------|
| "Give Up" button | ~24px tall (text-xs, no padding) | Fails WCAG 2.5.5, Apple HIG |
| "Show a Word" hint button | ~30px tall (py-1, px-3) | Below 44px minimum |
| "Quit" (GameScreen top bar) | ~24px (text-xs, absolute positioned) | Fails |
| Dark mode toggle | ~40px (p-2 + 20px SVG) | Borderline — add 2px padding |

### WCAG Requirements

| Standard | Minimum | Level |
|----------|---------|-------|
| WCAG 2.5.8 (WCAG 2.2) | 24×24 CSS px | AA |
| WCAG 2.5.5 | 44×44 CSS px | AAA (recommended practice) |
| Apple HIG | 44×44 pt | Platform guideline |
| Google Material | 48×48 dp | Platform guideline |

**Recommendation:** Target 44×44 for all interactive elements. The visual size of buttons can remain small (text-xs is fine), but padding must expand the hit area:

```html
<!-- Before: text-xs, no padding — ~24px touch area -->
<button class="text-ink/40 text-xs font-jost uppercase">Give Up</button>

<!-- After: add py-2 px-3 to expand touch area to 44px+ -->
<button class="text-ink/40 text-xs font-jost uppercase py-2 px-3 min-h-[44px]">Give Up</button>
```

---

## Color Contrast: Corbusier Palette Audit

### Current Palette (from `src/index.css`)

| Token | Hex | Role |
|-------|-----|------|
| `corbusier-red` | `#d0021b` | Primary CTA buttons, error states |
| `corbusier-blue` | `#003f91` | Secondary CTA, active/hover states |
| `corbusier-yellow` | `#f5a623` | Accent, PvP lobby, ChickenOMeter |
| `surface` | `#f2f0eb` | Light mode background |
| `card` | `#ffffff` | Light mode card surface |
| `ink` | `#3a3a3a` | Light mode text |
| `surface` (dark) | `#1c1c24` | Dark mode background |
| `card` (dark) | `#2a2a34` | Dark mode card surface |
| `ink` (dark) | `#e0ddd8` | Dark mode text |

### Contrast Risk Areas (Require Manual Verification)

| Color Pair | Combination | Risk Level | Rationale |
|------------|-------------|------------|-----------|
| White on `#f5a623` (yellow buttons) | ConfigScreen "Play a Friend", LobbyScreen "Join" | CRITICAL FAIL | Yellow + white is notoriously low contrast. Estimated ~1.9:1 — fails WCAG AA by a wide margin |
| `#f5a623` on `#f2f0eb` (yellow on cream surface) | Any yellow text/accent on light background | HIGH RISK | Yellow on near-white almost certainly fails 4.5:1 |
| White on `#d0021b` (red buttons) | "Play vs AI", Submit button | MEDIUM — verify | Pure red #FF0000 fails at 4:1; `#d0021b` is darker red, likely passes ~4.5:1 — must confirm |
| White on `#003f91` (blue buttons) | "Create Game", "Reconnect" buttons | LIKELY PASS | Dark navy; white text typically yields 7:1+ — verify |
| `#3a3a3a` on `#f2f0eb` | Body text on surface | PASS | Dark grey on warm cream — estimated ~10:1 |
| `#e0ddd8` on `#1c1c24` | Dark mode body text | LIKELY PASS | Verify, but light text on very dark background typically passes |
| `#3a3a3a`/60% opacity (ink/60) | Muted text throughout | CHECK | Opacity-based text colors reduce contrast — `text-ink/60` on `#f2f0eb` background may fail 4.5:1 |

**Yellow is the critical problem.** The `corbusier-yellow` (#f5a623) buttons with white text (ConfigScreen, LobbyScreen) will fail WCAG AA. Options:
1. Replace white text with dark ink on yellow buttons (`text-charcoal` / `text-ink`)
2. Darken the yellow to a value that achieves 4.5:1 with white (approximately `#b07700` or similar)
3. Replace yellow buttons with the blue variant (yellow becomes decoration-only, never a button background with white text)

### WCAG AA Requirements

- Normal text (< 18px or < 14px bold): **4.5:1 minimum contrast ratio**
- Large text (>= 18px or >= 14px bold): **3:1 minimum**
- UI components and icons: **3:1 minimum**
- Opacity-based colors: contrast is calculated against actual rendered color, not the base token

### Tooling (Zero Install Required)

| Tool | How to Use | What It Checks |
|------|-----------|----------------|
| Chrome DevTools Color Picker | Inspect element → Styles panel → click color swatch | Shows contrast ratio and WCAG AA/AAA pass/fail inline |
| Chrome Lighthouse | DevTools → Lighthouse tab → Accessibility category | Full page audit, flags all failing combinations with element references |
| Firefox DevTools Inspector | Inspect element → color swatch in Rules panel | Same contrast ratio display as Chrome |
| webaim.org/resources/contrastchecker | Enter hex values in browser (no account needed) | Precise ratio calculation + AA/AAA verdict |

No npm package, no browser extension, no CI integration needed for this audit pass. DevTools-native workflow is sufficient.

---

## Responsive Layout Patterns

### Current Breakpoint Usage

The app uses Tailwind's mobile-first pattern correctly in principle. The key pattern already in `PlayerHand.tsx`:

```html
<!-- Mobile: 3/4/3 keyboard rows (correct) -->
<div class="sm:hidden flex flex-col items-center gap-1">...</div>
<!-- Desktop: flex wrap (correct) -->
<div class="hidden sm:flex sm:flex-wrap gap-2">...</div>
```

The `sm:` prefix means "640px and above" — correct dividing line between phone and tablet/desktop.

### Tailwind v4 Default Breakpoints

| Prefix | Min Width | Use For |
|--------|-----------|---------|
| (none) | 0px | Mobile (phone portrait) — mobile-first |
| `sm:` | 640px | Tablet and above |
| `md:` | 768px | Wide tablet and above |
| `lg:` | 1024px | Desktop |

**Critical concept:** `sm:` does not mean "small screens." It means "at 640px and above." Mobile styles must be unprefixed. This is already applied correctly in the codebase.

### v4 Pattern: Max-Range Targeting

Tailwind v4 adds cleaner mobile-only targeting:

```html
<!-- Applies only below 640px (mobile only) — cleaner than v3 workarounds -->
<div class="max-sm:px-2 max-sm:text-sm">...</div>

<!-- Applies only between sm and md (tablet range) -->
<div class="sm:max-md:flex-row">...</div>
```

Use `max-sm:` where you want to cap behavior to mobile only, instead of writing both `sm:hidden` and a separate mobile version.

### Pattern: Flex Column Full-Height Layout (GameScreen Fix)

The GameScreen layout issue — content sitting small at the bottom — comes from `min-h-screen` combined with `flex-1` not distributing space correctly when the viewport height is miscalculated. The fix combines `min-h-dvh` with correct flex distribution:

```html
<!-- GameScreen outer container -->
<div class="flex flex-col min-h-dvh bg-... p-2 sm:p-4">
  <!-- Top bar: fixed height, never shrinks -->
  <div class="flex-shrink-0 relative flex items-center justify-center mb-3">...</div>

  <!-- Middle content: grows to fill available space -->
  <div class="flex-1 flex flex-col">...</div>

  <!-- Bottom action zone: fixed height, sticks to bottom -->
  <div class="flex-shrink-0 pb-[env(safe-area-inset-bottom,0px)]">...</div>
</div>
```

The `flex-1` section correctly fills the remaining viewport height once `min-h-dvh` is set, because `dvh` accounts for the actual visible viewport.

### Pattern: Overscroll Behavior (iOS Bounce Prevention)

iOS Safari allows elastic "bounce" scrolling past the page boundary. On a full-height game layout, this creates visual glitches (background flickers, layout jumps). Prevent it with:

```html
<div class="overscroll-none flex flex-col min-h-dvh">...</div>
```

`overscroll-none` maps to `overscroll-behavior: none` — Tailwind v4 built-in, no config needed. Apply to the GameScreen outer container.

---

## Supporting Libraries

**None required.** All techniques are expressible with:

- Native CSS properties (`dvh`, `svh`, `env()`, `overscroll-behavior`)
- Tailwind v4 built-in utilities (`min-h-dvh`, `h-svh`, `overscroll-none`, `max-sm:*`, breakpoint range variants)
- Browser DevTools and webaim.org for contrast auditing

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `min-h-screen` / `h-screen` on mobile page containers | Maps to `100vh` — sized against large viewport (browser UI hidden), causing layout overflow on initial mobile load | `min-h-dvh` on game screens, `min-h-svh` on static shells |
| `h-lvh` as `min-height` on containers | Always equals the largest possible viewport — guaranteed overflow on initial load when browser chrome is visible | `h-dvh` or `h-svh` depending on scroll behavior needed |
| White text on `corbusier-yellow` (#f5a623) | Fails WCAG AA (~1.9:1 contrast ratio — need 4.5:1) | Use dark `text-ink` / `text-charcoal` on yellow, or restrict yellow to decorative elements only |
| npm packages for contrast checking | Adds runtime weight; DevTools does the job natively for an audit | Chrome DevTools color picker + Lighthouse + webaim.org |
| `-webkit-overflow-scrolling: touch` | Deprecated property; modern iOS uses standard momentum scroll natively | Remove if present; no replacement needed |
| JavaScript `window.innerHeight` in React state for layout calculations | Creates re-renders on every scroll as browser chrome animates; causes jank | `dvh` CSS unit — browser handles viewport changes with no JS involvement |
| Global `overflow: hidden` on `body` or `html` to "fix" scroll issues | Prevents scrolling on iOS without `touch-action` handling; breaks modal scrolling | Use `overscroll-none` on specific containers |

---

## Stack Patterns by Screen

**GameScreen (full-height flex layout, interactive tiles at bottom):**
- `min-h-dvh` on outer container (replaces `min-h-screen`)
- `flex flex-col` with `flex-1` on the PlayerHand zone
- `overscroll-none` on outer container to prevent iOS bounce
- `pb-[env(safe-area-inset-bottom,0px)]` on the bottom action row

**ConfigScreen / LobbyScreen (scrollable content screens):**
- `min-h-dvh` on outer container
- Content scrolls naturally if it overflows — do not set fixed height
- `pb-[env(safe-area-inset-bottom,0px)]` on the last button section

**App.tsx loading/error states (static screens):**
- `min-h-svh` (conservative — never overflows on first paint)

**Fixed-position overlays (reconnecting/disconnect modals in GameScreen):**
- `fixed inset-0 h-dvh` — `inset-0` alone does not correct for dynamic viewport; add `h-dvh` explicitly
- `flex items-center justify-center` for centering

---

## Version Compatibility

| Feature | Tailwind v4 Status | Notes |
|---------|-------------------|-------|
| `min-h-dvh`, `h-dvh`, `h-svh`, `min-h-svh` | Built-in default | No `@theme` config required |
| `overscroll-none` | Built-in default | Maps to `overscroll-behavior: none` |
| `max-sm:` range variants | Built-in v4 | Replaces v3 workarounds; `max-sm:hidden` is the mobile-only pattern |
| `pb-[env(safe-area-inset-bottom,0px)]` | Works as arbitrary value | Tailwind passes arbitrary CSS expressions through unchanged |
| `@custom-variant dark` | Already in use | In `src/index.css` — no changes needed |
| `@theme { --color-* }` custom colors | Already in use | Existing setup is correct for v4 |

---

## Sources

- [Tailwind CSS Height Docs (v4)](https://tailwindcss.com/docs/height) — confirmed `h-dvh`, `h-svh`, `h-lvh` built-in, HIGH confidence
- [Tailwind CSS Min-Height Docs](https://tailwindcss.com/docs/min-height) — confirmed `min-h-dvh`, `min-h-svh` built-in, HIGH confidence
- [Tailwind CSS Responsive Design (v4)](https://tailwindcss.com/docs/responsive-design) — breakpoints unchanged from v3, `max-sm:` variant confirmed, HIGH confidence
- [Tailwind CSS v3.4 Release Notes](https://tailwindcss.com/blog/tailwindcss-v3-4) — origin of dvh/svh/lvh classes, carried into v4
- [web.dev: Large, small, and dynamic viewport units](https://web.dev/blog/viewport-units) — authoritative semantics for dvh/svh/lvh, Baseline Widely Available June 2025
- [MDN: CSS env()](https://developer.mozilla.org/en-US/docs/Web/CSS/env) — safe-area-inset documentation and browser support
- [WCAG 2.1 SC 1.4.3: Contrast Minimum](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html) — 4.5:1 normal text, 3:1 large text/UI, HIGH confidence
- [WCAG 2.5.8: Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) — 24×24 px AA, 44×44 px recommended
- [MDN: overscroll-behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overscroll-behavior) — iOS bounce prevention
- [Chrome DevTools Accessibility Reference](https://developer.chrome.com/docs/devtools/accessibility/reference) — contrast ratio in color picker confirmed
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) — reference tool for manual hex verification

---
*Stack research for: Word Chicken v1.1 UX/Design Audit*
*Researched: 2026-03-18*
