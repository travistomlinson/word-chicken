---
created: 2026-03-18T23:10:00.000Z
title: Show a word hint button - once per game
area: ui
files:
  - src/components/PlayerHand.tsx
  - src/lib/aiEngine.ts
  - src/store/gameSlice.ts
---

## Problem

Players can get stuck when they can't find a valid word to play. There's no help mechanism — the only option is to Give Up, which eliminates them from the round.

## Solution

Add a "Show a Word" button that:
- Is available once per game (not per round)
- When pressed, finds a valid word the player could play (reuse AI move-finding logic)
- Highlights or auto-stages the tiles needed to form that word
- Track hint usage in game state (hintUsed: boolean)
- Visually disable/hide the button after it's been used once
