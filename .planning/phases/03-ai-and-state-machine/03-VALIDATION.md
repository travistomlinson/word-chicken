---
phase: 3
slug: ai-and-state-machine
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 3 — Validation Strategy

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
| 03-01-01 | 01 | 1 | AI-01, AI-07 | unit | `npm test -- --run src/lib/__tests__/gameReducer.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | SCOR-03, SCOR-04 | unit | `npm test -- --run src/lib/__tests__/gameReducer.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | AI-01 | integration | `npm test -- --run src/lib/__tests__/gameReducer.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 1 | AI-02, AI-04, AI-05 | unit | `npm test -- --run src/lib/__tests__/aiEngine.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 1 | AI-03, AI-06 | unit | `npm test -- --run src/lib/__tests__/aiEngine.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/__tests__/gameReducer.test.ts` — stubs for AI-01, AI-07, SCOR-03, SCOR-04, integration
- [ ] `src/lib/__tests__/aiEngine.test.ts` — stubs for AI-02, AI-03, AI-04, AI-05, AI-06

*Existing infrastructure (Vitest, vite.config.ts test block) covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| AI computation doesn't freeze UI | AI success criteria #3 | Requires browser rendering context | 1. Start game vs AI 2. Trigger AI turn 3. Verify UI remains responsive during AI computation |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
