# Stack Research

**Domain:** Browser-based word game with AI opponents (single-player v1)
**Researched:** 2026-03-18
**Confidence:** MEDIUM-HIGH — core framework choices are HIGH confidence; dictionary library choice is MEDIUM due to thin npm ecosystem for this niche

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React | 19.x (19.0.4 current) | UI framework | The default for interactive browser apps in 2026. Server components and Actions API are irrelevant here — keep client-only. React's component model maps cleanly onto game UI: hand, board, turn indicator, score. |
| TypeScript | 6.0 (released 2026-03-17) | Type safety | Game state (tiles, turns, word validity results, AI state) is complex enough that untyped JS creates debugging nightmares. TS 6.0 is the current stable; TS 5.9 is safe if upgrading feels risky. |
| Vite | 8.x (8.0 current) | Build tool + dev server | Near-instant HMR critical for iterating on game feel. Vite 8 ships Rolldown (Rust bundler) — 10-30x faster builds. No config needed for React+TS template. |
| Zustand | 5.x (5.0.12 current) | Game state management | Turn-based games need shared state (whose turn, current word, tile hands, scores, AI state). Zustand is hook-native, 20M weekly downloads, no boilerplate. Redux is overkill for a single-page game with no server sync. |
| Tailwind CSS | 4.x (4.1 current) | Styling | Game UI is mostly custom layout (tile grids, letter tiles, score panels). Tailwind's utility classes make responsive tile-based layouts faster than hand-written CSS. v4 uses Rust engine — 5x faster builds, CSS-native config. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| pf-sowpods | latest (~0.x) | SOWPODS word list + trie validation | Client-side word checking without API calls. Contains 267,751 words with built-in `verify()` trie lookup. Use when SOWPODS (international) is the chosen dictionary. |
| scrabble-dict | 1.0.2 | TWL dictionary, browser-compatible | Use instead of pf-sowpods when TWL06 (North American Scrabble) is preferred. Includes base64+pako compression for smaller bundle. |
| Vitest | 4.x | Unit testing | Testing game logic (word validator, AI move selection, tile distribution, scoring). Browser Mode is stable in v4. Critical for testing AI difficulty behavior deterministically. |
| @testing-library/react | latest | Component testing | Testing UI interactions (tile selection, word submission, turn flow). Pair with Vitest. |
| framer-motion | 11.x | Tile animations | Tile draw animations, letter placement transitions, elimination effects. Optional but raises polish significantly for a word game where tile manipulation is the core interaction. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Vite react-ts template | Scaffolding | `npm create vite@latest word-chicken -- --template react-ts` generates correct tsconfig, vite.config.ts, and index.html without manual wiring. |
| ESLint (flat config) | Code quality | Use `eslint.config.js` (flat config, now default). Add `typescript-eslint` and `eslint-plugin-react-hooks`. |
| Prettier | Formatting | Set once, forget. Consistent formatting across game logic files. |

## Installation

```bash
# Scaffold with Vite react-ts template
npm create vite@latest word-chicken -- --template react-ts
cd word-chicken

# State management
npm install zustand

# Styling
npm install -D tailwindcss @tailwindcss/vite

# Dictionary — choose one:
npm install pf-sowpods          # SOWPODS (267,751 words, international)
# OR
npm install scrabble-dict       # TWL (178,691 words, North American)

# Testing
npm install -D vitest @vitest/browser playwright
npm install -D @testing-library/react @testing-library/user-event

# Optional: tile animations
npm install framer-motion
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Zustand | Redux Toolkit | If game later grows to multiplayer with server sync, complex middleware, or time-travel debugging needs (undo system) |
| Zustand | React Context | Only if state is truly local and contained — game state crosses too many components for Context to be practical |
| Vite | Next.js | If you need SSR, SEO, or server-rendered pages — Word Chicken is a pure client-side game, Next.js adds unnecessary server complexity |
| Vite | Create React App | CRA is deprecated and unmaintained as of 2023. Never use it for new projects. |
| pf-sowpods | Dictionary API (e.g., Merriam-Webster) | If you want human-readable definitions to show players. Adds network dependency, API cost, latency. Not worth it for pure validation. |
| Tailwind | CSS Modules | If the team has strong CSS background and dislikes utility classes. CSS Modules are fine but require more context-switching for tile layout work. |
| Vitest | Jest | Jest is viable but requires more config for ESM and Vite integration. Vitest is zero-config with Vite. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Create React App (CRA) | Officially deprecated in 2023. Webpack-based, slow, no maintenance. | Vite 8 with react-ts template |
| jQuery | No place in a React component tree. Mixing imperative DOM manipulation with React causes subtle bugs. | React state + refs where DOM access is needed |
| Server-side dictionary APIs (Merriam-Webster, Free Dictionary API) | Network latency makes word validation feel sluggish mid-turn. Offline play is broken. API rate limits or costs. | Bundle pf-sowpods or scrabble-dict client-side |
| Canvas/WebGL (Pixi.js, Phaser) | Word Chicken is a UI-driven card/tile game, not a canvas game. DOM-based React is easier to style, accessible, and sufficient for tile manipulation. | React + Tailwind |
| MobX | Adds observable complexity for a game that doesn't need reactive class-based models. Zustand's functional approach is simpler. | Zustand |
| Redux (bare) | Without Redux Toolkit, Redux requires 3x the boilerplate for the same result. | Zustand (preferred) or Redux Toolkit |

## Stack Patterns by Variant

**If TWL is chosen over SOWPODS:**
- Use `scrabble-dict` instead of `pf-sowpods`
- TWL has ~89,000 fewer words — AI will have fewer valid moves, which actually makes difficulty tuning easier
- TWL is more familiar to North American players; SOWPODS allows more obscure words

**If multiplayer is added later (v2):**
- Add a Node.js/Express or Hono backend for WebSocket-based turn sync
- Migrate game state from Zustand to a server-authoritative model
- Zustand remains valid on the client for local UI state
- Consider Partykit or Cloudflare Durable Objects for lightweight multiplayer without a full server

**For AI difficulty implementation:**
- Build AI as a pure TypeScript module (no library needed)
- Easy: pick shortest valid extension from common words only (top 5,000 word frequency list)
- Medium: random valid word from full dictionary that extends current word
- Hard: pick the extension that leaves fewest opponent extensions (game-tree look-ahead, 1-2 depth)
- Pre-build a trie from the word list at game startup — O(1) prefix checks during AI search

**If tile animation feels like scope creep:**
- Skip `framer-motion` in v1
- Plain CSS transitions on tile movement are sufficient for MVP
- Add framer-motion in a polish pass when core game loop is solid

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| React 19.x | Vite 8.x | First-class support via `@vitejs/plugin-react` |
| React 19.x | framer-motion 11.x | framer-motion 11 added React 19 support explicitly |
| TypeScript 6.0 | Vite 8.x | Vite 8 ships with TS 6 support |
| Zustand 5.x | React 19.x | Zustand 5 targets React 18+ hooks API, compatible with 19 |
| Tailwind 4.x | Vite 8.x | Use `@tailwindcss/vite` plugin — replaces PostCSS approach |
| Vitest 4.x | Vite 8.x | Same config file, zero friction |

## Dictionary Size Considerations

The word list is the largest bundle concern for this project.

| Dictionary | Words | Raw size | Compressed (gzip) | Approach |
|------------|-------|----------|-------------------|---------|
| SOWPODS (pf-sowpods) | 267,751 | ~2.7 MB | ~750 KB | Load once at app start; build trie in memory |
| TWL06 (scrabble-dict) | 178,691 | ~1.9 MB | ~400 KB | Compressed with pako internally |
| Custom word frequency list | ~5,000 | <50 KB | <15 KB | Supplementary list for AI difficulty filtering |

TWL is the better default for v1 — smaller bundle, still comprehensive, more familiar to English-speaking players. If SOWPODS is chosen, lazy-load it after the game UI renders to avoid blocking the initial paint.

## Sources

- [React versions](https://react.dev/versions) — confirmed 19.0.4 current stable
- [Vite blog: announcing vite8](https://vite.dev/blog/announcing-vite8) — Vite 8 with Rolldown confirmed current
- [TypeScript 5.9 docs](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html) — TS 6.0 confirmed released 2026-03-17
- [Tailwind v4.0 announcement](https://tailwindcss.com/blog/tailwindcss-v4) — v4 stable confirmed
- [Zustand npm](https://www.npmjs.com/package/zustand) — 5.0.12 current, 20M weekly downloads confirmed
- [Vitest browser mode](https://vitest.dev/guide/browser/) — v4 browser mode stable confirmed
- [pf-sowpods GitHub](https://github.com/pillowfication/pf-sowpods) — SOWPODS trie structure confirmed, 267,751 words
- [scrabble-dict GitHub](https://github.com/siddharthvader/scrabble-dict) — TWL, TypeScript, browser-compatible confirmed
- [John Resig trie performance](https://johnresig.com/blog/javascript-trie-performance-analysis/) — trie approach for JS dictionary lookups (MEDIUM confidence — older post but algorithm still valid)
- [Zustand vs Redux 2025](https://dev.to/themachinepulse/do-you-need-state-management-in-2025-react-context-vs-zustand-vs-jotai-vs-redux-1ho) — community consensus on Zustand for game-scale state (MEDIUM confidence — community article)

---
*Stack research for: browser-based word game with AI opponents*
*Researched: 2026-03-18*
