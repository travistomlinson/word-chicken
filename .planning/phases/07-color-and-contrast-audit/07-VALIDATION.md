---
phase: 7
slug: color-and-contrast-audit
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.1.0 |
| **Config file** | vite.config.ts (vitest inline config) |
| **Quick run command** | `npx vitest run src/__tests__/color-contrast.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/__tests__/color-contrast.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-00-01 | 00 | 0 | COLR-01, COLR-02, COLR-03, COLR-04 | static/source | `npx vitest run src/__tests__/color-contrast.test.ts` | ❌ W0 | ⬜ pending |
| 07-01-01 | 01 | 1 | COLR-01 | static/source | `npx vitest run src/__tests__/color-contrast.test.ts` | ❌ W0 | ⬜ pending |
| 07-01-02 | 01 | 1 | COLR-02 | static/source | `npx vitest run src/__tests__/color-contrast.test.ts` | ❌ W0 | ⬜ pending |
| 07-02-01 | 02 | 1 | COLR-03 | static/source | `npx vitest run src/__tests__/color-contrast.test.ts` | ❌ W0 | ⬜ pending |
| 07-03-01 | 03 | 1 | COLR-04 | static/source | `npx vitest run src/__tests__/color-contrast.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/color-contrast.test.ts` — source-level pattern checks for COLR-01, COLR-02, COLR-03, COLR-04
  - No `text-white` on `bg-corbusier-yellow`
  - No `text-ink/N` where N < 70 on informational text (light mode)
  - No `text-ink/N` where N < 50 in any component (dark mode floor)
  - TileCard yellow uses `text-charcoal` not `text-white`
  - ChickenOMeter has no hardcoded hex in gradient style prop
  - index.css defines `.gradient-tension` with `var(--color-*)`

*Existing test files: `App.test.tsx`, `mobile-touch.test.tsx`, `viewport.test.tsx` — unrelated to color*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dark mode visual rendering | COLR-02 | Static tests catch patterns but cannot verify rendered contrast | Toggle dark mode in browser, inspect all text elements visually |
| Secondary ink token visual hierarchy | COLR-01 | Token values pass math but need visual confirmation of hierarchy | Compare primary vs secondary text — hierarchy should be preserved |
| Brand color lighter shades in dark mode | COLR-02 | Computed lighter shades need design intent verification | Check `text-accent-primary` and `text-accent-danger` in dark mode look intentional |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
