# Pitfalls Research

**Domain:** UX/design audit and fix pass on an existing mobile web game (Word Chicken v1.1)
**Researched:** 2026-03-18
**Confidence:** HIGH — all pitfalls grounded in actual source files; viewport and dark mode claims verified against official documentation and current community sources

---

## Critical Pitfalls

### Pitfall 1: Using `dvh` as the Fix for Viewport Height on Mobile Safari

**What goes wrong:**
`dvh` (dynamic viewport height) is frequently recommended as the modern replacement for the `100vh` iOS Safari address-bar bug. It is the wrong unit for an interactive game layout. `dvh` updates in real time as the browser chrome appears or disappears during scroll — so any container sized to `100dvh` will grow and shrink continuously. On the game screen, this makes the tile hand area (`justify-end pb-8`) shift vertically every time the user scrolls, and makes `ChickenOMeter` (`h-48 sm:h-64`) animate in height during gameplay without the `animate-pulse` transition being triggered intentionally.

The current codebase uses `min-h-screen` on both `App.tsx` (root wrapper) and `GameScreen.tsx` (outer container). `min-h-screen` resolves to `100vh`, which on iOS Safari is the large viewport height — the height when the address bar is hidden. This is why content sits small at the bottom on mobile load: the layout was sized assuming the address bar is gone, but the address bar is visible on first load.

**Why it happens:**
Developers search for "mobile Safari viewport fix" and find `dvh` cited as the solution everywhere. `dvh` does solve the initial-load sizing problem, but introduces continuous layout shift as a side effect. The game screen is not a scrollable page — it is a fixed-height interactive canvas where layout stability matters more than filling every pixel.

**How to avoid:**
Use `svh` (small viewport height) for the root layout container. `svh` represents the viewport height with all browser chrome visible — the minimum possible height. A layout sized to `min-h-svh` will never overflow the visible area on first load, and will never reflow when the address bar hides.

Concretely: change `min-h-screen` to `min-h-svh` in `App.tsx` (line 73, 82, 88) and in `GameScreen.tsx` (line 175). Do not use `dvh` on either. `dvh` is only correct for elements that should fill the current visible area and do not contain stable interactive regions — it is never correct for the game's root container.

For context: `svh`, `dvh`, and `lvh` all reached Baseline Widely Available status in June 2025. Safari 15.4+ supports all three.

**Warning signs:**
- The `PlayerHand` tile grid subtly shifts position as the user scrolls or the address bar hides
- The `ChickenOMeter` appears to grow or shrink mid-game on iPhone
- Layout shift visible in Chrome DevTools "Rendering > Layout Shift Regions" overlay
- Tile grid content is still cut off at initial load even after applying `dvh`

**Phase to address:** Phase 1 (Viewport foundation) — prerequisite for all other sizing work. All element sizing is relative to the root container, so this must be resolved before auditing element placement.

---

### Pitfall 2: `env(safe-area-inset-bottom)` Silently Returns Zero Without `viewport-fit=cover`

**What goes wrong:**
Adding `padding-bottom: env(safe-area-inset-bottom)` to the player hand area or staging submit button will appear to work in Chrome and Safari DevTools (which simulate the safe area regardless) but will return `0px` on every real iPhone with a home indicator. The fix looks correct locally and in CI, then breaks on device.

The current codebase does not yet use `env(safe-area-inset-bottom)` anywhere. This is the right state before `viewport-fit=cover` is confirmed. The risk is that the audit adds safe-area padding first and checks the meta tag second.

**Why it happens:**
`env(safe-area-inset-bottom)` is gated by the `viewport-fit=cover` viewport meta tag attribute per spec. Without it, the environment variable returns zero. DevTools viewport simulation does not enforce this gate. The result is a fix that works in the browser and is invisible in review, then silently fails on device.

**How to avoid:**
Step 1 is always: check and update `index.html` — `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">`. Do this in phase 1, before writing any safe-area CSS. Then use the pattern `padding-bottom: max(16px, env(safe-area-inset-bottom))` so there is always a fallback base padding on devices without a home indicator. Apply only where the user's thumb reaches: the bottom of the game screen's interactive area (staging area, player hand row). Do not apply to every element — spacing will look oversized on non-notched phones.

Verify on a real device by opening Safari's developer console (via macOS Safari > Develop > [device]) and evaluating `getComputedStyle(document.body).paddingBottom` — it must be non-zero on an iPhone with a home indicator.

**Warning signs:**
- "Submit Word" button in `StagingArea` is partially hidden behind the iPhone home indicator on device, but looks correct in DevTools
- `env(safe-area-inset-bottom)` evaluates to `0px` in Safari's element inspector on a real iPhone
- The padding appears correct in Chrome DevTools iPhone simulation but broken on a physical device

**Phase to address:** Phase 1 (Viewport foundation). Must be verified on a real device — not DevTools simulation — before the phase is signed off.

---

### Pitfall 3: Breaking the `PlayerHand` Tile Index Contract During Layout Cleanup

**What goes wrong:**
`PlayerHand.tsx` has a deliberate dual-layout: a `sm:hidden` mobile path using `splitIntoRows()` (3/4/3 keyboard grid) and a `hidden sm:flex` desktop path (flex-wrap). Both paths share the same `stagedIndices` state, which uses negative numbers for community tiles (current word letters, indices `-(i+1)`) and non-negative numbers for hand tiles. The two rendering branches use different key strategies: the mobile path uses `key={rowIdx}` per row, the desktop path uses `key={idx}` per tile.

If the layout is restructured to "clean up the duplication" — merging both branches into one shared component — it is easy to break the index contract. The wrong tile will be staged on tap, or community tiles (yellow) will be treated as hand tiles (concrete), or the scatter elimination animation will fire on the wrong tile.

**Why it happens:**
The dual layout looks like duplication and attracts cleanup reflex during an audit. But it exists because the two branches have meaningfully different data paths and key strategies. The duplication is load-bearing.

**How to avoid:**
Do not restructure `PlayerHand.tsx`'s core rendering logic during this UX audit. The audit scope is sizing, spacing, and visual polish — not internal component architecture. If tiles need to be smaller on mobile, change `size="md"` to `size="sm"` inside the existing mobile branch. If spacing needs adjustment, change `gap-1` inside the existing branches. Do not merge the two branches.

If tile layout changes are needed that go beyond size adjustments, test by playing through a complete round: stage community tiles (yellow), submit a word, verify hand replenishes, verify give-up eliminates the correct player. Do this before and after any structural change.

**Warning signs:**
- Tapping a tile stages a different letter than the one tapped
- Community tiles (yellow) appear to be treated as hand tiles after a layout change
- The scatter animation fires on the wrong tile when a player is eliminated
- `stagedIndices` contains mixed positive/negative values but the rendering branch no longer distinguishes them

**Phase to address:** Any phase that touches `PlayerHand.tsx`. Flag this file for extra caution in PR review — any layout change must be followed by a full interaction test, not just visual inspection.

---

### Pitfall 4: Dark Mode Contrast Regressions from Semi-Transparent `ink/N` Colors

**What goes wrong:**
The color system makes extensive use of opacity modifiers: `text-ink/30`, `text-ink/40`, `text-ink/50`, `bg-ink/5`, `border-ink/10`, `border-ink/30`. In light mode, `--color-ink` is `#3a3a3a` on `--color-surface` `#f2f0eb` — the baseline contrast is good and the muted values still pass. In dark mode, `--color-ink` flips to `#e0ddd8` on `--color-surface` `#1c1c24`. At 30% opacity, dark mode `ink/30` computes to approximately `rgba(224, 221, 216, 0.3)` over `#1c1c24` — this is roughly 1.5:1 contrast, well below the WCAG AA minimum of 4.5:1 for normal text and 3:1 for large text. Elements currently at `ink/30` or `ink/40` in dark mode will be effectively invisible on OLED displays.

Specific elements in the codebase at risk:
- `GameScreen.tsx` round counter `text-ink/30 text-[10px]` — nearly invisible in dark mode
- `StagingArea.tsx` placeholder "Tap tiles below" at `text-ink/30 text-sm` — invisible in dark mode
- `PlayerHand.tsx` error text path leads to `text-ink/40` states in the disabled UI
- `LobbyScreen.tsx` multiple `text-ink/50` and `text-ink/30` labels

Additionally, `bg-corbusier-yellow text-white` (used on "Medium" difficulty button and "Play a Friend" button) is approximately 2.7:1 contrast — this fails WCAG AA for normal-sized text regardless of dark mode.

**Why it happens:**
The opacity-modifier system works well in light mode because the surface is light beige with good contrast headroom. Applying identical opacity values in dark mode produces radically different computed contrast because the surface is now near-black. Dark mode contrast must be measured, not assumed.

**How to avoid:**
Do not simply bump `ink/30` to `ink/50` by feel — measure with a contrast tool. Use the Chrome Accessibility pane or Safari Accessibility Audit in dark mode (toggle the `.dark` class on the root div). Minimum thresholds:
- Decorative/secondary labels that communicate UI state must hit 4.5:1 or convert to an explicit color
- The round counter and word history labels must be readable — `text-ink/60` is the minimum starting point in dark mode, but verify the computed value
- The yellow-on-white buttons need an alternative: either use `text-ink` on yellow background (good contrast), or use a darker yellow variant

When auditing, check every `ink/N` class where N < 60 in dark mode.

**Warning signs:**
- In dark mode, the staging area shows "Tap tiles below" but it appears as the same color as the background
- The round counter `R1` is invisible in dark mode
- Any element with `text-ink/30` or `text-ink/40` fails a contrast checker in dark mode
- The "Medium" difficulty button is flagged by any accessibility audit as a contrast failure

**Phase to address:** Phase 3 (Color and contrast audit). Run contrast checks before and after every color change. Commit each screen's changes separately so regressions are individually traceable.

---

### Pitfall 5: iOS Safari Keyboard Trapping the Lobby Back Button

**What goes wrong:**
`LobbyScreen.tsx` contains a join-code `<input>` field. When a user taps it on iOS Safari, the virtual keyboard opens. iOS Safari resizes the visual viewport without resizing the layout viewport, then scrolls the layout viewport upward to keep the focused input visible. The "Back" button at the bottom of the lobby screen (`mt-8` below the input section) scrolls off the visual viewport, trapping users who decide not to join after typing a code.

This is a known iOS Safari behavior for all web apps. The current lobby layout is `min-h-screen` with a `max-w-md` container — the Back button at the bottom will scroll off-screen when the keyboard opens because the layout is taller than the visual viewport with keyboard.

**Why it happens:**
The problem only appears on real iOS devices, not in browser DevTools simulation. DevTools virtual keyboard simulation does not accurately reproduce how iOS Safari shifts the layout viewport. The bug is invisible during development.

**How to avoid:**
Do not add `position: fixed` to the Back button — that makes it jump when the keyboard opens (the fixed element is anchored to the layout viewport, which shifts). Instead, ensure the Back button is reachable via scroll. The layout is already a scrollable flow — confirm the `min-h-svh` root (after the viewport fix) allows the container to scroll naturally on small devices when the keyboard is open. Optionally, move the Back button to the top of the lobby screen (as a header back arrow) rather than the bottom, which eliminates the problem entirely.

If the meta tag includes `interactive-widget=resizes-content`, iOS resizes the layout viewport with the keyboard. Note: Apple's support for this attribute has been inconsistent — verify on device before relying on it.

**Warning signs:**
- On iPhone, tapping the join code input makes the Back button disappear
- Users cannot dismiss the lobby without submitting a code or reloading the page
- The issue is not reproducible in Chrome DevTools iPhone simulation

**Phase to address:** Phase 2 (Mobile layout audit). Must be tested on a real iPhone or via Safari on macOS with Responsive Design Mode and the virtual keyboard simulation.

---

### Pitfall 6: `overflow-hidden` as a Band-Aid Clips Intentional Animations

**What goes wrong:**
During a layout audit, elements that overflow their containers are tempting to "fix" by adding `overflow-hidden` to the container. In this codebase, several intentional animations require overflow to be visible:
- `animate-shake` on `StagingArea`'s tile row translates the element horizontally by ±6px — this will be clipped if the parent has `overflow-hidden`
- `hover:scale-110` on tiles in `TileCard.tsx` increases the tile by 10% — in a tight layout with a container that clips, this will be cut off
- `hover:-translate-y-0.5` on tiles lifts them 2px above their row — same clipping risk
- `entranceStyle()` in `PlayerHand.tsx` applies `translateY(20px)` at animation start — if the parent is `overflow-hidden`, tiles will appear to pop in from outside a masked region rather than slide in naturally

**Why it happens:**
Layout overflow (horizontal scrollbar, content spilling out of a card) and animation overflow (elements temporarily extending outside their natural bounds) look the same in DevTools. Applying `overflow-hidden` to the container fixes the layout problem but silently clips the animation, which may not be noticed until a full interaction test is run.

**How to avoid:**
When overflow is visible, identify the source before applying `overflow-hidden`. The source of horizontal overflow in a tile grid is almost always either too many tiles in a row for the viewport width, or a tile's `hover:scale-110` growing beyond the container. Fix the root: adjust the number of tiles per row via `splitIntoRows()`, reduce tile size at narrow viewports, or add `overflow-x-hidden` only at the scroll root (not on interactive containers). Never add `overflow-hidden` to a div that wraps `StagingArea` or the tile rows.

**Warning signs:**
- After adding `overflow-hidden` to a container, the shake animation on invalid word submission stops being visible
- Tile hover state is clipped at the row edge
- Tile entrance animation appears to start from inside the container boundary rather than from below

**Phase to address:** Any phase that modifies container structure in `GameScreen.tsx` or `PlayerHand.tsx`. Check animation behavior immediately after any container-level change.

---

### Pitfall 7: Dark Mode Class Applied to React Root Div Instead of `<html>` — Surface Bleed on Overscroll

**What goes wrong:**
In `App.tsx`, the `.dark` class is applied to the root `div` wrapper, not to the `<html>` or `<body>` element. On iOS Safari, overscrolling (pulling down past the top of the page or past the bottom) reveals the `<html>` background color, which is browser default white. In dark mode, this creates a jarring white flash above the dark game screen on any downward pull gesture. The effect is especially noticeable on the config screen which users may scroll.

**Why it happens:**
React apps add class names to their root div by convention. The dark mode implementation works correctly for all content within the React tree, but overscroll rubber-banding reveals the browser background that lies outside the React root.

**How to avoid:**
Either move the dark mode class to `<html>` (requires a DOM side effect — set `document.documentElement.classList.toggle('dark', darkMode)` in a `useEffect` in `App.tsx`), or add a global CSS rule:

```css
html:has(.dark) {
  background-color: var(--color-surface);
}
```

The second approach is safer because it requires no DOM manipulation outside the React tree. Note: `has()` selector support is Baseline 2023 — all target browsers support it.

Verify: in dark mode, on iOS Safari, pull down from the top of the config screen. The pulled-down area must show dark surface, not white.

**Warning signs:**
- In dark mode, pulling down from the top of the config screen shows a white background flash
- The game screen's bottom edge shows white when overscrolled on a short page
- `document.documentElement` does not have the `dark` class when dark mode is active

**Phase to address:** Phase 1 (Viewport foundation) or Phase 3 (Color audit) — it is a one-line fix but must be verified on device. Logically fits with viewport setup since it is a root-level concern.

---

## Technical Debt Patterns

Shortcuts that seem reasonable during the audit but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using `!important` to override an existing Tailwind class | Fast fix for a one-off visual issue | Creates a specificity arms race; next audit needs more overrides | Never — fix class order or extract a component instead |
| Hardcoding pixel values in `style={}` props to fix a size | Bypasses the theme system | Not responsive, not themed, breaks on font size changes | Only for animation transform values needing runtime computation (`scatterStyle`, `entranceStyle`) — existing uses are correct |
| Adding `overflow-hidden` to hide a clipping artifact | Instantly removes the visual artifact | Clips `hover:scale-110`, `animate-shake`, and tile entrance animations | Only if the container genuinely must never show overflow — not as a band-aid |
| Fixing mobile with a `sm:` breakpoint class without auditing the base | Looks fixed on desktop | The base class is still wrong; 375px phones are not fixed | Never — fix the base class, then add `sm:` on top |
| Increasing a color's opacity from `ink/30` to `ink/60` by feel without measuring | Passes visual review | Contrast may still fail WCAG; the specific value is untested | Never — always verify the computed contrast ratio |

---

## Integration Gotchas

Common mistakes when connecting layout changes to the existing game's interactive logic.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| `TileCard.tsx` sizing | Removing `min-w-[44px] min-h-[44px]` when reducing tile visual size | Keep `min-w-[44px] min-h-[44px]` — it is the touch target floor and must not be removed. If tiles need to be smaller visually, use `w-8 h-8 text-sm` but keep the min-size constraint |
| `ChickenOMeter` height | Changing `h-48` to save vertical space without checking the parent flex context | The meter sits inside a `flex items-center flex-shrink-0` — it will not collapse the layout. If space is needed on small screens, use `h-36 sm:h-48` rather than removing the meter |
| `SharedWordDisplay` padding | Adding vertical padding to the word display component | A 12-letter word already wraps to two rows on narrow screens — extra padding pushes the word above the fold. Test with a 14-letter word at 375px width before adding any vertical margin |
| Dark mode in `App.tsx` | Moving `.dark` from the root div to `<html>` without updating the Tailwind `@custom-variant dark` selector | The current Tailwind config defines `@custom-variant dark (&:where(.dark, .dark *))` which scopes dark mode to any element inside `.dark` — changing the class location changes the selector scope. Verify the variant still applies after any structural change |
| `StagingArea` submit button | Wrapping the staging area in a `position: sticky` container to keep the submit button visible | Sticky inside a `flex-col` game layout can cause the staging area to visually detach from the tile grid during scroll. Keep staging area and tile grid in the same flow unless the design specifically requires them to scroll independently |

---

## Performance Traps

Patterns specific to the game's CSS and animation that cause jank.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| `transition-all` on flex container divs | Every CSS property (including layout-triggering `width`, `height`, `padding`) animates, causing reflow on every tile tap | Use `transition-transform transition-opacity` on individual tiles, never `transition-all` on flex containers | Immediately visible as jank on mid-range phones |
| Replacing `flex-1` with fixed heights in the game layout | `PlayerHand` collapses or the three-column middle section loses its height distribution | Audit whether `flex-1` is load-bearing before replacing — in `GameScreen.tsx` line 203, `flex-1` keeps the middle section filling remaining space | Any tile layout change without understanding the flex hierarchy |
| `dvh` on the root container | Continuous layout shift as address bar hides/shows during tile interaction | Use `svh` instead | Every scroll event on mobile Safari |
| Animating `min-height` or `height` via CSS transitions on the `SharedWordDisplay` | Causes layout reflow on every word submission | Only animate `transform` and `opacity` — never layout-affecting properties in the game's critical path | Immediately visible as jank at the moment of word submission |

---

## UX Pitfalls

Common experience mistakes specific to this game's interaction model when applying design fixes.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Reducing tile touch target below 44px to fit more on narrow screens | Players mis-tap and stage wrong tiles; in a word game this causes accidental submissions | Reduce tile visual size with `w-8 h-8` if needed; always keep `min-w-[44px] min-h-[44px]` as the hit area |
| De-emphasizing the staged/disabled tile state to "clean up" the visual | Players can't tell which tiles are committed and re-tap to unstage accidentally | The current `opacity-50 cursor-not-allowed` on staged tiles is semantically load-bearing — if changed, the new state must clearly communicate "tile is committed" |
| Changing the error text from red to a softer palette color | Invalid word feedback becomes ambiguous — users cannot tell if the word was accepted or rejected | Keep `text-corbusier-red` for all error states. The Corbusier red is semantically load-bearing, not merely aesthetic |
| Making the Quit button larger as a touch target improvement | The quit button is intentionally small (`text-xs text-ink/40`) — enlarging it increases accidental game abandonment | If touch target is genuinely insufficient, expand the hit area with `p-4` on the button without changing its visual size |
| Adding horizontal scroll to the word display to accommodate long words | Mobile users will accidentally trigger horizontal scroll when trying to tap tiles | Fix tile sizing and wrapping at the source; the `flex-wrap` on `SharedWordDisplay` already handles long words with two-row wrapping |

---

## "Looks Done But Isn't" Checklist

Things that appear complete in browser DevTools but have real-device failure modes.

- [ ] **Viewport fix:** `min-h-svh` (or equivalent) tested on a real iPhone — verify the player hand is fully visible without scrolling on iPhone SE (375px wide, 667px tall) with the address bar visible
- [ ] **Safe-area insets:** `viewport-fit=cover` confirmed in `index.html` meta tag before any `env(safe-area-inset-bottom)` CSS is written; verify on device that the value is non-zero
- [ ] **Dark mode contrast:** Every `text-ink/30`, `text-ink/40`, and `text-ink/50` element measured with a contrast tool in dark mode — not eyeballed
- [ ] **Yellow-on-white contrast:** `bg-corbusier-yellow text-white` on "Medium" and "Play a Friend" buttons verified for contrast ratio (currently ~2.7:1 — likely fails for body text)
- [ ] **Lobby keyboard trap:** Join code input tested on real iOS — Back button must remain accessible with virtual keyboard open
- [ ] **Tile touch targets:** After any tile size change, verify `min-w-[44px] min-h-[44px]` still appears in the compiled CSS (Tailwind v4 purges unused classes — if the class doesn't appear in JSX it will be dropped)
- [ ] **Animation integrity:** After any container restructure, verify `animate-shake` on `StagingArea`, `animate-pulse` on `ChickenOMeter`, and tile `entranceStyle` slide-in still fire correctly
- [ ] **PvP overlay coverage:** The reconnecting and disconnected overlays in `GameScreen.tsx` use `fixed inset-0` — verify these still cover the full viewport after any root layout change
- [ ] **Word wrap at long words:** Test a 14-letter word in `SharedWordDisplay` at 375px width — tiles must wrap to two rows without horizontal overflow
- [ ] **Dark mode surface bleed on overscroll:** On iOS Safari in dark mode, pull down from the top of the config screen — the pulled-down area must show dark surface, not white

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| `dvh` reflow jitter introduced | LOW | Switch `min-h-dvh` back to `min-h-svh` in `App.tsx` and `GameScreen.tsx` — single-line change each |
| Tile interaction broken after PlayerHand restructure | MEDIUM | Revert `PlayerHand.tsx` via git to prior working state; do not attempt surgical fix — the index contract is too complex for incremental repair; re-approach with incremental visual-only changes only |
| Dark mode contrast regression across many components | MEDIUM | Use `git diff` to audit every `text-ink/N` change; revert opacity values to originals; re-approach one component at a time with a contrast checker tool open |
| `env(safe-area-inset-bottom)` silently returning zero | LOW | Add `viewport-fit=cover` to `index.html` viewport meta tag; verify in Safari device console |
| Lobby Back button trapped off-screen by keyboard | LOW | Remove any added `fixed` or `sticky` positioning from bottom elements; confirm the screen is a simple scrollable flow |
| `overflow-hidden` clipping `animate-shake` | LOW | Remove `overflow-hidden` from the parent of `StagingArea`; identify the actual overflow source (likely `hover:scale-110` on a tile) and scope the fix to that element |
| Dark surface bleed on overscroll | LOW | Add `document.documentElement.classList.toggle('dark', darkMode)` in `App.tsx` `useEffect`, or add a `html:has(.dark) { background-color: var(--color-surface) }` global CSS rule |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| `dvh` reflow jitter | Phase 1: Viewport foundation | Scroll during active gameplay on real iPhone; confirm no vertical shift in tile grid |
| `env()` zero without `viewport-fit=cover` | Phase 1: Viewport foundation | Inspect `env(safe-area-inset-bottom)` in Safari console on device; must be non-zero on iPhone with home indicator |
| `PlayerHand` tile index contract | Phase 2: Mobile layout audit | Full round interaction test after any change to `PlayerHand.tsx` — stage community tiles, submit word, give up |
| Dark mode contrast regressions | Phase 3: Color/contrast audit | Chrome or Safari accessibility audit in dark mode; all text must achieve 4.5:1 normal / 3:1 large minimum |
| iOS keyboard trapping Lobby Back | Phase 2: Mobile layout audit | Real iPhone test — tap join code input, confirm Back button is reachable with keyboard open |
| `overflow-hidden` clipping animations | Any phase touching container structure | After every container change, trigger `animate-shake` (submit invalid word) and verify shake is visible |
| Dark mode surface bleed | Phase 1 or Phase 3 | iOS Safari overscroll in dark mode; pulled-down area must be dark surface |
| Yellow-on-white contrast | Phase 3: Color/contrast audit | Contrast checker on "Medium" difficulty and "Play a Friend" buttons; must pass 3:1 for large bold text |

---

## Sources

- CSS viewport units svh/dvh/lvh explained — https://www.bram.us/2021/07/08/the-large-small-and-dynamic-viewports/
- iOS 26 fixed positioning after keyboard interaction — https://iifx.dev/en/articles/460201403/
- iOS Safari dvh issue on Apple Developer Forums — https://developer.apple.com/forums/thread/803987
- iOS Safari virtual keyboard and position:fixed — https://medium.com/@im_rahul/safari-and-position-fixed-978122be5f29
- `env()` MDN reference — https://developer.mozilla.org/en-US/docs/Web/CSS/env
- Safe-area-inset practical implementation guide — https://jipfr.nl/blog/supporting-ios-web/
- WCAG AA contrast guide 2025 — https://www.allaccessible.org/blog/color-contrast-accessibility-wcag-guide-2025
- Tailwind v4 dark mode configuration — https://windybase.com/blog/how-to-add-dark-mode-in-tailwind-css
- CSS refactoring regression testing — https://www.smashingmagazine.com/2021/08/refactoring-css-strategy-regression-testing-maintenance-part2/
- Mobile UX audit interaction flaws — https://www.brandvm.com/post/mobile-ux-audit-fixes
- Codebase: `src/App.tsx`, `src/index.css`, `src/screens/GameScreen.tsx`, `src/screens/ConfigScreen.tsx`, `src/screens/LobbyScreen.tsx`, `src/components/PlayerHand.tsx`, `src/components/StagingArea.tsx`, `src/components/TileCard.tsx`, `src/components/ChickenOMeter.tsx`, `src/components/SharedWordDisplay.tsx`

---
*Pitfalls research for: Word Chicken v1.1 UX/design audit pass*
*Researched: 2026-03-18*
