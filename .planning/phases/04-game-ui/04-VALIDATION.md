---
phase: 4
slug: game-ui
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 |
| **Config file** | `vite.config.ts` (test section with `globals: true`, `environment: jsdom`) |
| **Quick run command** | `npx vitest run src/` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | CONF-01, CONF-02, CONF-03, CONF-04 | unit | `npx vitest run src/screens/__tests__/ConfigScreen.test.tsx` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | UX-02 | unit | `npx vitest run src/components/__tests__/HowToPlayModal.test.tsx` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 1 | UI-01 | unit | `npx vitest run src/components/__tests__/SharedWordDisplay.test.tsx` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 1 | UI-05 | unit | `npx vitest run src/components/__tests__/WordHistory.test.tsx` | ❌ W0 | ⬜ pending |
| 04-02-03 | 02 | 1 | UI-06 | unit | `npx vitest run src/components/__tests__/ChickenOMeter.test.tsx` | ❌ W0 | ⬜ pending |
| 04-02-04 | 02 | 1 | UI-03 | unit | `npx vitest run src/components/__tests__/TurnIndicator.test.tsx` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 2 | UI-02 | unit | `npx vitest run src/components/__tests__/PlayerHand.test.tsx` | ❌ W0 | ⬜ pending |
| 04-03-02 | 03 | 2 | UX-01 | unit | `npx vitest run src/components/__tests__/PlayerHand.test.tsx` | ❌ W0 | ⬜ pending |
| 04-04-01 | 04 | 2 | SCOR-03 | unit | `npx vitest run src/components/__tests__/ScorePanel.test.tsx` | ❌ W0 | ⬜ pending |
| 04-04-02 | 04 | 2 | UI-04, UI-07, SCOR-04 | unit | `npx vitest run src/components/__tests__/GameOverScreen.test.tsx` | ❌ W0 | ⬜ pending |
| 04-04-03 | 04 | 2 | UX-03 | smoke | `npx vitest run src/screens/__tests__/GameScreen.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/__tests__/` — directory creation (covers UI-01–07, SCOR-03–04, UX-02)
- [ ] `src/screens/__tests__/ConfigScreen.test.tsx` — stubs for CONF-01–04
- [ ] `src/screens/__tests__/GameScreen.test.tsx` — stubs for UX-03, phase-switching
- [ ] `src/components/__tests__/PlayerHand.test.tsx` — stubs for UI-02 (tile staging interaction)
- [ ] `src/components/__tests__/SharedWordDisplay.test.tsx` — stubs for UI-01
- [ ] `src/components/__tests__/WordHistory.test.tsx` — stubs for UI-05
- [ ] `src/components/__tests__/ChickenOMeter.test.tsx` — stubs for UI-06
- [ ] `src/components/__tests__/TurnIndicator.test.tsx` — stubs for UI-03
- [ ] `src/components/__tests__/HowToPlayModal.test.tsx` — stubs for UX-02
- [ ] `src/components/__tests__/ScorePanel.test.tsx` — stubs for SCOR-03
- [ ] `src/components/__tests__/GameOverScreen.test.tsx` — stubs for UI-04, UI-07, SCOR-04
- [ ] `src/components/__tests__/RoundEndCard.test.tsx` — stubs for UI-07, SCOR-04

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Chicken-o-meter visual animation | UI-06 | CSS animation quality | Observe gradient fill transition during word growth |
| Mobile tap targets adequate size | UX-03 | Physical device testing | Test on phone-width viewport, verify tiles are tappable |
| AI thinking indicator timing | UI-03 | Perceived UX quality | Watch AI turn for smooth cycling animation |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
