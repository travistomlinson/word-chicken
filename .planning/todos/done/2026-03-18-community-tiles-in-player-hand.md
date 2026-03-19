---
created: 2026-03-18T23:56:32.527Z
title: Community tiles should appear in player hand during turn
area: ui
files:
  - src/components/PlayerHand.tsx
  - src/components/StagingArea.tsx
---

## Problem

During HUMAN_TURN, the player needs to build a complete word that is a superset of the current word plus one new letter. But the current word's letters (community tiles) were not available in the player's hand — they could only select from their own hand tiles. This made it impossible to form valid words, causing the game to effectively end after the first move.

## Solution

**Already fixed in this session** — PlayerHand now merges the current word's letters into the selectable tile pool during HUMAN_TURN. Community tiles are displayed in yellow (vs concrete for hand tiles) so the player knows which ones must be used. Negative indices distinguish community tiles from hand tiles internally.

Visually distinct: community tiles = yellow, hand tiles = concrete, staged tiles = blue (hand) or yellow (community).
