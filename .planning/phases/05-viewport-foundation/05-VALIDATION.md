---
phase: 5
slug: viewport-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + Testing Library 16.x |
| **Config file** | `vite.config.ts` (test block with jsdom environment) |
| **Quick run command** | `npm test -- --run src/__tests__/App.test.tsx` |
| **Full suite command** | `npm test -- --run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run src/__tests__/App.test.tsx`
- **After every plan wave:** Run `npm test -- --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 0 | VPRT-02 | unit | `npm test -- --run src/__tests__/viewport.test.tsx` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 0 | VPRT-03 | unit | `npm test -- --run src/__tests__/viewport.test.tsx` | ❌ W0 | ⬜ pending |
| 05-01-03 | 01 | 0 | VPRT-05 | unit | `npm test -- --run src/__tests__/viewport.test.tsx` | ❌ W0 | ⬜ pending |
| 05-01-04 | 01 | 0 | VPRT-01 | unit | `npm test -- --run src/__tests__/App.test.tsx` | ✅ (extend) | ⬜ pending |
| 05-02-01 | 02 | 1 | VPRT-01 | unit | `npm test -- --run src/__tests__/App.test.tsx` | ✅ | ⬜ pending |
| 05-02-02 | 02 | 1 | VPRT-02 | unit | `npm test -- --run src/__tests__/viewport.test.tsx` | ❌ W0 | ⬜ pending |
| 05-02-03 | 02 | 1 | VPRT-03 | unit | `npm test -- --run src/__tests__/viewport.test.tsx` | ❌ W0 | ⬜ pending |
| 05-02-04 | 02 | 1 | VPRT-05 | unit | `npm test -- --run src/__tests__/viewport.test.tsx` | ❌ W0 | ⬜ pending |
| 05-03-01 | 03 | 1 | VPRT-05 | manual | inspect `index.html` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/viewport.test.tsx` — stubs for VPRT-02 (GameScreen classes), VPRT-03 (ConfigScreen/LobbyScreen classes), VPRT-05 (dark mode CSS rule)
- [ ] Extend `src/__tests__/App.test.tsx` — add assertions for `min-h-dvh` on main wrapper and `min-h-svh` on loading/error states

*Existing infrastructure covers framework installation — Vitest already configured.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| App fills visible viewport on real phone first load | VPRT-01 | jsdom cannot simulate real viewport rendering or address bar behavior | Load app on iOS Safari with address bar visible; verify no blank space below content |
| Game content fits without scrolling on 375px phone | VPRT-02 | jsdom cannot simulate viewport fitting | During active game on 375px phone, verify all elements visible without scrolling |
| `viewport-fit=cover` in meta tag | VPRT-05 | Static HTML check, not runtime behavior | Inspect `index.html` for `viewport-fit=cover` in viewport meta tag |
| Dark mode overscroll has no white bleed | VPRT-05 | jsdom cannot simulate iOS overscroll rubber-banding | In dark mode on iOS Safari, overscroll past top/bottom and verify no white background |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
