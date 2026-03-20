---
phase: 8
slug: visual-polish-and-hierarchy
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.1.0 |
| **Config file** | vite.config.ts (vitest config inline) |
| **Quick run command** | `npx vitest run src/__tests__/visual-polish.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/__tests__/visual-polish.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 0 | ALL | unit (static) | `npx vitest run src/__tests__/visual-polish.test.ts` | ❌ W0 | ⬜ pending |
| 08-02-01 | 02 | 1 | PLSH-01 | unit (static) | `npx vitest run src/__tests__/visual-polish.test.ts` | ❌ W0 | ⬜ pending |
| 08-02-02 | 02 | 1 | PLSH-02 | unit (static) | `npx vitest run src/__tests__/visual-polish.test.ts` | ❌ W0 | ⬜ pending |
| 08-02-03 | 02 | 1 | PLSH-03 | unit (static) | `npx vitest run src/__tests__/visual-polish.test.ts` | ❌ W0 | ⬜ pending |
| 08-02-04 | 02 | 1 | PLSH-04 | unit (static) | `npx vitest run src/__tests__/visual-polish.test.ts` | ❌ W0 | ⬜ pending |
| 08-02-05 | 02 | 1 | PLSH-05 | unit (static) | `npx vitest run src/__tests__/visual-polish.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/visual-polish.test.ts` — stubs for PLSH-01, PLSH-02, PLSH-03, PLSH-04, PLSH-05

*Existing infrastructure covers test framework; only test file needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Turn indicator visual dominance at a glance | PLSH-01 | Visual hierarchy is perceptual | View top bar, confirm turn state is immediately obvious |
| Score panel hierarchy readability | PLSH-02 | Visual weight is perceptual | View score panel, confirm round vs total is clear without reading labels |
| ChickenOMeter fill perceptibility on mobile | PLSH-03 | Mobile viewport perception | View on 375px viewport, confirm fill level is readable |
| Staged tile "taken" appearance | PLSH-04 | Visual distinctness is perceptual | Stage a tile, confirm it looks clearly different from available tiles |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
