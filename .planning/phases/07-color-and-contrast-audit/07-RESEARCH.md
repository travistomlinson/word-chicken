# Phase 7: Color and Contrast Audit - Research

**Researched:** 2026-03-19
**Domain:** WCAG AA contrast compliance, CSS design tokens, Tailwind v4 color system
**Confidence:** HIGH

## Summary

This phase is a precision fix pass, not exploratory. The codebase uses Tailwind v4's `@theme` block in `index.css` to define all color tokens (`--color-corbusier-red`, `--color-corbusier-yellow`, `--color-corbusier-blue`, `--color-concrete`, `--color-charcoal`, `--color-surface`, `--color-card`, `--color-ink`). Dark mode overrides these same tokens inside `.dark {}`. Every component consumes these tokens through Tailwind utility classes like `bg-corbusier-yellow`, `text-ink`, `text-ink/50`.

Exact contrast ratios have been computed for all opacity-derived text values via proper alpha blending. The failures are severe and numerous: opacity suffixes like `/40`, `/30`, `/20` on `text-ink` create colors far below 4.5:1 in both modes. In dark mode, even `/50` (4.13:1 on `surface_dark`) barely passes and fails on `card_dark` (3.81:1). Corbusier blue and red are unusable as text colors in dark mode (1.71:1 and 2.99:1 respectively). The yellow tile with white text is a hard failure at 2.03:1.

The ChickenOMeter gradient is hardcoded as a `style={{ background: 'linear-gradient(…) }}` inline style referencing raw hex values (`#003f91`, `#f5a623`, `#d0021b`). The fix is to drive this with CSS custom properties so it auto-updates when tokens change.

**Primary recommendation:** Audit every `text-ink/N` usage against its background surface, replace failing opacities with explicit token-based colors or higher opacity values, fix yellow tiles to use `text-charcoal`, and refactor the ChickenOMeter gradient to reference CSS custom properties.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| COLR-01 | All text passes WCAG AA contrast ratio (4.5:1 normal, 3:1 large) in light mode | Computed ratios below identify every failing class; specific replacements documented |
| COLR-02 | All text passes WCAG AA in dark mode — no opacity below /50 for informational text | Dark mode `/50` on card_dark fails (3.81:1); some `/50` usages are informational, must be reviewed individually |
| COLR-03 | Yellow backgrounds use dark text (charcoal) instead of white | `text-white` on `bg-corbusier-yellow` = 2.03:1; `text-charcoal` = 5.61:1 — direct swap |
| COLR-04 | ChickenOMeter gradient uses CSS custom properties from design token system | Gradient is currently `style={{ background: 'linear-gradient(…hex…)' }}`; fix is to use `var(--color-*)` in the CSS value |
</phase_requirements>

## Computed Contrast Ratios (HIGH confidence)

All values computed via WCAG 2.1 relative luminance formula with proper alpha blending against the specified background.

### Yellow background — COLR-03

| Text color | Background | Ratio | Pass 4.5:1? |
|------------|-----------|-------|-------------|
| `text-white` (#ffffff) | `bg-corbusier-yellow` (#f5a623) | **2.03:1** | FAIL |
| `text-charcoal` (#3a3a3a) | `bg-corbusier-yellow` (#f5a623) | **5.61:1** | PASS |

**Affected:** `TileCard` color="yellow" (`text-white`), LobbyScreen "Join" button (`text-white`), ConfigScreen "Play a Friend" button (`text-white`), ConfigScreen "Medium" difficulty card (`text-white`).

### Light mode opacity-derived text — COLR-01

| Tailwind class | Effective color | Background | Ratio | Pass? |
|---------------|----------------|-----------|-------|-------|
| `text-ink` | #3a3a3a | surface_light #f2f0eb | 9.99 | PASS |
| `text-ink` | #3a3a3a | card_light #ffffff | 11.37 | PASS |
| `text-ink/50` | #969593 | surface_light | 2.63 | **FAIL** |
| `text-ink/50` | #9d9d9d | card_light | 2.71 | **FAIL** |
| `text-ink/40` | #a8a7a4 | surface_light | 2.11 | **FAIL** |
| `text-ink/40` | #b0b0b0 | card_light | 2.17 | **FAIL** |
| `text-ink/30` | #bbb9b6 | surface_light | 1.72 | **FAIL** |
| `text-ink/30` | #c4c4c4 | card_light | 1.74 | **FAIL** |
| `text-ink/20` | #cdccc8 | surface_light | 1.41 | **FAIL** |
| `text-corbusier-blue` | #003f91 | surface_light | 8.70 | PASS |
| `text-corbusier-blue` | #003f91 | card_light | 9.91 | PASS |
| `text-corbusier-red` | #d0021b | surface_light | 4.97 | PASS (≥4.5) |
| `text-corbusier-red` | #d0021b | card_light | 5.67 | PASS |
| `text-white` on `bg-corbusier-red` | — | #d0021b | 5.67 | PASS |
| `text-white` on `bg-corbusier-blue` | — | #003f91 | 9.91 | PASS |

**Key insight:** Every single `/N` opacity suffix on `text-ink` in light mode is a WCAG failure for informational text. These are used for de-emphasis (labels, secondary text). The fix is to use higher opacities (minimum `/70`) or token-based secondary colors.

### Dark mode opacity-derived text — COLR-02

| Tailwind class | Effective on surface_dark | Effective on card_dark | Pass surface? | Pass card? |
|---------------|--------------------------|----------------------|--------------|-----------|
| `text-ink` | 12.49 | 10.48 | PASS | PASS |
| `text-ink/50` | 4.13 | 3.81 | FAIL (borderline) | **FAIL** |
| `text-ink/40` | 3.10 | 2.97 | **FAIL** | **FAIL** |
| `text-ink/30` | 2.32 | 2.28 | **FAIL** | **FAIL** |
| `text-ink/20` | 1.72 | — | **FAIL** | **FAIL** |
| `text-corbusier-blue` | #003f91 on #1c1c24 | #003f91 on #2a2a34 | 1.71 | 1.43 | **FAIL** | **FAIL** |
| `text-corbusier-red` | #d0021b on #1c1c24 | #d0021b on #2a2a34 | 2.99 | 2.51 | **FAIL** | **FAIL** |

**Critical:** `text-corbusier-blue` and `text-corbusier-red` are used as informational text labels (ScorePanel "You"/"AI", TurnIndicator states) and fail catastrophically in dark mode. These need dark-mode-specific overrides.

**Note on COLR-02 requirement wording:** The requirement says "no opacity below /50 for informational text." However, even `/50` fails in dark mode on card backgrounds (3.81:1). The spirit of the requirement is all informational text passes 4.5:1. The `/50` threshold in the requirement language is a floor, not a free pass — any `/50` usage on card backgrounds still needs review.

### All `text-ink/N` usages in the codebase

| File | Opacity | Context | Informational? |
|------|---------|---------|----------------|
| GameScreen.tsx | `/30` | Round counter "R{n}" | YES — fail |
| GameScreen.tsx | `/40` | Quit button | YES — fail |
| GameScreen.tsx | `/50` | Reconnecting "Waiting for opponent..." | YES — fail |
| GameScreen.tsx | `/60` | Disconnect error message | YES — fail |
| GameScreen.tsx | `/20` | "vs" separator | Decorative — FAIL but borderline |
| ScorePanel.tsx | `/20` | "vs" separator | Decorative |
| RoundEndCard.tsx | `/50` | "Round {n}" label, score labels "You"/"AI" | YES — fail |
| RoundEndCard.tsx | `/40` | "Word Chain" label, longest word | YES — fail |
| GameOverScreen.tsx | `/50` | "You"/"Opponent" label, "Played N rounds" | YES — fail |
| GameOverScreen.tsx | `/20` | "vs" separator | Decorative |
| LobbyScreen.tsx | `/50` | Status messages "Waiting...", "Connecting..." | YES — fail |
| LobbyScreen.tsx | `/30` | "or" separator | Decorative |
| ConfigScreen.tsx | (none directly) | — | — |
| ChickenOMeter.tsx | `/40` | Word length number | YES — fail |
| SharedWordDisplay.tsx | `/40` | "Waiting for starting word..." placeholder | YES — fail |
| StagingArea.tsx | `/30` | "Tap tiles below" placeholder | YES — fail |

## Standard Stack

### Core (already in project)
| Library | Version | Purpose |
|---------|---------|---------|
| Tailwind CSS v4 | ^4.0.0 | Utility classes via `@theme` token system |
| Vitest | ^4.1.0 | Test runner for static source audits |

### No new dependencies needed
This phase is pure CSS token and class changes. No new packages required.

## Architecture Patterns

### Pattern 1: Tailwind v4 @theme token system

The project already uses Tailwind v4's `@theme` block. Semantic token pattern: define purpose-named tokens, use them everywhere. Opacity modifiers (`/N`) are fine for backgrounds and borders but produce WCAG failures on text.

```css
/* Source: src/index.css */
@theme {
  --color-ink: #3a3a3a;
  /* Add secondary ink token for de-emphasis */
  --color-ink-secondary: #6b6967;  /* ~4.5:1 on both surfaces */
}

.dark {
  --color-ink: #e0ddd8;
  --color-ink-secondary: #9b9896;  /* ~4.5:1 on dark surfaces */
}
```

Then components use `text-ink-secondary` instead of `text-ink/50`.

### Pattern 2: CSS custom properties in gradient (COLR-04)

ChickenOMeter currently uses hardcoded hex in an inline style. The fix moves the gradient into CSS using the existing token variables:

```css
/* In index.css — new utility class */
.gradient-tension {
  background: linear-gradient(
    to top,
    var(--color-corbusier-blue),
    var(--color-corbusier-yellow),
    var(--color-corbusier-red)
  );
}
```

```tsx
/* In ChickenOMeter.tsx — remove style prop, use className */
<div className="relative h-48 sm:h-64 w-5 rounded-full overflow-hidden gradient-tension" ... />
```

This satisfies COLR-04: changing a color token automatically updates the gradient.

### Pattern 3: Dark mode text colors for brand colors

`text-corbusier-blue` and `text-corbusier-red` fail in dark mode. Two approaches:

**Option A — semantic override tokens (recommended):**
```css
@theme {
  --color-accent-primary: #003f91;   /* blue — passes light mode */
  --color-accent-danger: #d0021b;    /* red — passes light mode */
}
.dark {
  --color-accent-primary: #5b8dd9;   /* lighter blue, passes dark mode */
  --color-accent-danger: #f05050;    /* lighter red, passes dark mode */
}
```
Cons: changes palette identity, requires testing.

**Option B — use existing classes but add dark: overrides:**
```tsx
className="text-corbusier-blue dark:text-blue-400"
```
Cons: couples to Tailwind's default palette, not project tokens.

**Option C — accept current brand usage as large text / decorative (only valid where ≥18px bold or ≥24px regular = 3:1 threshold):**
- TurnIndicator phase labels ("Your Turn", "AI is thinking...") are `text-sm font-bold` (~14px bold) — NOT large text by WCAG definition (needs 18px regular or 14px bold at ≥700 weight), fail at 3:1
- ScorePanel "You"/"AI" labels are `text-[10px]` — far below large text threshold, fail at 4.5:1

Option A is cleanest but requires new token names and measured values for the new lighter shades. Option C is only valid for elements that genuinely qualify as large text AND where the ratio passes 3:1.

**Recommendation:** The planner should pick ONE approach per element type and be explicit. Option A (semantic tokens) is most maintainable. Lighter blue and red values that pass dark mode:
- Blue equivalent passing dark mode at 4.5:1 on `#1c1c24`: need L > ~0.08; `#5b8de0` gives ~4.6:1
- Red equivalent passing dark mode at 4.5:1 on `#1c1c24`: need L > ~0.08; `#f07070` gives ~5.0:1

These should be verified with a contrast checker before committing. Confidence: MEDIUM (computed but not visually verified against design intent).

### Pattern 4: Decorative vs informational text

WCAG 1.4.3 exempts "text or images of text that are part of an inactive user interface component, that are pure decoration, that are not visible to anyone, or that are part of a picture that contains significant other visual content." The "vs" separators (`text-ink/20`) and divider lines are decorative and exempt. Everything else is informational.

Decorative (exempt from 4.5:1):
- "vs" separator in ScorePanel and GameOverScreen
- "or" divider in LobbyScreen
- Animated pulse dots (decorative indicators)

Informational (must pass 4.5:1):
- All status text, labels, scores, instructions, error messages, round/score numbers

### Anti-Patterns to Avoid
- **Using opacity modifiers on text instead of explicit token values:** `text-ink/40` looks clean but creates unmeasurable, context-dependent contrast. Define named tokens for secondary text.
- **Assuming `/50` is safe in dark mode:** Even `/50` fails on card backgrounds in dark mode (3.81:1). Use a minimum of explicit secondary color tokens.
- **Blanket-replacing all opacity text with full opacity:** This destroys visual hierarchy. The correct fix is measuring each use and choosing the minimum opacity that passes — or using explicit token colors.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Contrast ratio calculation | Custom formula | Node.js WCAG formula (already verified in research) or browser devtools | Edge cases in gamma correction |
| Gradient CSS | JS-computed gradient | CSS `linear-gradient` with `var()` references | Native CSS handles token updates automatically |
| Dark mode color switching | JS theme detection | CSS `.dark` class override on token values (already in use) | Proven pattern already working in this project |

## Common Pitfalls

### Pitfall 1: Thinking `/50` is safe by the requirement text
**What goes wrong:** COLR-02 says "no opacity below /50." A developer reads this and leaves all `/50` usages alone. But `/50` on `card_dark` (#2a2a34) is 3.81:1 — a WCAG AA failure.
**Why it happens:** The requirement uses `/50` as shorthand for "use enough opacity." It's a floor, not a ceiling.
**How to avoid:** Measure every `/50` instance. Those on `surface_dark` borderline pass (4.13:1); those on `card_dark` fail. Use explicit secondary tokens instead.
**Warning signs:** Any `text-ink/50` on a card background in dark mode.

### Pitfall 2: Forgetting brand-color-as-text fails in dark mode
**What goes wrong:** `text-corbusier-blue` passes brilliantly in light mode (8.7:1) but fails in dark mode (1.71:1). A light-mode-only test gives false confidence.
**Why it happens:** The blue (#003f91) is a very dark color — it contrasts with light surfaces but not dark ones.
**How to avoid:** Always check both modes when changing text color classes.
**Warning signs:** Any `text-corbusier-blue` or `text-corbusier-red` outside of a `bg-white` / light surface context.

### Pitfall 3: Breaking visual hierarchy while fixing contrast
**What goes wrong:** Changing all `text-ink/50` to `text-ink` makes secondary labels same weight as primary labels — destroys design intent.
**Why it happens:** Opacity is the current hierarchy mechanism.
**How to avoid:** Define `text-ink-secondary` tokens calibrated to exactly 4.5:1 — not full `text-ink`. This preserves hierarchy while passing WCAG.

### Pitfall 4: ChickenOMeter mask color in dark mode
**What goes wrong:** The mask div uses `bg-surface/90` — this is correct and already uses the token. But in dark mode, surface is `#1c1c24`. At 90% opacity the mask effectively hides the gradient, which is the intent. No issue here, but verify visually.

### Pitfall 5: Yellow tiles in StagingArea use `color="yellow"` which maps to `text-white`
**What goes wrong:** Fixing `TileCard`'s yellow color class fixes SharedWordDisplay tiles and ConfigScreen difficulty cards, but any direct usage of the yellow color class gets fixed automatically — good. But there are yellow tiles in `StagingArea.tsx` via `color={stagedCommunity[idx] ? 'yellow' : 'blue'}`. All of these go through the same `TileCard` component so the fix is in one place.

## Code Examples

### Computing minimum safe opacity for a text color
```typescript
// WCAG luminance formula
function luminance(r: number, g: number, b: number): number {
  return [r, g, b].reduce((acc, c, i) => {
    const s = c / 255;
    const l = s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    return acc + l * [0.2126, 0.7152, 0.0722][i];
  }, 0);
}

function contrastRatio(L1: number, L2: number): number {
  const [light, dark] = [Math.max(L1, L2), Math.min(L1, L2)];
  return (light + 0.05) / (dark + 0.05);
}
```

### CSS token secondary ink values (computed, needs visual verification)
```css
@theme {
  /* existing tokens remain unchanged */
  --color-ink-secondary: #6b6867;   /* light mode: ~4.6:1 on surface, ~4.7:1 on card */
  --color-ink-muted: #8a8785;       /* light mode: ~3.1:1 — large text only */
}

.dark {
  /* existing tokens remain unchanged */
  --color-ink-secondary: #9c9896;   /* dark mode: ~4.6:1 on surface, ~4.1:1 on card — verify */
  --color-ink-muted: #7c7a76;       /* dark mode: ~3.1:1 — large text only */
}
```

Note: `--color-ink-secondary` dark value on `card_dark` is borderline. Verify with browser devtools before committing.

### gradient-tension utility class (COLR-04)
```css
/* Add to index.css */
.gradient-tension {
  background: linear-gradient(
    to top,
    var(--color-corbusier-blue),
    var(--color-corbusier-yellow),
    var(--color-corbusier-red)
  );
}
```

### TileCard yellow fix (COLR-03)
```typescript
// Before:
yellow: 'bg-corbusier-yellow text-white shadow-md shadow-corbusier-yellow/30',

// After:
yellow: 'bg-corbusier-yellow text-charcoal shadow-md shadow-corbusier-yellow/30',
```

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Define WCAG compliance by eye | Compute ratios with luminance formula | Catches failures invisible to eye |
| Tailwind v3 `theme()` in CSS | Tailwind v4 `@theme {}` + `var(--color-*)` | CSS custom properties accessible natively in `linear-gradient()` |
| Hard-coded hex in gradients | `var(--color-token)` in CSS | Token changes cascade automatically |

## Open Questions

1. **Secondary ink token exact values for dark mode on card_dark**
   - What we know: `#9c9896` gives ~4.1:1 on `card_dark` — marginal FAIL
   - What's unclear: Need a value that passes both `surface_dark` (4.5:1) AND `card_dark` (4.5:1) simultaneously
   - Recommendation: Try `#a09e9a` or lighter — compute against both backgrounds, then visual spot check. This is the one value that requires iteration.

2. **Corbusier blue/red as text in dark mode — which elements need it?**
   - What we know: ScorePanel "You"/"AI" labels use these, TurnIndicator uses them, RoundEndCard uses them
   - What's unclear: Whether to introduce new lighter tokens or use dark: override classes
   - Recommendation: Add `--color-accent-primary-dark` and `--color-accent-danger-dark` tokens in the `.dark {}` block. Keeps component code clean.

3. **ChickenOMeter word-length label (`text-ink/40`) — is it informational?**
   - What we know: It shows the current word length number (`{wordLength}`). Ratio is 2.11:1 in light mode.
   - What's unclear: A numeric readout of a tension meter could be considered decorative (the meter itself conveys the same info visually). However, it is the only numeric readout — call it informational.
   - Recommendation: Fix it. Replace with `text-ink-secondary` or equivalent.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.0 |
| Config file | vite.config.ts (vitest inline config) |
| Quick run command | `npx vitest run src/__tests__/color-contrast.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COLR-01 | No `text-white` on `bg-corbusier-yellow` in any component | static/source | `npx vitest run src/__tests__/color-contrast.test.ts` | Wave 0 |
| COLR-01 | No `text-ink/N` where N < 70 on informational text | static/source | `npx vitest run src/__tests__/color-contrast.test.ts` | Wave 0 |
| COLR-02 | No `text-ink/N` where N < 50 in any component source | static/source | `npx vitest run src/__tests__/color-contrast.test.ts` | Wave 0 |
| COLR-02 | Dark mode brand color text uses overridden tokens | static/source | `npx vitest run src/__tests__/color-contrast.test.ts` | Wave 0 |
| COLR-03 | TileCard yellow color uses `text-charcoal` not `text-white` | static/source | `npx vitest run src/__tests__/color-contrast.test.ts` | Wave 0 |
| COLR-04 | ChickenOMeter has no hardcoded hex in style prop gradient | static/source | `npx vitest run src/__tests__/color-contrast.test.ts` | Wave 0 |
| COLR-04 | index.css defines `.gradient-tension` with `var(--color-*)` | static/source | `npx vitest run src/__tests__/color-contrast.test.ts` | Wave 0 |

**Manual verification required:** Visual dark mode inspection in browser devtools. Static tests catch source patterns but cannot replace eyeballing dark mode rendering.

### Sampling Rate
- **Per task commit:** `npx vitest run src/__tests__/color-contrast.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/__tests__/color-contrast.test.ts` — covers COLR-01, COLR-02, COLR-03, COLR-04 with source-level pattern checks

*(Existing test files: `App.test.tsx`, `mobile-touch.test.tsx`, `viewport.test.tsx` — all unrelated to color)*

## Sources

### Primary (HIGH confidence)
- WCAG 2.1 SC 1.4.3 relative luminance formula — applied directly in research calculations
- `src/index.css` — Tailwind v4 `@theme` token definitions, confirmed by direct file read
- All component files — color class usages confirmed by direct file read
- Contrast ratio calculations — Node.js script run against actual hex values from codebase

### Secondary (MEDIUM confidence)
- WCAG 2.1 large text definition (18pt/24px regular or 14pt/~18.67px bold at weight ≥700) — standard specification
- Tailwind v4 CSS custom property behavior in `linear-gradient()` — documented behavior of CSS spec

### Tertiary (LOW confidence)
- Suggested secondary ink token values (`#6b6867`, `#9c9896`) — computed mathematically but require visual verification against actual rendered output

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies, existing Tailwind v4 + Vitest
- Architecture: HIGH — token system and CSS patterns are well-established in this project
- Contrast ratios: HIGH — computed from actual hex values via WCAG formula
- Suggested new token values: MEDIUM — computed correctly but exact values need visual spot-check
- Dark mode brand color approach: MEDIUM — approach is correct, specific lighter shade values need verification

**Research date:** 2026-03-19
**Valid until:** 2026-06-19 (stable domain — WCAG 2.1 spec is stable, Tailwind v4 tokens are stable)
