---
created: 2026-03-18T23:01:00.000Z
title: AI moves too fast - add delay and animation
area: ui
files:
  - src/hooks/useAI.ts
  - src/components/PlayerHand.tsx
---

## Problem

The AI computes its move instantly (synchronous search) so the AI_THINKING phase flashes by too quickly. It doesn't feel natural or give the player time to process what happened.

## Solution

TBD - Potential approaches:
- Add a minimum delay (e.g., 1-2 seconds) before dispatching the AI's move in useAI.ts
- Extend the slot-machine cycling animation in PlayerHand to feel more dramatic
- Consider a "reveal" animation where the AI's word builds letter by letter
- Vary the delay slightly for natural feel (e.g., 1000-2500ms random)
