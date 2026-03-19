---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Design Audit
status: planning
stopped_at: Completed 05-viewport-foundation-01-PLAN.md
last_updated: "2026-03-19T15:16:08.199Z"
last_activity: 2026-03-18 — v1.1 roadmap written, ready for Phase 5 planning
progress:
  total_phases: 8
  completed_phases: 5
  total_plans: 13
  completed_plans: 13
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-18)

**Core value:** The escalating tension of "can I extend this word?" — the chicken moment where the word keeps growing and you either find a play or you're out.
**Current focus:** v1.1 Design Audit — Phase 5: Viewport Foundation

## Current Position

Phase: 5 of 8 (Viewport Foundation)
Plan: —
Status: Ready to plan
Last activity: 2026-03-18 — v1.1 roadmap written, ready for Phase 5 planning

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0 (v1.1)
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

*Updated after each plan completion*
| Phase 05-viewport-foundation P02 | 3m | 2 tasks | 4 files |
| Phase 05-viewport-foundation P01 | 2 | 2 tasks | 4 files |

## Accumulated Context

### Decisions

- [Phase 04-game-ui]: TileCard min-w/h-[44px] ensures mobile touch targets at all size variants
- [Phase 04-game-ui]: PlayerHand uses index-based staging — handles duplicate letters correctly; dual-layout (mobile 3/4/3 vs desktop flex-wrap) is load-bearing, do not merge
- [Phase 01-foundation]: Corbusier palette: red=#d0021b, blue=#003f91, yellow=#f5a623, concrete=#f2f0eb, charcoal=#3a3a3a
- [Research v1.1]: Root cause of all mobile layout issues is `min-h-screen` (resolves to `100vh` = large viewport). Fix: `h-svh flex flex-col` on App root, `flex-1` screens.
- [Research v1.1]: `viewport-fit=cover` must be in index.html before any `env(safe-area-inset-*)` CSS will return non-zero on real iOS.
- [Research v1.1]: Use `svh` on App shell (not `dvh`) to avoid reflow jitter during gameplay on iOS Safari.
- [Phase 05-viewport-foundation]: GameScreen uses min-h-dvh (not h-dvh) on outer container to avoid reflow jitter on iOS Safari; both fixed overlays use h-dvh; html:has(.dark) fixes dark mode overscroll bleed; viewport-fit=cover added as Phase 6 gate
- [Phase 05-viewport-foundation]: App shell loading/error states use min-h-svh (not dvh) to avoid reflow jitter on iOS Safari
- [Phase 05-viewport-foundation]: Scrollable screens (Config, Lobby) use min-h-dvh so content fills dynamic viewport after browser chrome collapses

### Pending Todos

- Silent reconnect without user notification (ui)
- Show valid word on elimination (ui)

### Blockers/Concerns

- Phase 6 gate: `env(safe-area-inset-bottom)` and lobby keyboard behavior require verification on a physical iOS device — DevTools simulation does not enforce the `viewport-fit=cover` gate.
- Phase 3 gate: All `ink/N` contrast values must be measured with a contrast tool in dark mode before shipping — do not estimate.

## Session Continuity

Last session: 2026-03-19T15:16:08.197Z
Stopped at: Completed 05-viewport-foundation-01-PLAN.md
Resume file: None
