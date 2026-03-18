# Phase 1: Foundation - Research

**Researched:** 2026-03-18
**Domain:** Vite + React + TypeScript + Tailwind + Zustand scaffold, dictionary fetch/parse, placeholder routing
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Minimalist, colorful, geometric aesthetic inspired by Le Corbusier
- Light mode only — off-white/concrete gray background with bold primary color accents (red, blue, yellow)
- Sharp corners, no shadows — clean architectural feel
- Color-blocked geometric letter tiles: bold primary-colored squares cycling through red/blue/yellow, white letter centered, sharp corners
- Typography: Jost (Google Fonts) — bold uppercase with letter-spacing for headings, bold for tiles, regular weight for body text

### Claude's Discretion
- Dictionary file source and format (TWL word list acquisition, serving from public/ as text vs JSON)
- Project folder structure (flat vs feature-based src/ organization)
- App shell navigation pattern (how Config and Game screens are routed)
- Tailwind configuration details (exact color values for the Corbusier palette, spacing scale)
- Loading states and transitions
- Animation approach (CSS transitions vs library)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| WVAL-01 | Game loads a bundled TWL dictionary client-side for instant word lookup | Dictionary served as plain-text file from `public/`, fetched at runtime, parsed via `split('\n')` into `Set<string>` — never bundled in JS. Fetch + parse confirmed viable for ~178K words under 2s. |
</phase_requirements>

---

## Summary

Phase 1 is a clean-room scaffold with no prior code. The stack is well-established and the combination (Vite 8 + React 19 + TypeScript + Tailwind v4 + Zustand v5 + Vitest 4) is the current industry standard in early 2026. All tools have recent major versions that differ meaningfully from 2024 baselines — specifically Vite 8 (Rolldown bundler), Tailwind v4 (CSS-first config, no `tailwind.config.js`), and Vitest 4.

The TWL06 word list (~178K words, ~1.3MB as plain text) must be served from `public/` as a `.txt` file, fetched with `fetch()`, and parsed into a `Set<string>` on first load. This is the architecturally correct approach: keeps it out of the JS bundle, allows lazy loading, and is fast enough to finish well within the 2-second requirement. The parsed Set should be stored in a Zustand slice (not React state) so the Phase 2 `WordValidator` module can access it without prop-drilling.

The app shell needs two placeholder screens — Config and Game — with navigation between them. The cleanest Phase 1 pattern is a single Zustand `screen` field (`'config' | 'game'`) with conditional rendering; this avoids adding a router dependency for a two-screen flow while remaining compatible with a potential React Router addition in Phase 4.

**Primary recommendation:** Scaffold with `npm create vite@latest` using `react-ts` template, install Tailwind v4 via `@tailwindcss/vite` plugin, install Zustand v5 and Vitest 4, place `TWL06.txt` in `public/`, build a `useDictionary` hook that fetches and parses it into a Zustand store slice.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vite | 8.x | Dev server + bundler | Rolldown-powered, fastest builds; `react-ts` template is the canonical SPA scaffold |
| @vitejs/plugin-react | 6.x | JSX transform + HMR | Ships with Vite 8; uses Oxc (no Babel), smallest install size |
| react + react-dom | 19.x | UI library | Current stable; `react-ts` template targets it |
| typescript | 5.x | Type safety | Included in `react-ts` scaffold |
| tailwindcss | 4.x | Utility CSS | v4 ships a first-party Vite plugin — no PostCSS config required |
| @tailwindcss/vite | 4.x | Tailwind Vite integration | Required companion for v4 with Vite |
| zustand | 5.0.x | Client state | Minimal API, no providers, full TypeScript support, Phase 3 FSM-ready |

### Testing

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | 4.x | Test runner | Integrated with Vite config, no separate jest.config needed |
| @testing-library/react | 16.x | Component tests | Standard DOM-based component assertion |
| @testing-library/jest-dom | 6.x | DOM matchers | `toBeInTheDocument`, `toHaveTextContent`, etc. |
| @testing-library/user-event | 14.x | User interaction simulation | Fire events that mirror real user behavior |
| jsdom | 25.x | Browser environment for tests | Required by Vitest for DOM testing outside a real browser |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Zustand screen field | React Router v7 | Router adds URL navigation (unnecessary for 2-screen app); defer until Phase 4 if needed |
| `public/TWL06.txt` plain text | JSON array bundled in JS | JSON bundle bloats initial JS by ~3MB; text file stays out of parse graph |
| `@tailwindcss/vite` plugin | PostCSS + `tailwind.config.js` | Old v3 flow; v4 deprecated it — use the Vite plugin |
| `@vitejs/plugin-react` (Oxc) | `@vitejs/plugin-react-swc` | SWC plugin is v3 pattern; Oxc is default in v6 |

**Installation:**
```bash
# Scaffold
npm create vite@latest word-chicken -- --template react-ts

# Tailwind v4
npm install tailwindcss @tailwindcss/vite

# State
npm install zustand

# Testing
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

---

## Architecture Patterns

### Recommended Project Structure
```
public/
├── TWL06.txt            # Plain-text word list — served statically, never bundled
src/
├── components/          # Shared UI primitives (Tile, Button, etc.)
├── screens/             # Top-level screen components
│   ├── ConfigScreen.tsx
│   └── GameScreen.tsx
├── store/               # Zustand slices
│   ├── appSlice.ts      # screen navigation state
│   └── dictionarySlice.ts  # dictionary Set + loading state
├── hooks/               # Custom hooks
│   └── useDictionary.ts # fetch + parse TWL06.txt
├── lib/                 # Pure utility functions (no React)
│   └── parseWordList.ts # parse text blob into Set<string>
├── App.tsx              # Root — reads screen from store, renders correct screen
├── main.tsx             # Entry point
└── index.css            # @import "tailwindcss"; @theme { ... }
```

### Pattern 1: Zustand Store with TypeScript Slices

**What:** Define store state and actions in a typed interface, use `create<State>()()` syntax for v5.
**When to use:** All shared state. Never colocate dictionary Set in component state.

```typescript
// Source: https://github.com/pmndrs/zustand (v5 README)
import { create } from 'zustand'

type Screen = 'config' | 'game'

interface AppState {
  screen: Screen
  setScreen: (screen: Screen) => void
}

export const useAppStore = create<AppState>()((set) => ({
  screen: 'config',
  setScreen: (screen) => set({ screen }),
}))
```

### Pattern 2: Dictionary Slice with Loading State

**What:** Fetch TWL06.txt from `public/`, split on newline, populate a `Set<string>` in the store.
**When to use:** On app mount, once only. Loading state drives placeholder UI until ready.

```typescript
// Conceptual pattern — verified against MDN fetch + Set API
interface DictionaryState {
  words: Set<string>
  status: 'idle' | 'loading' | 'ready' | 'error'
  loadDictionary: () => Promise<void>
}

// In store action:
loadDictionary: async () => {
  set({ status: 'loading' })
  try {
    const res = await fetch('/TWL06.txt')
    const text = await res.text()
    const words = new Set(text.split('\n').map(w => w.trim().toLowerCase()).filter(Boolean))
    set({ words, status: 'ready' })
  } catch {
    set({ status: 'error' })
  }
}
```

### Pattern 3: Tailwind v4 Theme Definition

**What:** Define Corbusier palette and Jost font directly in CSS using `@theme`. No `tailwind.config.js` required.
**When to use:** `src/index.css` — single source of truth for all design tokens.

```css
/* src/index.css */
/* Source: https://tailwindcss.com/docs/theme */
@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=Jost:wght@400;700&display=swap');

@theme {
  /* Corbusier palette — primary accents */
  --color-corbusier-red: #d0021b;
  --color-corbusier-blue: #003f91;
  --color-corbusier-yellow: #f5a623;
  /* Neutrals */
  --color-concrete: #f2f0eb;
  --color-charcoal: #3a3a3a;
  /* Font */
  --font-jost: 'Jost', sans-serif;
}
```

This auto-generates `bg-corbusier-red`, `text-corbusier-blue`, `font-jost`, etc.

### Pattern 4: Vitest Configuration

**What:** Extend `vite.config.ts` with a `test` block for jsdom + globals. Separate `vitest.setup.ts` for jest-dom matchers.

```typescript
// vite.config.ts
// Source: https://vitest.dev/config/
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/vitest.setup.ts'],
  },
})
```

```typescript
// src/vitest.setup.ts
import '@testing-library/jest-dom'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})
```

### Anti-Patterns to Avoid

- **Bundling the word list as a JS import:** `import words from './words.json'` adds ~3MB to the JS parse graph. Use `fetch('/TWL06.txt')` instead.
- **Storing dictionary in React state:** `useState(new Set())` in a component means the Set is recreated on each re-render parent subtree. Store it in Zustand.
- **Using `tailwind.config.js` with v4:** v4 dropped JS config as primary mechanism. Any `tailwind.config.js` is ignored unless you opt into legacy compat mode. Define tokens in CSS via `@theme`.
- **Installing `@tailwindcss/postcss` without `@tailwindcss/vite`:** For Vite projects, the dedicated Vite plugin is faster and requires less boilerplate than the PostCSS path.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSS utility classes | Custom CSS helper classes | Tailwind v4 | Responsive, consistent design system already built |
| Component testing DOM | Manual `document.createElement` | @testing-library/react | Handles async rendering, cleanup, accessibility queries |
| State management | `useContext` + `useReducer` boilerplate | Zustand | Phase 3 needs a reducer-compatible store; Zustand supports it natively |
| Google Font loading | Manual woff2 download + @font-face | Google Fonts CDN `@import` in CSS | Simpler in Phase 1; self-host via Fontsource if privacy matters |

---

## Common Pitfalls

### Pitfall 1: Tailwind v4 Config File Not Found

**What goes wrong:** Developer runs `npx tailwindcss init`, creates `tailwind.config.js`, adds `content` glob — then finds no utility classes are generated.
**Why it happens:** v4's Vite plugin uses automatic content detection. The JS config file is not the configuration mechanism.
**How to avoid:** Install `@tailwindcss/vite`, add it to `vite.config.ts` plugins, add `@import "tailwindcss"` to `index.css`. No config file needed.
**Warning signs:** All Tailwind utilities produce no CSS output; no `dist/assets/*.css` contains utility classes.

### Pitfall 2: Dictionary Loaded on Every Re-render

**What goes wrong:** `useDictionary` hook calls `fetch` inside a `useEffect` without a guard, causing repeated fetches on hot module reload or parent re-renders.
**Why it happens:** Effect dependency array misconfiguration, or dictionary state lives in local component state.
**How to avoid:** Check `status !== 'idle'` before fetching. Load once in `App.tsx` `useEffect` on mount. Store in Zustand so the Set survives re-renders.
**Warning signs:** Network tab shows repeated `TWL06.txt` requests; `status` flickers between `loading` and `ready`.

### Pitfall 3: Vitest Cannot Find `describe`/`expect` Globals

**What goes wrong:** Tests fail with `ReferenceError: describe is not defined`.
**Why it happens:** `globals: true` not set in `vite.config.ts` test block.
**How to avoid:** Add `globals: true` to the `test` config. Also add `"types": ["vitest/globals"]` to `tsconfig.json` to prevent TypeScript errors.
**Warning signs:** TypeScript red squiggles on `describe`, `it`, `expect`; runtime errors on first `npm test`.

### Pitfall 4: Vite 8 Requires Node 20.19+

**What goes wrong:** `npm run dev` fails with an obscure error on older Node.
**Why it happens:** Vite 8 (Rolldown) requires Node.js 20.19+ or 22.12+.
**How to avoid:** Check `node --version` before scaffolding. Add `engines` field to `package.json`.
**Warning signs:** Install errors mentioning native module compatibility.

### Pitfall 5: Word List Includes Empty Strings / Windows Line Endings

**What goes wrong:** `Set` contains `''` (empty string) or `'\r'`-suffixed words; lookups for valid words fail.
**Why it happens:** `text.split('\n')` on a CRLF file produces words ending with `\r`. Empty last line produces `''`.
**How to avoid:** `.map(w => w.trim().toLowerCase()).filter(Boolean)` in the parse step.
**Warning signs:** `words.has('cat')` returns `false`; `words.size` is 1 more than expected.

---

## Code Examples

### Dictionary Module (complete)

```typescript
// src/store/dictionarySlice.ts
import { create } from 'zustand'

interface DictionarySlice {
  words: Set<string>
  status: 'idle' | 'loading' | 'ready' | 'error'
  loadDictionary: () => Promise<void>
}

export const useDictionaryStore = create<DictionarySlice>()((set, get) => ({
  words: new Set(),
  status: 'idle',
  loadDictionary: async () => {
    if (get().status !== 'idle') return          // prevent duplicate fetches
    set({ status: 'loading' })
    try {
      const res = await fetch('/TWL06.txt')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const text = await res.text()
      const words = new Set(
        text.split('\n').map(w => w.trim().toLowerCase()).filter(Boolean)
      )
      set({ words, status: 'ready' })
    } catch {
      set({ status: 'error' })
    }
  },
}))
```

### App Shell (conditional render pattern)

```typescript
// src/App.tsx
import { useEffect } from 'react'
import { useAppStore } from './store/appSlice'
import { useDictionaryStore } from './store/dictionarySlice'
import { ConfigScreen } from './screens/ConfigScreen'
import { GameScreen } from './screens/GameScreen'

export function App() {
  const screen = useAppStore(s => s.screen)
  const { status, loadDictionary } = useDictionaryStore()

  useEffect(() => {
    loadDictionary()
  }, [loadDictionary])

  if (status === 'loading') return <div className="font-jost">Loading dictionary…</div>
  if (status === 'error') return <div className="font-jost text-corbusier-red">Failed to load dictionary.</div>

  return screen === 'config' ? <ConfigScreen /> : <GameScreen />
}
```

### Dictionary Hook Test

```typescript
// src/lib/__tests__/parseWordList.test.ts
import { describe, it, expect } from 'vitest'
import { parseWordList } from '../parseWordList'

describe('parseWordList', () => {
  it('parses newline-separated words into a Set', () => {
    const words = parseWordList('cat\ndog\nbird\n')
    expect(words.has('cat')).toBe(true)
    expect(words.has('dog')).toBe(true)
  })

  it('trims whitespace and lowercases', () => {
    const words = parseWordList('CAT\r\n DOG \n')
    expect(words.has('cat')).toBe(true)
    expect(words.has('dog')).toBe(true)
  })

  it('filters empty strings', () => {
    const words = parseWordList('cat\n\ndog\n')
    expect(words.has('')).toBe(false)
    expect(words.size).toBe(2)
  })
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.js` with `content` globs | `@import "tailwindcss"` + `@theme {}` in CSS | v4.0 (Jan 2025) | No JS config file, no PostCSS boilerplate |
| Rollup/esbuild bundler in Vite | Rolldown (Rust-based) in Vite 8 | Dec 2025 | 10-30x faster builds; same plugin API |
| `@vitejs/plugin-react-swc` for fast transforms | `@vitejs/plugin-react` v6 (Oxc default) | Vite 8 / plugin v6 | Babel no longer a dependency; smaller install |
| Zustand `create(...)` (v4 syntax) | `create<State>()()` curried call (v5) | Zustand v5 (2024) | Better TypeScript inference without explicit generic |
| Vitest in vite.config.ts `test` block | Same pattern, now Vitest 4.x | Vitest 4 (2025) | Parallel test execution improvements |

**Deprecated/outdated:**
- `@tailwindcss/postcss` as primary Vite integration: replaced by `@tailwindcss/vite` plugin
- `@vitejs/plugin-react-swc`: still works but the standard plugin now uses Oxc and is preferred for new projects
- `tailwind.config.js` content array: v4 auto-detects content, JS config is opt-in legacy

---

## Open Questions

1. **TWL06 copyright status**
   - What we know: TWL06 is maintained by NASPA; the `cviebrock/wordlists` repo (archived 2023) hosts the file and many open-source word game projects reference it freely
   - What's unclear: Whether redistribution in a public GitHub repo triggers licensing concerns for a non-commercial game
   - Recommendation: Use the file for development. If the project ever goes commercial, investigate NWL/Collins licensing or use the public-domain ENABLE word list as a fallback (~172K words, well-accepted for word games)

2. **Google Fonts CDN vs self-hosted Jost**
   - What we know: Google Fonts CDN `@import` is the simplest Phase 1 approach; Fontsource npm package enables self-hosting
   - What's unclear: Whether the project will be deployed to environments where external CDN requests are acceptable
   - Recommendation: Use Google Fonts CDN `@import` in Phase 1; switch to Fontsource if needed in Phase 4

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.x |
| Config file | `vite.config.ts` (test block) — see Wave 0 |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WVAL-01 | `parseWordList` returns `Set<string>` with correct membership | unit | `npm test -- --run src/lib/__tests__/parseWordList.test.ts` | Wave 0 |
| WVAL-01 | Dictionary `status` transitions from `idle` → `loading` → `ready` | unit | `npm test -- --run src/store/__tests__/dictionarySlice.test.ts` | Wave 0 |
| WVAL-01 | `useDictionary` does not fetch twice on re-render | unit | included in slice test | Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test -- --run`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/lib/__tests__/parseWordList.test.ts` — covers WVAL-01 parsing behavior
- [ ] `src/store/__tests__/dictionarySlice.test.ts` — covers WVAL-01 loading state machine
- [ ] `src/vitest.setup.ts` — jest-dom matchers setup
- [ ] Framework install: `npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event`
- [ ] `TWL06.txt` placed at `public/TWL06.txt`

---

## Sources

### Primary (HIGH confidence)
- [Vite official docs](https://vite.dev/guide/) — scaffolding command, Vite 8 version
- [Vite 8 release blog](https://vite.dev/blog/announcing-vite8) — Rolldown integration, plugin-react v6 details
- [Tailwind CSS v4 theme docs](https://tailwindcss.com/docs/theme) — `@theme` directive, custom colors, custom fonts
- [Tailwind CSS v4 release](https://tailwindcss.com/blog/tailwindcss-v4) — v4 architecture changes
- [Vitest docs](https://vitest.dev/guide/) — version 4.1.0 confirmed, configuration options
- [cviebrock/wordlists TWL06.txt](https://github.com/cviebrock/wordlists/blob/master/TWL06.txt) — 178,691 words, newline-separated plain text, raw URL confirmed
- [Fontsource Jost](https://fontsource.org/fonts/jost) — self-hosting alternative for Jost
- [Google Fonts Jost](https://fonts.google.com/specimen/Jost) — CDN import method

### Secondary (MEDIUM confidence)
- [npmjs zustand](https://www.npmjs.com/package/zustand) — v5.0.12 confirmed as latest (search result citation)
- Multiple 2025 guides confirming `create<State>()()` curried TypeScript pattern for Zustand v5
- Multiple 2025 guides confirming `globals: true` + `environment: 'jsdom'` + `setupFiles` Vitest config pattern

### Tertiary (LOW confidence)
- Word list licensing status — not verified against official NASPA terms; flagged as open question

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions confirmed via official docs and recent search results
- Architecture: HIGH — Zustand slice pattern, Tailwind v4 CSS-first pattern verified with official sources
- Dictionary approach: HIGH — fetch + Set pattern is idiomatic JS; TWL06.txt raw URL verified
- Pitfalls: MEDIUM — drawn from official docs (v4 config changes) and common community experience
- TWL06 licensing: LOW — not verified against official NASPA licensing terms

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (30 days — stable libraries; Tailwind v4 and Vite 8 are recent majors, check for patches)
