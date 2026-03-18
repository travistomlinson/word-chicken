---
phase: 2
slug: core-engine
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x |
| **Config file** | `vite.config.ts` (test block, already configured) |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 1 | WVAL-02 | unit | `npm test -- --run src/lib/__tests__/wordValidator.test.ts` | ❌ W0 | ⬜ pending |
| 2-01-02 | 01 | 1 | WVAL-03 | unit | `npm test -- --run src/lib/__tests__/wordValidator.test.ts` | ❌ W0 | ⬜ pending |
| 2-01-03 | 01 | 1 | WVAL-04 | unit | `npm test -- --run src/lib/__tests__/wordValidator.test.ts` | ❌ W0 | ⬜ pending |
| 2-01-04 | 01 | 1 | GAME-02 | unit | `npm test -- --run src/lib/__tests__/wordValidator.test.ts` | ❌ W0 | ⬜ pending |
| 2-01-05 | 01 | 1 | GAME-03 | unit | `npm test -- --run src/lib/__tests__/wordValidator.test.ts` | ❌ W0 | ⬜ pending |
| 2-01-06 | 01 | 1 | GAME-04 | unit | `npm test -- --run src/lib/__tests__/wordValidator.test.ts` | ❌ W0 | ⬜ pending |
| 2-01-07 | 01 | 1 | GAME-11 | unit | `npm test -- --run src/lib/__tests__/wordValidator.test.ts` | ❌ W0 | ⬜ pending |
| 2-02-01 | 02 | 1 | TILE-01 | unit | `npm test -- --run src/lib/__tests__/tileBag.test.ts` | ❌ W0 | ⬜ pending |
| 2-02-02 | 02 | 1 | TILE-02 | unit | `npm test -- --run src/lib/__tests__/tileBag.test.ts` | ❌ W0 | ⬜ pending |
| 2-02-03 | 02 | 1 | TILE-03 | statistical | `npm test -- --run src/lib/__tests__/tileBag.test.ts` | ❌ W0 | ⬜ pending |
| 2-02-04 | 02 | 1 | TILE-04 | unit | `npm test -- --run src/lib/__tests__/tileBag.test.ts` | ❌ W0 | ⬜ pending |
| 2-02-05 | 02 | 1 | TILE-05 | unit | `npm test -- --run src/lib/__tests__/tileBag.test.ts` | ❌ W0 | ⬜ pending |
| 2-03-01 | 03 | 2 | SCOR-01 | unit | `npm test -- --run src/lib/__tests__/scoreCalculator.test.ts` | ❌ W0 | ⬜ pending |
| 2-03-02 | 03 | 2 | SCOR-02 | unit | `npm test -- --run src/lib/__tests__/scoreCalculator.test.ts` | ❌ W0 | ⬜ pending |
| 2-03-03 | 03 | 2 | GAME-01 | unit | `npm test -- --run src/lib/__tests__/roundManager.test.ts` | ❌ W0 | ⬜ pending |
| 2-03-04 | 03 | 2 | GAME-05 | unit | `npm test -- --run src/lib/__tests__/roundManager.test.ts` | ❌ W0 | ⬜ pending |
| 2-03-05 | 03 | 2 | GAME-06 | unit | `npm test -- --run src/lib/__tests__/roundManager.test.ts` | ❌ W0 | ⬜ pending |
| 2-03-06 | 03 | 2 | GAME-07 | unit | `npm test -- --run src/lib/__tests__/roundManager.test.ts` | ❌ W0 | ⬜ pending |
| 2-03-07 | 03 | 2 | GAME-08 | unit | `npm test -- --run src/lib/__tests__/roundManager.test.ts` | ❌ W0 | ⬜ pending |
| 2-03-08 | 03 | 2 | GAME-09 | unit | `npm test -- --run src/lib/__tests__/roundManager.test.ts` | ❌ W0 | ⬜ pending |
| 2-03-09 | 03 | 2 | GAME-10 | unit | `npm test -- --run src/lib/__tests__/roundManager.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/__tests__/wordValidator.test.ts` — stubs for WVAL-02, WVAL-03, WVAL-04, GAME-02, GAME-03, GAME-04, GAME-11
- [ ] `src/lib/__tests__/tileBag.test.ts` — stubs for TILE-01 through TILE-05
- [ ] `src/lib/__tests__/scoreCalculator.test.ts` — stubs for SCOR-01, SCOR-02
- [ ] `src/lib/__tests__/roundManager.test.ts` — stubs for GAME-01, GAME-05 through GAME-10
- [ ] `src/types/game.ts` — shared TypeScript interfaces for game state

*Existing infrastructure covers framework needs (Vitest already configured).*

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
