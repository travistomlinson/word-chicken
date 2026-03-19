# Word Chicken

## What This Is

A webapp word game where players compete by extending words letter-by-letter until someone can't play. Each player holds 9 letter tiles, and rounds begin with a 3-letter word that grows as players add one letter at a time (rearranging allowed). The last player standing wins the round. Supports single-player against AI and two-player PvP multiplayer via lobby codes.

## Core Value

The escalating tension of "can I extend this word?" — the chicken moment where the word keeps growing and you either find a play or you're out.

## Current Milestone: v1.1 Design Audit

**Goal:** Comprehensive UX/design audit and fix pass — make the game feel polished and professional across all screen sizes.

**Target features:**
- Fix viewport/layout issues (content off-screen, underutilizing viewport on mobile)
- Audit and fix responsive behavior across phone/tablet/desktop breakpoints
- Review and improve color palette for accessibility and visual hierarchy
- Element sizing, placement, and spacing audit across all screens
- Ensure touch targets, readability, and visual consistency

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- Single-player game against AI with Easy/Medium/Hard difficulty
- Full word game engine (validation, tile bag, scoring, Q=Qu)
- Complete game UI with config, tile interaction, animations
- Two-player PvP multiplayer with lobby codes
- Session persistence with reconnect on reload
- Dark mode toggle
- Responsive layout (initial pass)

### Active

<!-- Current scope. Building toward these. -->

(Defined in REQUIREMENTS.md for v1.1)

### Out of Scope

- New game features or mechanics — this milestone is design/UX only
- Mobile native app — web-first
- User accounts/authentication
- Sound effects or haptics

## Context

- Game has been playtested on multiple phone types — buttons going off-screen is a known issue
- Content sits small at the bottom of the viewport on mobile load instead of filling the screen
- Corbusier palette (red, blue, yellow, concrete) is established but open to revision
- Dark mode exists but may have contrast issues
- PvP multiplayer screens (lobby, reconnect) need the same design attention

## Constraints

- **Platform**: Web application (browser-based)
- **Framework**: React + Tailwind v4 — no framework changes
- **No feature changes**: Layout/style fixes only, no game logic modifications

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Single-player vs AI for v1 | Simplest path to playable game, no networking complexity | ✓ Good |
| Standard word list over API | Fast validation, works offline, no API costs | ✓ Good |
| Q = Qu | Matches Bananagrams convention, more playable | ✓ Good |
| Plurals banned by default | Forces creative play, configurable for those who prefer it | ✓ Good |
| Corbusier design palette | Distinctive visual identity | ⚠️ Revisit — auditing in v1.1 |
| PeerJS P2P multiplayer | No server costs, lower latency | ✓ Good |

---
*Last updated: 2026-03-18 after v1.1 milestone start*
