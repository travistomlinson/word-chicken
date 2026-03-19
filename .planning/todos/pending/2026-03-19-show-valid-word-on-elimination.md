---
created: "2026-03-19T03:25:54.378Z"
title: Show valid word on elimination
area: ui
files:
  - src/components/RoundEndCard.tsx
  - src/lib/gameReducer.ts
  - src/types/game.ts
---

## Problem

When a player gives up (can't extend the word), there's no feedback about whether a valid word actually existed. Players are left wondering "was there even a word I could have played?" This is frustrating and misses a learning opportunity.

## Solution

- When a player is eliminated (gives up), check if any valid extension existed using their hand + community tiles + the current word
- Store the result (e.g., one example valid word, or "no valid word existed") in game state at elimination time
- Display this on the round end screen: "You could have played: EXAMPLE" or "No valid word was possible"
- Key logic: run findValidExtension(currentWord, playerHand, dictionary) at elimination time in the reducer
