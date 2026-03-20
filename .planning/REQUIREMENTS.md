# Requirements: Word Chicken v1.1

**Defined:** 2026-03-18
**Core Value:** The escalating tension of "can I extend this word?" — the chicken moment where the word keeps growing and you either find a play or you're out.

## v1.1 Requirements

Requirements for the design audit and fix pass. Each maps to roadmap phases.

### Viewport & Layout

- [x] **VPRT-01**: App fills the visible viewport on mobile without overflow or wasted space on first load
- [x] **VPRT-02**: Game content does not require scrolling during active gameplay on any standard phone size (375px+)
- [x] **VPRT-03**: Config and Lobby screens scroll gracefully when content exceeds viewport height
- [x] **VPRT-04**: No content is clipped by iPhone notch, Dynamic Island, or home indicator gesture zone
- [x] **VPRT-05**: Dark mode does not show white background bleed on iOS overscroll rubber-banding

### Touch & Interaction

- [x] **TUCH-01**: All secondary action buttons (Quit, Give Up, Show a Word, How to Play, Back, Copy Code) have minimum 44px touch targets
- [x] **TUCH-02**: Primary action area (Submit button, staging area) reliably lands in the bottom thumb zone of the screen
- [x] **TUCH-03**: Lobby screen input and buttons remain accessible when the virtual keyboard is open

### Color & Contrast

- [x] **COLR-01**: All text passes WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large text) in light mode
- [x] **COLR-02**: All text passes WCAG AA contrast ratio in dark mode — no opacity below /50 for informational text
- [x] **COLR-03**: Yellow backgrounds use dark text (charcoal) instead of white text for WCAG AA compliance
- [x] **COLR-04**: ChickenOMeter gradient uses CSS custom properties from the design token system instead of hardcoded hex values

### Visual Polish

- [ ] **PLSH-01**: Turn indicator has clear visual dominance over round counter and Quit button in the top bar
- [ ] **PLSH-02**: Score panel visually distinguishes round score (primary) from total score (secondary)
- [ ] **PLSH-03**: ChickenOMeter is wide enough to read as a tension indicator on mobile (32-40px vs current 20px)
- [ ] **PLSH-04**: Staged tiles have an unambiguous "taken" visual state in the player hand
- [ ] **PLSH-05**: RoundEndCard displays as an overlay consistent with GameOverScreen styling

## v1.2+ Requirements

Deferred to future release.

### Transitions & Animation

- **TRAN-01**: Animated screen transitions between config/lobby/game
- **TRAN-02**: Word history mobile drawer (slide-up panel)

### Multiplayer UX

- **MPUX-01**: Silent reconnect without user notification (see pending todo)
- **MPUX-02**: Show valid word on elimination (see pending todo)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Game logic changes | This is a design-only milestone — no mechanics modifications |
| New game features | Polish pass, not feature build |
| Sound effects / haptics | Deferred to future milestone |
| Drag-and-drop tile reordering | Accessibility complexity disproportionate to value |
| Floating action button for Submit | Anti-feature per research — inline button is correct |
| Word history on mobile (visible) | Anti-feature per research — hidden on mobile is correct pattern |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| VPRT-01 | Phase 5 | Complete |
| VPRT-02 | Phase 5 | Complete |
| VPRT-03 | Phase 5 | Complete |
| VPRT-04 | Phase 6 | Complete |
| VPRT-05 | Phase 5 | Complete |
| TUCH-01 | Phase 6 | Complete |
| TUCH-02 | Phase 6 | Complete |
| TUCH-03 | Phase 6 | Complete |
| COLR-01 | Phase 7 | Complete |
| COLR-02 | Phase 7 | Complete |
| COLR-03 | Phase 7 | Complete |
| COLR-04 | Phase 7 | Complete |
| PLSH-01 | Phase 8 | Pending |
| PLSH-02 | Phase 8 | Pending |
| PLSH-03 | Phase 8 | Pending |
| PLSH-04 | Phase 8 | Pending |
| PLSH-05 | Phase 8 | Pending |

**Coverage:**
- v1.1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0

---
*Requirements defined: 2026-03-18*
*Last updated: 2026-03-18 after initial definition*
