import { useEffect } from 'react'
import { useGameStore } from '../store/gameSlice'
import { useMultiplayerStore } from '../store/multiplayerSlice'
import { useDictionaryStore } from '../store/dictionarySlice'
import {
  sendMessage,
  setMessageHandler,
  setDisconnectHandler,
  serializeGameState,
  deserializeGameState,
  type MultiplayerMessage,
} from '../lib/multiplayer'
import type { RemoteGameAction } from '../types/game'

/**
 * Manages multiplayer message handling.
 * Uses module-level connection from multiplayer.ts (survives component unmounts).
 *
 * - Host: sends game state on every store change, receives actions from guest
 * - Guest: receives game state from host, sends actions via sendMessage
 */
export function useMultiplayer() {
  const gameMode = useMultiplayerStore(s => s.gameMode)
  const role = useMultiplayerStore(s => s.role)
  const dispatch = useGameStore(s => s.dispatch)

  // Register message + disconnect handlers (updates when role changes)
  useEffect(() => {
    if (gameMode !== 'pvp') return

    setMessageHandler((msg: MultiplayerMessage) => {
      const dictionary = useDictionaryStore.getState().words
      const mpState = useMultiplayerStore.getState()

      if (mpState.role === 'host') {
        if (msg.type === 'action') {
          useGameStore.getState().dispatch(msg.action)
        } else if (msg.type === 'opponent-quit') {
          mpState.setConnectionStatus('disconnected')
          mpState.setErrorMessage('Opponent disconnected')
        }
      } else {
        // Guest
        if (msg.type === 'game-state') {
          const state = deserializeGameState(msg.state, dictionary)
          useGameStore.getState().dispatch({ type: 'SET_STATE', state })
        } else if (msg.type === 'opponent-quit') {
          mpState.setConnectionStatus('disconnected')
          mpState.setErrorMessage('Opponent disconnected')
        }
      }
    })

    setDisconnectHandler(() => {
      const mpState = useMultiplayerStore.getState()
      if (mpState.connectionStatus === 'connected') {
        mpState.setConnectionStatus('disconnected')
        mpState.setErrorMessage('Opponent disconnected')
      }
    })
  }, [gameMode, role, dispatch])

  // Host: subscribe to game state changes and sync to guest
  useEffect(() => {
    if (gameMode !== 'pvp' || role !== 'host') return

    const unsub = useGameStore.subscribe(() => {
      const state = useGameStore.getState().gameState
      if (state) {
        sendMessage({ type: 'game-state', state: serializeGameState(state) })
      }
    })

    return unsub
  }, [gameMode, role])
}

/** Send a game action to the host (used by guest) */
export function sendRemoteAction(action: RemoteGameAction): void {
  sendMessage({ type: 'action', action })
}

/** Notify opponent about quit */
export function sendQuitMessage(): void {
  sendMessage({ type: 'opponent-quit' })
}

/** Sync current game state to guest (used by host) */
export function syncStateToGuest(): void {
  const state = useGameStore.getState().gameState
  if (state) {
    sendMessage({ type: 'game-state', state: serializeGameState(state) })
  }
}
