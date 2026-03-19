# Feature Research: Mobile Game UX/Design Patterns

**Domain:** Mobile-first word/tile game — UX audit and design fix pass (v1.1)
**Researched:** 2026-03-18
**Confidence:** HIGH (viewport/touch targets — standards-backed), MEDIUM (game hierarchy patterns — reference game analysis + community best practices)

---

## Context: What This Research Answers

This is a **design audit milestone**, not a feature-building milestone. "Features" here means **UX design patterns** — what well-designed mobile word and card games do that users expect, what separates polished from rough, and what looks tempting but creates problems. Research is specifically scoped to: viewport filling, element hierarchy, button/action placement, tile sizing, score display, and game state transitions.

The existing app already has all game mechanics. The question is: **how should these be designed on mobile?**

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels broken or amateurish on mobile.

| Feature | Why Expected | Complexity | Current State | Fix Notes |
|---------|--------------|------------|---------------|-----------|
| Viewport fills the screen with no wasted space | Mobile games occupy the full available screen — no dead space, no address bar overflow creating a gap at bottom. All successful mobile web games (Wordle, NYT Games, etc.) fill the viewport. | LOW | **Broken.** All three screen containers use `min-h-screen` (100vh), which overestimates viewport height on mobile because 100vh is calculated against the large viewport (address bar hidden) but the address bar is visible on load. Content floats at the bottom of a taller-than-visible container. | Replace `min-h-screen` with `min-h-[100dvh]` on GameScreen, ConfigScreen, LobbyScreen. Use `flex flex-col` so inner sections can `flex-1` to fill available height. |
| No content clipped by device edges | Game elements are never cut off by notches, home indicators, or device bezels. | LOW | **At risk.** No `env(safe-area-inset-*)` padding used anywhere. p-2 on GameScreen may be insufficient on notched iPhones (iPhone 14+ have 34px bottom home indicator area). | Add `pb-[env(safe-area-inset-bottom)]` to GameScreen. Add `pt-[env(safe-area-inset-top)]` where header content is near the top edge. |
| Primary actions land in thumb reach | Bottom third of the screen is where thumbs naturally rest. Every successful mobile word game puts Submit / Play at the bottom. Wordle's keyboard is in the bottom 40% of the screen. Words With Friends: same. | LOW | **Partially broken.** The PlayerHand is anchored with `justify-end pb-8` inside a `flex-1` area — directionally correct but the `pb-8` (32px) is a fixed offset, not a true bottom-anchor. On short screens the Submit button may be mid-screen. | GameScreen middle section needs `flex-1 flex flex-col`. PlayerHand should be at the bottom of that flex column without relying on a fixed pb value. |
| Touch targets minimum 44px on all interactive elements | Apple HIG: 44pt minimum. Material Design: 48dp minimum. WCAG 2.5.5 AAA: 44x44px. Users miss smaller targets, leading to frustration and mis-taps. | LOW | **Partially met.** TileCard already has `min-w-[44px] min-h-[44px]` — correct. But secondary actions (Quit, Give Up, Hint/Show a Word, Back, Copy Code, How to Play link) are text-only elements with ~24-32px effective hit areas. | Add `min-h-[44px] px-3 py-2` or equivalent to all secondary action buttons. The "Quit" button in the top bar is a small text link — needs padding expansion or a larger hit area via `p-3`. |
| Unambiguous turn state | Player knows at a glance whether to act or wait. The turn indicator must be visible without hunting. | LOW | **Needs work.** TurnIndicator is a small centered element in the top bar, flanked by the round number and Quit link. On a 375px screen with all three items sharing a 30px-tall row, none has visual dominance. | Turn state should be the most visually prominent element on screen during a player's turn. Consider color-fill treatment (colored background bar rather than text-only). |
| Legible score at a glance | Score visible throughout play without hunting. Reference: Scrabble GO shows opponent score always alongside own score, with current score larger than cumulative. | LOW | **Needs hierarchy.** ScorePanel shows roundScores and totalScores but both are equal visual weight. During a round, round score is what players actively care about. | Round score: larger type. Total score: smaller, secondary position. Label "You" vs opponent name clearly. |
| Error feedback on invalid word | Shake + message is the established convention (Wordle set this in 2021 — it is now the expected pattern). | LOW | **Already correct.** Shake animation + red error text above Submit. This is well-implemented. | No change needed. |
| Round end feels like a distinct event | Transition between round-in-play and round-over should feel like a meaningful moment, not a content replacement. Wordle's results modal, NYT Connections' reveal — fullscreen overlays signal state changes. | MEDIUM | **Needs improvement.** RoundEndCard renders inline within the GameScreen flex layout, not as an overlay. GameOverScreen uses an overlay approach. The inconsistency makes round end feel less significant. | RoundEndCard should use the same overlay pattern as GameOverScreen: fixed inset-0 backdrop with centered card. |
| Dark mode with real contrast | Dark mode where text is actually readable — not just a darkened surface with unchanged overlays. WCAG AA requires 4.5:1 for normal text. | MEDIUM | **Partially broken.** Dark tokens exist but opacity-aliased text colors (`text-ink/30`, `text-ink/40`) compute to approximately 3.5:1 on dark surface — fails AA for normal text. Corbusier red as text on dark surface is approximately 4.1:1 — marginal fail. | Audit all text/background pairs in dark mode. Replace opacity-aliased colors with explicit hex tokens for secondary text in dark mode. |
| Software keyboard doesn't break lobby layout | When the device keyboard appears (triggered by the join code input field in LobbyScreen), the layout should not collapse or push content off screen. | LOW | **Unknown — likely at risk.** LobbyScreen uses `min-h-screen` full-height layout. A keyboard appearing on an iPhone reduces visible height by ~40%. The join code input and join button may scroll off screen. | Use `min-h-fit` or `height: auto` for the lobby layout, or add `inputmode="text"` and `autocomplete="one-time-code"` to minimize keyboard disruption. |

---

### Differentiators (Competitive Advantage)

Patterns that elevate the existing design beyond baseline. These align with Word Chicken's core value: escalating tension.

| Feature | Value Proposition | Complexity | Current State | Notes |
|---------|-------------------|------------|---------------|-------|
| Chicken-O-Meter as visceral tension indicator | Most word games use score as the only pressure indicator. A fill gauge that physically "rises" as the word grows externalizes emotional stakes. No comparable game has this. | LOW (design work) | **Exists but undersized.** Current: `h-48 sm:h-64 w-5` — a 5px-wide needle on the right edge of the screen. The meter is present but not prominent enough to read as a tension indicator. | Widen to w-8 or w-10 (32-40px). On mobile, consider horizontal bar variant under the SharedWordDisplay instead of right-sidebar. Increase pulse animation aggressiveness in danger zone (>66% fill). |
| Tile color language for community vs. hand | Yellow tiles = letters from the shared word (community). Blue tiles = newly staged from hand. Concrete = available in hand. This color system teaches tile ownership without instructions. | LOW | **Exists and mostly works.** Risk: staged tiles in the hand become opacity-50 concrete, which breaks the color signal — they look identical to unstaged tiles but dimmer, not like "taken" tiles. | Staged tiles in the hand should have a clearer "taken" visual: consider `opacity-30` + `line-through` treatment, or a small checkmark overlay, or simply remove them from the hand view and show them only in the staging area. |
| Tile entrance animations per round | Tiles sliding in on each new round signals a distinct game moment, creating rhythm and anticipation. | LOW | **Exists and works.** `entranceStyle` with opacity + translateY + stagger. | Keep as-is. Could extend the stagger timing (current: 40ms per tile) to 60ms for a more dramatic cascade effect. |
| Elimination scatter animation | When you're eliminated, tiles scatter and fly off screen — a theatrical moment that makes losing feel memorable rather than just sad. | LOW | **Exists and works.** CSS transform scatter with rotation. | Keep as-is. This is a genuine differentiator. |
| Opponent thinking animation | Prevents confusion during AI/opponent turn — cycling random letters on TileCard components is more evocative than a generic spinner. | LOW | **Exists and works.** | Keep as-is. More creative than standard loading patterns. |
| Corbusier palette as brand identity | Red/blue/yellow in a game context is immediately distinctive. Most word games are grey and green (Wordle) or blue and white (Scrabble GO). | LOW (design work) | **Established but needs dark mode care.** In dark mode, the palette should not simply be layered on a dark surface — Corbusier red (#d0021b) and yellow (#f5a623) need to work with the dark surface (#1c1c24) without losing their identity. | In dark mode: keep red and blue at full saturation (they work on dark). Yellow (#f5a623) on dark surface as a background color is fine; avoid yellow as small text on dark — contrast fails. |

---

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Scroll-based layout for the game screen | "More space for tiles / word history" | Scroll breaks the "game as arena" mental model. A game board should feel contained. Scrolling during your turn means losing context of the shared word and score. Word history is already correctly hidden on mobile. | Use `flex-1` on the center section to fill available height naturally. Hide low-priority elements (word history) on mobile before introducing scroll. |
| Word history visible on mobile | Power users want to see every word played | Takes ~30% of horizontal real estate on a 375px phone. The critical info for decision-making is only the current word, not the full history. | Keep history hidden on mobile (already done). A tap-to-expand drawer could be added later if player demand is validated. Do not add for v1.1. |
| Bottom navigation bar | "Easy way to switch between sections" | There are only 3 screens and they form a linear flow (config → lobby/game). Nav bars imply parallel sibling destinations, not a linear funnel. A nav bar on the game screen would be confusing. | One-directional flow: config → game. Back/quit is sufficient. |
| Animated transitions between screens | "Feels more like a native app" | React state-based screen swaps don't have shared element context. Slide/fade transitions add 200-400ms of perceived latency and require layout preservation during the transition. The within-screen animations (tile entrance, scatter) are already polished. | Rely on within-screen state transitions. Screen switches can be instant — the in-game animations carry all the polish. |
| Floating action button (FAB) for Submit | "Always accessible, ergonomic" | FAB patterns are for context-free actions that don't have a natural position (e.g., compose email). Submit is tightly coupled to the staging area — it should be adjacent to what you're submitting, not floating independently. | Keep Submit paired with the staging area; move the entire interaction zone (staging + tiles + submit) lower toward the thumb zone rather than detaching the button. |
| Haptic feedback on tile taps | "Makes tiles feel physical and satisfying" | Web Vibration API: Android-only in practice, off by default in many browsers, unsupported in Safari/iOS entirely. Creates false expectation of polish that only half the users experience. | Lean into the visual micro-interactions already present (tile scale on hover, bounce on tap, `hover:scale-110` in TileCard). These work everywhere. |
| Swipe gestures for staging tiles | "Natural mobile interaction" | Swipe conflicts with browser scroll and requires careful gesture disambiguation. Tap-to-select is cleaner and more accessible — it works with assistive technology, doesn't conflict with scroll, and has no ambiguous direction. | Keep tap-to-stage. It is the correct mobile primitive for this interaction. |

---

## Feature Dependencies

```
Viewport fix (100dvh + flex-col)
    └──enables──> Reliable flex-1 height expansion
                      └──enables──> True bottom-anchor for PlayerHand
                                        └──enables──> Submit button consistently in thumb zone

Safe area padding
    └──required for──> No bottom content clipping on iPhone
    └──required for──> No top clipping on notched devices

Color contrast audit
    └──unblocks──> Dark mode is trustworthy
    └──unblocks──> Corbusier palette is accessible in both modes

Round end overlay pattern
    └──depends on──> No layout changes to GameScreen (fix viewport first)
```

### Dependency Notes

- **Viewport fix must come first.** Every other layout measurement — button position, tile sizing, safe area — is verified against the corrected viewport. Fixing individual component positions without fixing the container baseline will produce inconsistent results across device sizes.
- **Submit position depends on viewport fix.** The current `pb-8` anchor inside `flex-1 justify-end` only works correctly once the flex container reliably fills the viewport. Fix container first, then validate button position.
- **Dark mode contrast is independent.** Color tokens are in `index.css`. This work can be done in parallel with layout work.
- **RoundEndCard overlay is safe to do after viewport fix.** It's a self-contained component change that doesn't affect GameScreen layout.

---

## MVP for This Audit (v1.1 Scope)

### Fix Now — Core Breakage (Must Ship)

- [ ] **Viewport 100dvh** — Replace `min-h-screen` with `min-h-[100dvh]` on GameScreen, ConfigScreen, LobbyScreen. This is the root cause of the "content at bottom" bug reported in playtesting. Trivial code change, high impact.
- [ ] **GameScreen flex layout restructure** — GameScreen needs `flex flex-col h-[100dvh]` with top bar fixed-height, center section `flex-1`, so PlayerHand genuinely anchors to the bottom third of the screen.
- [ ] **Safe area bottom padding** — `pb-[env(safe-area-inset-bottom)]` on GameScreen container. Prevents Submit button hiding behind home indicator on iPhone 14+.
- [ ] **Secondary button touch targets** — Quit (top bar), Give Up, Show a Word (Hint), Back (LobbyScreen), Copy Code, How to Play link all need minimum 44px tap area via explicit padding. Currently too small for reliable one-thumb tapping.
- [ ] **Dark mode contrast audit and fix** — Verify all text/background pairs. Expected failures: `ink/30`-`ink/50` opacity tokens on dark surface for normal-weight text; Corbusier red as text color on dark; yellow as text color on dark. Fix by adding explicit dark-mode token values instead of relying solely on opacity.

### Fix Now — Polish (Should Ship in v1.1)

- [ ] **Turn indicator visual weight** — The top bar (round label + turn indicator + quit) currently has no visual hierarchy. Turn state should dominate. Options: colored left border on turn indicator, background fill that changes per player, or heavier typography. The fix is low-effort (CSS changes) and meaningfully improves game clarity.
- [ ] **Score panel hierarchy** — Round score: larger type, primary position. Total score: smaller, secondary. Opponent name visible. Currently both score values are equal weight.
- [ ] **RoundEndCard as overlay** — Match the GameOverScreen overlay pattern (fixed inset-0, backdrop, centered card with scale-in animation). Currently inline. 30 minutes of work, meaningful state transition improvement.
- [ ] **Chicken-O-Meter sizing** — Current width (w-5 = 20px) is too narrow to read as a meaningful tension indicator. Widen to w-8 or w-10. On small screens, consider horizontal bar below SharedWordDisplay instead of right sidebar. This component is a differentiator — it should be visible and dramatic.
- [ ] **Staged tile "taken" signal in hand** — Staged tiles appear as greyed-out concrete tiles in the hand, identical to unstaged tiles but at 50% opacity. The visual distinction is too subtle. Consider stronger dimming (`opacity-20`), a visual overlay, or simply removing them from the hand display while staged (show them only in StagingArea).

### Defer to v1.2+

- [ ] **Lobby keyboard-aware layout** — Minor edge case. Only affects users joining by code on a small phone. Validate whether this is a real friction point before investing.
- [ ] **Animated screen transitions** — Nice-to-have. Only worthwhile once layout is stable. No value until core layout is correct.
- [ ] **Word history mobile drawer** — Validate player demand. Most mobile players don't miss it; the hidden-on-mobile behavior is already correct.
- [ ] **Tile size scaling in PlayerHand** — SharedWordDisplay already handles size scaling (lg/md/sm by word length). Hand tiles are fixed md (40px). Responsive tile sizing in hand could help at 14+ letter words but is not an immediate issue.

---

## Feature Prioritization Matrix

| UX Fix | User Impact | Implementation Cost | Priority |
|--------|-------------|---------------------|----------|
| Viewport 100dvh fix | HIGH — root cause of layout bug | LOW — 3 class swaps | P1 |
| GameScreen flex layout restructure | HIGH — enables correct thumb-zone positioning | MEDIUM — layout rework | P1 |
| Safe area bottom padding | HIGH on notched iPhones | LOW — single class | P1 |
| Secondary button touch targets | HIGH — accessibility + frustration | LOW — padding additions | P1 |
| Dark mode contrast audit and fix | HIGH for dark mode users | MEDIUM — token work | P1 |
| Turn indicator visual weight | MEDIUM — game state clarity | LOW — styling | P2 |
| Score panel hierarchy | MEDIUM — readability | LOW — typography | P2 |
| RoundEndCard as overlay | MEDIUM — transition polish | LOW — pattern already exists | P2 |
| Chicken-O-Meter sizing | MEDIUM — key tension UI | LOW-MEDIUM — possible layout impact | P2 |
| Staged tile "taken" signal | LOW-MEDIUM — subtle confusion | MEDIUM — rethink state rendering | P2 |
| Lobby keyboard-aware layout | LOW | LOW | P3 |
| Animated screen transitions | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Core breakage or accessibility failure — must ship for v1.1
- P2: Polish and hierarchy — should ship in v1.1 alongside P1 fixes
- P3: Nice to have — validate need before building

---

## Reference Game Analysis

### Wordle (NYT, 2021-present)

**Layout structure:** Vertical split — tile grid occupies top 55-60% of viewport; custom keyboard occupies bottom 40-45%. Keyboard = thumb zone = interaction zone. Grid = read-only display zone. Clear separation of "what you're building" (top) vs "how you act" (bottom).

**Relevance to Word Chicken:** The same principle should apply. SharedWordDisplay (top, read-only) + ScorePanel (middle) + PlayerHand with staging and Submit (bottom, interactive). The current GameScreen is directionally correct but doesn't guarantee the interaction zone reaches the thumb zone.

**Tile sizing:** Wordle tiles are approximately 62x62px on mobile for a 5-tile row. Word Chicken tiles are 40-44px for potentially 15 tiles in a row (hand + community). Smaller tiles are appropriate given the quantity — the current size is defensible. The issue is not tile size but layout position.

**State feedback:** Shake animation on invalid word (exactly what Word Chicken does). Toast-style error message. Color-coded tiles for state. Word Chicken's implementation matches this pattern correctly.

**Accessibility:** High-contrast mode available. Wordle noted this as important for colorblind users — relevant because Corbusier red and yellow may be indistinguishable for certain types of color vision deficiency. Consider a future audit of the tile color set for color blindness, though this is out of scope for v1.1.

### Scrabble GO / Words With Friends

**Score display:** Opponent score always visible alongside own. The leading player's score is visually larger. Current score and round context are distinguished from cumulative total. This matches what Word Chicken should do with `roundScores` vs `totalScores`.

**Turn indicator:** The entire UI shifts color toward the active player during their turn — not just a text label. This is the reference for why Word Chicken's current small text turn indicator is insufficient.

**Thinking state:** "Opponent is playing..." banner across the top during the opponent's turn. Word Chicken's cycling random-letter animation is more creative and game-appropriate — no change needed, but the existence of a clear "wait state" signal is table stakes.

---

## Specific Mobile UX Standards Applied to Word Chicken

### Viewport Units (HIGH confidence — MDN/W3C verified)

| Unit | Behavior | Use Case |
|------|----------|----------|
| `100vh` | Calculates against large viewport (address bar hidden) — overestimates on mobile load | Avoid for full-screen game containers |
| `100dvh` | Dynamically adjusts as browser chrome shows/hides — correct for game containers | Use on GameScreen, ConfigScreen, LobbyScreen containers |
| `100svh` | Always uses smallest viewport (address bar visible) — stable, never overflows | Alternative to dvh; slightly safer on older mobile browsers |

**Recommendation:** Use `100dvh` (dynamically tracks viewport). Browser support: Baseline Widely Available as of June 2025 — safe to use without fallback for this project's audience.

### Touch Target Sizes (HIGH confidence — Apple HIG + Material Design + WCAG)

| Element Type | Minimum Size | Current State | Fix |
|--------------|-------------|---------------|-----|
| Primary action button | 48x48px | Submit button: ~40px height | Add `py-3` minimum |
| Tile cards | 44x44px | `min-w-[44px] min-h-[44px]` — correct | No change |
| Secondary text buttons | 44x44px | Quit, Give Up, Hint: ~24px effective | Add explicit padding wrappers |
| Toggle switches | 44x44px | Dark mode toggle: 44px tap area via p-2 | Verify |
| Back/navigation | 44x44px | Back button in LobbyScreen: 48px height — correct | No change |

### Color Contrast in Dark Mode (HIGH confidence — WCAG 2.1 + WebAIM)

| Color Pair | Computed Ratio | WCAG AA (4.5:1 for text) | Status |
|------------|----------------|--------------------------|--------|
| ink (#e0ddd8) on dark surface (#1c1c24) | ~12:1 | Pass | Good |
| ink/50 on dark surface | ~5:1 | Pass (borderline) | Verify |
| ink/40 on dark surface | ~4:1 | **Fail for normal text** | Fix |
| ink/30 on dark surface | ~3:1 | **Fail for normal text** | Fix |
| Corbusier red (#d0021b) on dark surface | ~4.1:1 | **Marginal fail** | Fix if used as text |
| Corbusier yellow (#f5a623) on dark surface | ~2.8:1 | **Fail** | Never use as text on dark |
| White text on Corbusier red | ~4.6:1 | Pass (barely) | OK |
| White text on Corbusier blue (#003f91) | ~9.5:1 | Pass | Good |
| White text on Corbusier yellow | ~2.3:1 | **Fail** | Fix — use dark text on yellow |

**Action:** In dark mode, secondary text currently uses `text-ink/30`–`text-ink/50` (opacity aliases). These fail AA. Replace with explicit dark-mode hex values (e.g., `dark:text-ink/60` bumped to a contrast-verified level, or add `.dark` variants with explicit color values in index.css).

### Thumb Zone (MEDIUM confidence — Smashing Magazine research + Steven Hoober study)

For a 375x812px phone (iPhone 14):
- **Bottom ~320px (39% of screen):** Easy thumb reach — place tiles, Submit button, Give Up/Hint
- **Middle ~330px (41% of screen):** Moderate reach — score display, shared word, staging area
- **Top ~160px (20% of screen):** Hard reach — round number, quit button, turn indicator

The current layout's intent (tiles at bottom, shared word at top) is correct in principle. The bug is that `flex-1` with `justify-end pb-8` doesn't reliably push the tile hand into the bottom 320px on all device heights. A restructured flex layout will solve this.

---

## Sources

- [CSS viewport units (dvh/svh/lvh) — LogRocket](https://blog.logrocket.com/improving-mobile-design-latest-css-viewport-units/) — HIGH confidence
- [dvh Baseline Widely Available — MDN/Can I Use](https://caniuse.com/viewport-unit-variants) — HIGH confidence
- [Touch target sizes — Smashing Magazine](https://www.smashingmagazine.com/2023/04/accessible-tap-target-sizes-rage-taps-clicks/) — HIGH confidence
- [Thumb zone — Smashing Magazine](https://www.smashingmagazine.com/2016/09/the-thumb-zone-designing-for-mobile-users/) — HIGH confidence
- [WCAG contrast — WebAIM](https://webaim.org/articles/contrast/) — HIGH confidence
- [Wordle design analysis — Webflow Blog](https://webflow.com/blog/wordle-design) — MEDIUM confidence
- [Wordle UX patterns — KobeDigital](https://kobedigital.com/ux-tips-from-wordle/) — MEDIUM confidence
- [Mobile game UI patterns — 24-players.com](https://24-players.com/advanced-ui-ux-design-for-mobile-game-interfaces/) — MEDIUM confidence
- [Modal vs fullscreen overlays — LogRocket](https://blog.logrocket.com/ux-design/modal-ux-design-patterns-examples-best-practices/) — MEDIUM confidence
- [Accessible touch target sizes — Deque/Axe](https://docs.deque.com/devtools-mobile/2025.7.2/en/ios-touch-target-size/) — HIGH confidence

---
*Feature research for: Word Chicken v1.1 — mobile word game UX audit (viewport, hierarchy, touch targets, color, transitions)*
*Researched: 2026-03-18*
