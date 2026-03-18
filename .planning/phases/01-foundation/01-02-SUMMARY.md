---
phase: 01-foundation
plan: "02"
subsystem: dictionary
tags: [zustand, fetch, parsing, tdd, vitest]
dependency_graph:
  requires:
    - "01-01: Vite scaffold, Zustand v5, Vitest 4, public/TWL06.txt"
  provides:
    - "parseWordList pure function: text blob to Set<string>"
    - "useDictionaryStore: Zustand v5 store with idle->loading->ready|error state machine"
    - "App.tsx dictionary-gated screen rendering with loading/error UI"
  affects:
    - "Phase 2: all game logic modules can look up words via useDictionaryStore().words.has(word)"
    - "Phase 2: word validation WVAL-01 requirement fulfilled"
tech_stack:
  added: []
  patterns:
    - "Zustand v5 async action with guard (status !== 'idle' no-op prevents duplicate fetches)"
    - "fetch at runtime from public/ — dictionary not bundled in JS"
    - "TDD RED-GREEN cycle: failing tests committed before implementation"
    - "Store state reset between tests via useDictionaryStore.setState()"
    - "vi.stubGlobal('fetch', ...) for fetch mocking in Vitest"
key_files:
  created:
    - src/lib/parseWordList.ts
    - src/lib/__tests__/parseWordList.test.ts
    - src/store/dictionarySlice.ts
    - src/store/__tests__/dictionarySlice.test.ts
  modified:
    - src/App.tsx
    - src/__tests__/App.test.tsx
decisions:
  - "parseWordList splits on newline, not whitespace, to preserve CRLF compatibility via trim()"
  - "loadDictionary guard uses status !== 'idle' (not a boolean flag) to prevent duplicate fetches while also allowing future retry on error"
  - "App.tsx treats both 'idle' and 'loading' as loading states to prevent flash of content before useEffect fires"
  - "App tests mock dictionary to 'ready' state rather than mocking fetch — cleaner unit test boundary"
metrics:
  duration: "~2 minutes"
  completed_date: "2026-03-18"
  tasks_completed: 2
  files_created: 4
  files_modified: 2
  tests_passing: 17
---

# Phase 1 Plan 02: Dictionary Load and Parse Summary

**One-liner:** TWL06.txt fetched at runtime via fetch('/TWL06.txt'), parsed into Set<string> by parseWordList, managed by useDictionaryStore with idle->loading->ready|error state machine, gating App.tsx screen rendering.

## What Was Built

A complete dictionary loading pipeline built TDD-first:

- **parseWordList** — pure function splitting a text blob by newlines, trimming whitespace, lowercasing, and filtering empty strings into a `Set<string>`. Handles CRLF line endings naturally via `trim()`.
- **useDictionaryStore** — Zustand v5 store with `words: Set<string>`, `status: 'idle' | 'loading' | 'ready' | 'error'`, and `loadDictionary()` async action. The action guards against duplicate fetches (returns early if status is not `'idle'`). Fetch errors transition to `'error'` state.
- **App.tsx updated** — `useEffect` triggers `loadDictionary()` on mount. During `'idle'` or `'loading'` status, renders "Loading dictionary..." centered on `bg-concrete` in `font-jost text-charcoal`. During `'error'`, renders "Failed to load dictionary." in `text-corbusier-red`. Screen router only renders when `status === 'ready'`.
- **Test suite** — 17 tests total across 4 test files: 4 parseWordList unit tests, 5 dictionarySlice unit tests (with fetch mocking via `vi.stubGlobal`), 3 original appSlice tests, 5 App component tests (2 original + 3 new for loading/idle/error states).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] App.test.tsx updated to mock dictionary store**
- **Found during:** Task 2
- **Issue:** Existing App tests rendered App with default store state (status: 'idle'), which after the update would show the loading screen instead of ConfigScreen — breaking the existing tests and not testing the intended behavior.
- **Fix:** Added `useDictionaryStore.setState({ words: new Set(['test']), status: 'ready' })` in the `beforeEach` of App tests, establishing a clean boundary between dictionary loading tests and screen routing tests. Also added 3 new App tests covering loading, idle, and error states.
- **Files modified:** `src/__tests__/App.test.tsx`
- **Commit:** 86974c3

## Verification Results

- `npm test -- --run` — 17/17 tests pass (4 test files)
- `npm run build` — succeeds, 0 errors. JS bundle: 197KB (correct — TWL06.txt not bundled)
- Pre-existing CSS `@import` ordering warning (unchanged from Plan 01)

## Self-Check: PASSED
