---
phase: 01-foundation
plan: "01"
subsystem: scaffold
tags: [vite, react, typescript, tailwind, zustand, vitest, setup]
dependency_graph:
  requires: []
  provides:
    - "Vite 6 + React 19 + TypeScript project scaffold"
    - "Tailwind v4 CSS-first theme with Le Corbusier palette"
    - "Zustand v5 screen navigation store"
    - "Vitest 4 test suite with 5 passing smoke tests"
    - "TWL06.txt word list (178k lines) in public/"
  affects:
    - "01-02: dictionary module can fetch TWL06.txt from public/"
    - "All phases: inherit Tailwind theme, Jost font, and Corbusier palette"
    - "Phase 3: Zustand store will be extended for game FSM"
tech_stack:
  added:
    - "react@19.2.4 + react-dom@19.2.4"
    - "vite@6.4.1 + @vitejs/plugin-react@4.3.4"
    - "tailwindcss@4.2.2 + @tailwindcss/vite@4.0.x"
    - "zustand@5.0.12"
    - "vitest@4.1.0"
    - "@testing-library/react@16.3.2 + jest-dom@6.9.1 + user-event@14.6.1"
    - "typescript@5.6.x"
    - "jsdom@25 (v29 incompatible with Node 22.9)"
  patterns:
    - "Tailwind v4 CSS-first config via @theme directive (no tailwind.config.js)"
    - "Zustand v5 store with create<State>()(set => ...) pattern"
    - "vitest/config defineConfig to avoid vite version conflicts"
key_files:
  created:
    - package.json
    - vite.config.ts
    - tsconfig.json
    - tsconfig.app.json
    - tsconfig.node.json
    - index.html
    - src/main.tsx
    - src/vite-env.d.ts
    - src/vitest.setup.ts
    - src/index.css
    - src/App.tsx
    - src/store/appSlice.ts
    - src/screens/ConfigScreen.tsx
    - src/screens/GameScreen.tsx
    - src/__tests__/App.test.tsx
    - src/store/__tests__/appSlice.test.ts
    - public/TWL06.txt
  modified: []
decisions:
  - "Used vitest@4.1.0 (not 2.x) to avoid bundled vite version conflicts with project vite@6"
  - "Downgraded jsdom to v25 (v29 requires Node ^22.12, project is on Node 22.9)"
  - "Used defineConfig from vitest/config (not vite) to get typed test block"
  - "Corbusier palette: red=#d0021b, blue=#003f91, yellow=#f5a623, concrete=#f2f0eb, charcoal=#3a3a3a"
  - "Sharp corners and no shadows throughout — per user visual direction"
metrics:
  duration: "~5 minutes"
  completed_date: "2026-03-18"
  tasks_completed: 3
  files_created: 17
  tests_passing: 5
---

# Phase 1 Plan 01: Project Scaffold Summary

**One-liner:** Vite 6 + React 19 + TypeScript scaffold with Tailwind v4 Le Corbusier theme, Zustand v5 screen routing, Vitest 4 smoke tests, and TWL06.txt word list.

## What Was Built

A complete Vite project scaffold bootstrapped from scratch (the project directory had no source files). The scaffold delivers:

- **Vite 6 + React 19 + TypeScript** dev/build/test pipeline with clean build
- **Tailwind v4** using the new CSS-first `@theme` configuration (no `tailwind.config.js`)
- **Le Corbusier visual theme** — `bg-concrete`, `text-charcoal`, `bg-corbusier-red`, `bg-corbusier-blue`, `bg-corbusier-yellow` Tailwind utilities, Jost font via Google Fonts
- **Zustand v5** `useAppStore` with `screen: 'config' | 'game'` and `setScreen()` action
- **Placeholder screens** — ConfigScreen with "Word Chicken" heading + "Start Game" button; GameScreen with "Game Screen" heading + "Back to Config" button; both using Corbusier styling with sharp corners
- **Vitest 4** test suite with 5 passing smoke tests (3 store unit tests, 2 component integration tests)
- **TWL06.txt** (178,690 lines) downloaded from cviebrock/wordlists and placed in `public/` — ready for Phase 1 Plan 02 to fetch and parse

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Upgraded vitest from 2.x to 4.x**
- **Found during:** Task 1
- **Issue:** vitest@2.1.9 bundles its own vite in `node_modules/vitest/node_modules/vite`, creating TypeScript type conflicts when using `defineConfig` from `vitest/config` with plugins from the project's own vite@6
- **Fix:** Upgraded to vitest@4.1.0 which no longer bundles vite; used `defineConfig` from `vitest/config` to get the typed `test` block
- **Files modified:** `package.json`, `vite.config.ts`

**2. [Rule 3 - Blocking] Downgraded jsdom from 29 to 25**
- **Found during:** Task 3
- **Issue:** jsdom@29 depends on `@exodus/bytes` which is ESM-only, but `html-encoding-sniffer` requires it via `require()`. Node 22.9 does not support `require()` of ESM modules. jsdom@29 requires Node ^22.12.
- **Fix:** Downgraded jsdom to v25 (compatible with Node 22.9), all tests pass
- **Files modified:** `package.json`

## Verification Results

- `npm run build` — passes, 0 errors, 0 warnings
- `npm test -- --run` — 5/5 tests pass (2 test files)
- `public/TWL06.txt` — 178,690 lines, valid word list
- Build output: `index.js` 196KB, `index.css` 8.6KB (includes full Tailwind base + theme)

## Self-Check: PASSED

All key files exist on disk. All 3 task commits verified in git log (df54700, f36cf7e, c2b1ec3). Build and tests pass.
