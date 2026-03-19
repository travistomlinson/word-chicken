# Project Research Summary

**Project:** Word Chicken v1.1 — UX/Design Audit and Fix Pass
**Domain:** Mobile-first word/tile game — CSS layout, accessibility, and visual polish
**Researched:** 2026-03-18
**Confidence:** HIGH

## Executive Summary

Word Chicken v1.1 is a CSS-only design milestone on an already-functional game. All game mechanics, multiplayer logic, and state management are complete and working. The research scope is entirely about correcting mobile layout breakage and accessibility failures in the existing UI — no new features, no new dependencies. The existing stack (React 18, Vite, Tailwind v4, Zustand, PeerJS, Vitest) is confirmed adequate. Every fix identified in research is expressible with native CSS properties and Tailwind v4 built-in utilities.

The root cause of all layout issues is a single decision: every screen container uses `min-h-screen`, which resolves to `100vh`. On mobile browsers, `100vh` equals the large viewport height (address bar hidden), but the address bar is visible on first load, making the visible area shorter than the layout assumed. This causes game content to cluster at the top or bottom depending on flex direction and causes interactive elements to fall outside thumb reach. The fix — replacing `min-h-screen` with `h-svh flex flex-col` on the `App` root and converting screens to `flex-1` children — is a structural prerequisite for every other layout fix in the audit.

The secondary concerns are accessibility failures that are independently significant: white text on Corbusier yellow (`#f5a623`) fails WCAG AA by a wide margin (~2.1:1 against the required 4.5:1); low-opacity text tokens (`text-ink/30`, `text-ink/40`) fail WCAG AA in dark mode; and several secondary action buttons (Quit, Give Up, Show a Word) have effective touch targets of 24-30px against the 44px standard. These are not cosmetic — they represent real barriers to use on mobile. All P1 accessibility items should be addressed in the same pass as layout fixes, since both classes of change touch the same files.

## Key Findings

### Recommended Stack

No new dependencies are needed. The current stack fully supports all required CSS techniques. Tailwind v4 ships `min-h-dvh`, `min-h-svh`, `h-dvh`, `overscroll-none`, and `max-sm:` range variants as built-in utilities with zero configuration. The `env(safe-area-inset-*)` CSS function is supported by all target browsers and can be used directly via Tailwind arbitrary value syntax (`pb-[env(safe-area-inset-bottom,0px)]`). For contrast auditing, Chrome DevTools color picker and WebAIM's contrast checker are sufficient — no npm audit packages are needed.

See [STACK.md](STACK.md) for full technique reference, Tailwind class-by-class mapping, and browser support table.

**Core techniques:**
- `h-svh flex flex-col` on App root: stable viewport sizing — resolves to smallest possible height (address bar visible), eliminating mobile overflow on first paint. Screens grow via `flex-1`.
- `min-h-0` on flex containers: load-bearing — without it, `flex-1` children overflow their bounds instead of fitting within the allotted space.
- `viewport-fit=cover` in `index.html`: required gate before any `env(safe-area-inset-bottom)` CSS will return a non-zero value on real iOS devices.
- `text-charcoal` on yellow backgrounds: `#3a3a3a` on `#f5a623` achieves ~7.5:1 contrast vs the current ~2.1:1 with white text.
- `html:has(.dark)` CSS rule: fixes dark mode surface bleed on iOS overscroll without DOM manipulation outside the React tree.

### Expected Features (UX Patterns for This Audit)

This is a design audit, not a feature build. "Features" here are UX design patterns that mobile game users expect. All game mechanics already exist.

See [FEATURES.md](FEATURES.md) for full prioritization matrix and reference game analysis (Wordle, Scrabble GO).

**Must fix (P1 — table stakes, currently broken or failing accessibility):**
- Viewport fills the visible screen with no wasted space or layout overflow on mobile load
- Primary actions (Submit, staging area) reliably land in the bottom thumb zone of the screen
- No interactive content clipped by iPhone notch or home indicator gesture zone
- All secondary action buttons (Quit, Give Up, Show a Word) have minimum 44px touch targets
- Dark mode text contrast passes WCAG AA — `text-ink/30` and `text-ink/40` currently fail

**Should fix (P2 — polish, meaningful improvement):**
- Turn indicator has clear visual dominance over other top-bar elements (currently same visual weight as round counter and Quit)
- Score panel distinguishes round score (primary) from total score (secondary)
- RoundEndCard uses overlay pattern consistent with GameOverScreen (currently inline, not modal)
- Chicken-O-Meter widened from 20px (w-5) to 32-40px (w-8 to w-10) to read as a tension indicator
- Staged tiles have clearer "taken" visual distinction in the PlayerHand (current opacity-50 is too subtle)

**Defer to v1.2+ (P3 — validate demand before building):**
- Animated screen transitions between config/lobby/game
- Word history mobile drawer
- Lobby keyboard-aware layout (minor edge case — test on real device to confirm severity before committing)

### Architecture Approach

The architecture requires one structural change that cascades through all screens: `App.tsx` must own the viewport with `h-svh flex flex-col overflow-hidden`, and each screen must become a `flex-1` child that inherits the definitively-sized container. Currently each screen declares its own `min-h-screen` independently — this is the architectural source of the layout bugs. Once App owns the viewport, GameScreen becomes `flex-1 overflow-hidden`, ConfigScreen and LobbyScreen become `flex-1 overflow-y-auto`, and `PlayerHand`'s inner `flex-1 min-h-0` containers correctly constrain their children.

All other changes are token fixes in `index.css` (contrast corrections, adding `.chicken-gradient` CSS class, `html:has(.dark)` rule) or class tweaks on individual components (touch target padding, opacity floor increases). The Tailwind v4 token architecture is already correctly structured — no changes to the CSS system design are needed.

See [ARCHITECTURE.md](ARCHITECTURE.md) for component responsibility table, build order, and data flow diagrams.

**Build order (dependency-constrained):**
1. `App.tsx` — viewport shell (`h-svh flex flex-col overflow-hidden`)
2. `GameScreen.tsx` — remove `min-h-screen`, add `flex-1 overflow-hidden` and `min-h-0` on middle section
3. `PlayerHand.tsx` — audit `justify-end pb-8` behavior on short viewports after container fix
4. `ConfigScreen.tsx` + `LobbyScreen.tsx` — `flex-1 overflow-y-auto`
5. `index.css` — opacity floor increase sitewide, `.chicken-gradient` class, `html:has(.dark)` rule
6. `TileCard.tsx` — yellow tile text color `text-white` → `text-charcoal`
7. `ChickenOMeter.tsx` — apply `.chicken-gradient` class, widen component
8. Screen-specific polish — any order after steps 1-7

### Critical Pitfalls

See [PITFALLS.md](PITFALLS.md) for full detail, warning signs, recovery strategies, and a "Looks Done But Isn't" device checklist.

1. **`dvh` reflow jitter on iOS Safari** — `dvh` updates continuously as the address bar shows/hides, causing the tile grid and ChickenOMeter to shift during gameplay. Use `svh` on the root `App` shell. `dvh` is appropriate on individual screen containers where dynamic recalculation is acceptable.

2. **`env(safe-area-inset-bottom)` silently returns zero** — This function returns `0px` on all real iOS devices unless `viewport-fit=cover` is present in the viewport meta tag. DevTools simulation does not enforce this gate. Add `viewport-fit=cover` to `index.html` before writing any safe-area padding CSS, and verify on a physical device.

3. **Breaking `PlayerHand` tile index contract** — `PlayerHand.tsx` has a deliberate dual-layout (mobile 3/4/3 rows vs desktop flex-wrap) with different key strategies and a negative-index convention for community tiles. The duplication is load-bearing. During this audit, change only sizing and spacing within the existing branches — do not merge them.

4. **Dark mode contrast regressions from `ink/N` opacity tokens** — `text-ink/30` on the dark surface computes to approximately 1.5:1 contrast — effectively invisible on OLED displays. Do not bump opacity values by feel. Measure every `ink/N` class where N < 60 with a contrast tool in dark mode before shipping.

5. **`overflow-hidden` clipping intentional animations** — `animate-shake` on StagingArea, `hover:scale-110` on tiles, and `entranceStyle` translateY all require overflow-visible on their parent containers. Adding `overflow-hidden` to suppress a layout artifact will silently clip these animations. Identify the actual overflow source before applying containment.

## Implications for Roadmap

All research converges on a four-phase structure with strict dependency ordering. Structural layout fixes must precede component-level polish. Several items are invisible in DevTools and require real iOS device verification before a phase can be signed off.

### Phase 1: Viewport Foundation

**Rationale:** Every other layout measurement in the audit is relative to the viewport container. Fixing individual component positions without correcting the root container produces inconsistent results across device sizes. This phase is a prerequisite for all other work.

**Delivers:** Correct full-screen layout on all mobile browsers; no content overflow or layout shift from browser chrome; iOS overscroll dark mode surface bleed eliminated.

**Addresses:** Viewport fills screen (P1), no content clipped by device edges (P1), `viewport-fit=cover` gate for safe-area work, `html:has(.dark)` overscroll fix.

**Implements:** `h-svh flex flex-col overflow-hidden` on App, `flex-1 overflow-hidden` on GameScreen, `flex-1 overflow-y-auto` on ConfigScreen/LobbyScreen, `min-h-0` on middle flex containers, `viewport-fit=cover` in `index.html`.

**Avoids:** `dvh` reflow jitter pitfall, `env()` silent-zero pitfall.

**Research flag:** Standard patterns — no research pass needed. Tailwind v4 class mapping is fully documented in STACK.md.

### Phase 2: Mobile Layout and Touch Audit

**Rationale:** Component-level layout and touch target corrections require a stable viewport baseline from Phase 1. PlayerHand changes carry the highest regression risk (tile index contract) and should be isolated with full interaction testing. Safe-area padding can only be verified on a real device.

**Delivers:** All interactive elements reachable by thumb; no content clipped by home indicator; PlayerHand correctly anchored to the bottom third of the screen on all device heights; all secondary buttons at 44px minimum.

**Addresses:** Primary actions in thumb zone (P1), touch targets 44px minimum (P1), safe-area bottom padding (P1).

**Implements:** `pb-[env(safe-area-inset-bottom,0px)]` on GameScreen bottom zone, `min-h-[44px]` + padding expansion on Give Up / Show a Word / Quit / How to Play link, PlayerHand flex restructure if needed after Phase 1 validation.

**Avoids:** PlayerHand tile index contract breakage (only change sizing/spacing within existing branches), `overflow-hidden` animation clipping.

**Research flag:** Requires device verification at phase gate — safe-area insets and lobby keyboard trap are DevTools-invisible. Must test on real iOS before signing off.

### Phase 3: Color and Contrast Audit

**Rationale:** Color token work is independent of layout and can be developed in parallel with Phase 2, but should be committed after layout is stable so contrast is verified against final rendered colors. Token changes in `index.css` are cross-cutting and affect every component using the semantic color system simultaneously.

**Delivers:** WCAG AA compliance for all text in both light and dark mode; Corbusier yellow safe for use as background with dark text; ChickenOMeter gradient connected to the CSS token system.

**Addresses:** Dark mode contrast audit (P1), yellow-on-white contrast fix (P1), opacity floor increase sitewide (P1), ChickenOMeter gradient token fix.

**Implements:** `text-charcoal` on yellow tile backgrounds and yellow buttons, `text-ink/30` → `text-ink/50` minimum floor sitewide, `.chicken-gradient` CSS class using `var(--color-corbusier-*)` tokens, ChickenOMeter width increase (w-8 to w-10).

**Avoids:** Bumping opacity values by feel — every `ink/N` class must be measured with a contrast tool in dark mode.

**Research flag:** Standard tooling — Chrome DevTools Accessibility pane + WebAIM contrast checker. No research pass needed.

### Phase 4: Visual Polish and Hierarchy

**Rationale:** Component-level polish items (ScorePanel, TurnIndicator, RoundEndCard, StagingArea) are safe to tackle in any order once layout and color are correct. They depend on the corrected layout for accurate visual measurements but are mutually independent.

**Delivers:** Turn state visually dominant in the top bar; round/total score hierarchy clear at a glance; RoundEndCard as overlay consistent with GameOverScreen; staged tile "taken" state unambiguous in the PlayerHand.

**Addresses:** Turn indicator visual weight (P2), score panel hierarchy (P2), RoundEndCard overlay (P2), staged tile "taken" signal (P2).

**Avoids:** Animated screen transitions (confirmed anti-feature — within-screen animations carry the polish, screen switches should be instant), word history on mobile (confirmed anti-feature — hidden on mobile is correct), floating action button for Submit (confirmed anti-feature).

**Research flag:** Standard CSS-only component tweaks — no research pass needed.

### Phase Ordering Rationale

- Phase 1 is a strict prerequisite: `flex-1` height distribution in all later phases only works correctly once the root container has a definite, correct height.
- Phase 2 after Phase 1: safe-area padding and PlayerHand bottom-anchor behavior can only be verified against the corrected viewport.
- Phase 3 can partially overlap Phase 2: `index.css` token changes and TileCard yellow fix are independent of GameScreen layout work and can be developed in parallel — commit after Phase 2 is stable.
- Phase 4 is independent of Phase 3 except that color contrast should be verified in final rendered positions — run after Phase 3 is committed.

### Research Flags

Phases requiring device testing at gate (not additional research):
- **Phase 1:** Verify `h-svh` layout on real iPhone SE (375px wide, 667px tall) with address bar visible — confirm PlayerHand is in viewport and no content overflows
- **Phase 2:** Verify `env(safe-area-inset-bottom)` is non-zero in Safari device console; confirm lobby Back button accessible with virtual keyboard open
- **Phase 3:** Measure all `ink/N` contrast ratios in dark mode — do not estimate or eyeball

Phases with standard patterns (skip research-phase):
- **Phase 1:** Tailwind v4 viewport units fully documented in STACK.md
- **Phase 3:** Chrome DevTools + WebAIM for contrast verification — established tooling
- **Phase 4:** CSS-only component tweaks — no new patterns introduced

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All techniques verified against official Tailwind v4 docs and MDN. Browser support confirmed at 95%+ for dvh/svh/env() via Baseline Widely Available June 2025. No new dependencies. |
| Features | HIGH | Viewport and touch target standards backed by WCAG, Apple HIG, and Material Design. Game UI hierarchy patterns from Wordle and Scrabble GO reference analysis rated MEDIUM — directionally sound, not from primary standards. |
| Architecture | HIGH | Based on direct codebase reading of actual source files. Component responsibilities, build order, and identified failure modes are all grounded in the real code, not inferred. Tailwind v4 behavior verified against official docs. |
| Pitfalls | HIGH | All 7 pitfalls grounded in actual source files with specific file and line references. Viewport, dark mode, and animation pitfalls verified against official documentation and current community sources. |

**Overall confidence: HIGH**

### Gaps to Address

- **PlayerHand short-viewport behavior:** The correct fix for `justify-end pb-8` on short devices (iPhone SE 667px) depends on measuring the actual rendered height of the StagingArea + tile rows + action buttons stack. This cannot be determined from code reading alone — must be measured in-browser during Phase 2 before choosing between `justify-center`, `overflow-y-auto`, or leaving `justify-end` with adjusted padding.

- **Lobby keyboard trap severity:** The iOS virtual keyboard interaction is classified P3 but is a real-device-only bug. During Phase 2, test on a physical iPhone before deciding whether to address in v1.1 or defer. If the Back button is inaccessible with the keyboard open, the low-effort fix (move Back button to top of lobby) should ship in v1.1.

- **Yellow contrast option selection:** Three fix options exist for yellow buttons (dark text on yellow, darken yellow, replace with blue). The chosen option should be confirmed against design intent for the Corbusier palette before implementing in Phase 3. Dark text on yellow is the least disruptive to brand identity.

- **Chicken-O-Meter width impact:** Widening from `w-5` (20px) to `w-8` or `w-10` (32-40px) affects the three-column middle section of GameScreen. Validate the exact width against a 375px viewport during Phase 2 to confirm adequate space remains for PlayerHand. If space is tight, a horizontal bar below SharedWordDisplay is an alternative — but requires more layout work.

## Sources

### Primary (HIGH confidence)
- [Tailwind CSS v4 Height Docs](https://tailwindcss.com/docs/height) — `h-dvh`, `h-svh`, `h-lvh` built-in utilities confirmed
- [Tailwind CSS v4 Min-Height Docs](https://tailwindcss.com/docs/min-height) — `min-h-dvh`, `min-h-svh` confirmed built-in
- [Tailwind CSS v4 Theme Docs](https://tailwindcss.com/docs/theme) — `@theme` token behavior, `.dark {}` override pattern confirmed
- [Tailwind CSS v4 Dark Mode Docs](https://tailwindcss.com/docs/dark-mode) — `@custom-variant dark` confirmed correct pattern
- [web.dev: Large, small, and dynamic viewport units](https://web.dev/blog/viewport-units) — dvh/svh/lvh semantics, Baseline Widely Available June 2025
- [MDN: CSS env()](https://developer.mozilla.org/en-US/docs/Web/CSS/env) — safe-area-inset documentation and browser support
- [MDN: overscroll-behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overscroll-behavior) — iOS bounce prevention
- [WCAG 2.1 SC 1.4.3: Contrast Minimum](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html) — 4.5:1 normal text, 3:1 large/UI
- [WCAG 2.5.8: Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) — 24x24 AA minimum, 44x44 recommended
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) — contrast ratio verification tool
- Direct codebase reading: `src/App.tsx`, `src/index.css`, `src/screens/GameScreen.tsx`, `src/screens/ConfigScreen.tsx`, `src/screens/LobbyScreen.tsx`, `src/components/PlayerHand.tsx`, `src/components/TileCard.tsx`, `src/components/ChickenOMeter.tsx`

### Secondary (MEDIUM confidence)
- [LogRocket: Improving mobile design with CSS viewport units](https://blog.logrocket.com/improving-mobile-design-latest-css-viewport-units/) — dvh practical usage
- [Smashing Magazine: Accessible tap target sizes](https://www.smashingmagazine.com/2023/04/accessible-tap-target-sizes-rage-taps-clicks/) — touch target standards
- [Smashing Magazine: The Thumb Zone](https://www.smashingmagazine.com/2016/09/the-thumb-zone-designing-for-mobile-users/) — thumb-zone positioning guidance
- [bram.us: Large, small, and dynamic viewports](https://www.bram.us/2021/07/08/the-large-small-and-dynamic-viewports/) — svh vs dvh practical distinction
- [iOS Safari dvh jank](https://iifx.dev/en/articles/460170745/fixing-ios-safari-s-shifting-ui-with-dvh) — dvh reflow jitter on iOS Safari confirmed
- [Safe-area-inset practical guide](https://jipfr.nl/blog/supporting-ios-web/) — `viewport-fit=cover` gate behavior confirmed
- Wordle and Scrabble GO design analysis — game UI hierarchy patterns

### Tertiary (LOW confidence)
- None — all findings cross-verified against primary or multiple secondary sources.

---
*Research completed: 2026-03-18*
*Ready for roadmap: yes*
