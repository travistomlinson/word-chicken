---
created: "2026-03-19T03:25:54.378Z"
title: Silent reconnect without user notification
area: ui
files:
  - src/screens/GameScreen.tsx
  - src/lib/multiplayer.ts
  - src/hooks/useMultiplayer.ts
  - src/App.tsx
---

## Problem

When a multiplayer connection drops and reconnects, the player currently sees a "Reconnecting" overlay and "Connection lost" message. The user wants the reconnect to happen silently in the background — only show UI if reconnection actually fails.

## Solution

- On disconnect, immediately attempt reconnect without changing `connectionStatus` to `'disconnected'` first
- Set a short timeout (e.g., 5-10 seconds) for silent reconnect attempt
- Only show the disconnect overlay if the silent reconnect fails after the timeout
- If reconnect succeeds silently, resume game state sync without any visible interruption
- Key files: disconnect handler in `useMultiplayer.ts`, reconnect logic in `multiplayer.ts`, overlay rendering in `GameScreen.tsx`, session restore in `App.tsx`
