---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x |
| **Config file** | `vite.config.ts` (test block) — Wave 0 installs |
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
| 1-01-01 | 01 | 1 | WVAL-01 | unit | `npm test -- --run src/lib/__tests__/parseWordList.test.ts` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | WVAL-01 | unit | `npm test -- --run src/store/__tests__/dictionarySlice.test.ts` | ❌ W0 | ⬜ pending |
| 1-01-03 | 01 | 1 | WVAL-01 | unit | included in slice test | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/__tests__/parseWordList.test.ts` — covers WVAL-01 parsing behavior
- [ ] `src/store/__tests__/dictionarySlice.test.ts` — covers WVAL-01 loading state machine
- [ ] `src/vitest.setup.ts` — jest-dom matchers setup
- [ ] Framework install: `npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event`
- [ ] `TWL06.txt` placed at `public/TWL06.txt`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `npm run dev` opens app with no errors | SC-1 | Dev server + browser visual | Run `npm run dev`, open localhost, verify no console errors |
| App routes between Config and Game screens | SC-4 | Navigation UX | Click nav elements, verify screen transitions |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
