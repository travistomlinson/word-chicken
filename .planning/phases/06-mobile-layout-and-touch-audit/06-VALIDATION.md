---
phase: 6
slug: mobile-layout-and-touch-audit
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 + jsdom |
| **Config file** | `vite.config.ts` (test section) |
| **Quick run command** | `npx vitest run src/__tests__/mobile-touch.test.tsx` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/__tests__/mobile-touch.test.tsx`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green + manual physical device check
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 0 | VPRT-04, TUCH-01, TUCH-02, TUCH-03 | unit (source scan) | `npx vitest run src/__tests__/mobile-touch.test.tsx` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | VPRT-04 | unit (source scan) | `npx vitest run src/__tests__/mobile-touch.test.tsx` | ❌ W0 | ⬜ pending |
| 06-01-03 | 01 | 1 | VPRT-04 | unit (source scan) | `npx vitest run src/__tests__/mobile-touch.test.tsx` | ❌ W0 | ⬜ pending |
| 06-01-04 | 01 | 1 | TUCH-01 | unit (source scan) | `npx vitest run src/__tests__/mobile-touch.test.tsx` | ❌ W0 | ⬜ pending |
| 06-01-05 | 01 | 1 | TUCH-02 | unit (source scan) | `npx vitest run src/__tests__/mobile-touch.test.tsx` | ❌ W0 | ⬜ pending |
| 06-01-06 | 01 | 1 | TUCH-03 | unit (source scan) | `npx vitest run src/__tests__/mobile-touch.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/mobile-touch.test.tsx` — stubs for VPRT-04, TUCH-01, TUCH-02, TUCH-03 via source-file scanning (same pattern as `viewport.test.tsx`)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| No UI clipped by notch/Dynamic Island | VPRT-04 | Physical device chrome cannot be simulated in jsdom | Open game on iPhone with notch; verify no text/buttons clipped by device chrome |
| Submit button in lower third of screen | TUCH-02 | Visual layout position requires real viewport | Open GameScreen on iPhone; verify Submit button is thumb-reachable |
| Back button visible with keyboard open | TUCH-03 | iOS keyboard interaction with dvh requires real device | Open LobbyScreen; tap game code input; verify Back button remains visible |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
