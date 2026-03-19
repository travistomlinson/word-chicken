import { useEffect, useRef, useCallback } from 'react'
import type { DataConnection } from 'peerjs'
import { useGameStore } from '../store/gameSlice'
import { useMultiplayerStore } from '../store/multiplayerSlice'
import { useDictionaryStore } from '../store/dictionarySlice'
import {
  serializeGameState,
  deserializeGameState,
  type MultiplayerMessage,
  type PeerConnection,
} from '../lib/multiplayer'
import type { RemoteGameAction } from '../types/game'

/**
 * Manages multiplayer state sync between host and guest.
 * - Host: sends game state on every change, receives actions from guest
 * - Guest: receives game state, sends actions to host
 */
export function useMultiplayer() {
  const peerRef = useRef<PeerConnection | null>(null)
  const connRef = useRef<DataConnection | null>(null)
  const role = useMultiplayerStore(s => s.role)
  const gameMode = useMultiplayerStore(s => s.gameMode)
  const dispatch = useGameStore(s => s.dispatch)

  /** Send a message to the connected peer */
  const send = useCallback((msg: MultiplayerMessage) => {
    const conn = connRef.current
    if (conn && conn.open) {
      conn.send(msg)
    }
  }, [])

  /** Host: send current game state to guest */
  const syncStateToGuest = useCallback(() => {
    const state = useGameStore.getState().gameState
    if (!state) return
    send({ type: 'game-state', state: serializeGameState(state) })
  }, [send])

  /** Guest: send an action to the host for processing */
  const sendAction = useCallback((action: RemoteGameAction) => {
    send({ type: 'action', action })
  }, [send])

  /** Notify opponent about quit */
  const sendQuit = useCallback(() => {
    send({ type: 'opponent-quit' })
  }, [send])

  // Host: subscribe to game state changes and sync to guest
  useEffect(() => {
    if (gameMode !== 'pvp' || role !== 'host') return

    const unsub = useGameStore.subscribe(() => {
      syncStateToGuest()
    })

    return unsub
  }, [gameMode, role, syncStateToGuest])

  /** Set up the data connection (called after peer connects) */
  const setupConnection = useCallback((conn: DataConnection) => {
    connRef.current = conn

    conn.on('data', (raw) => {
      const msg = raw as MultiplayerMessage
      const dictionary = useDictionaryStore.getState().words

      if (role === 'host') {
        // Host receives actions from guest
        if (msg.type === 'action') {
          dispatch(msg.action)
        } else if (msg.type === 'opponent-quit') {
          useMultiplayerStore.getState().setConnectionStatus('disconnected')
          useMultiplayerStore.getState().setErrorMessage('Opponent disconnected')
        }
      } else {
        // Guest receives game state from host
        if (msg.type === 'game-state') {
          const state = deserializeGameState(msg.state, dictionary)
          dispatch({ type: 'SET_STATE', state })
        } else if (msg.type === 'start-game' || msg.type === 'rematch') {
          // Host started/restarted the game — state will arrive via game-state message
        } else if (msg.type === 'opponent-quit') {
          useMultiplayerStore.getState().setConnectionStatus('disconnected')
          useMultiplayerStore.getState().setErrorMessage('Opponent disconnected')
        }
      }
    })

    conn.on('close', () => {
      const mp = useMultiplayerStore.getState()
      if (mp.connectionStatus === 'connected') {
        mp.setConnectionStatus('disconnected')
        mp.setErrorMessage('Opponent disconnected')
      }
    })
  }, [role, dispatch])

  /** Store the peer connection ref for cleanup */
  const setPeerConnection = useCallback((pc: PeerConnection) => {
    peerRef.current = pc
  }, [])

  /** Cleanup on unmount */
  useEffect(() => {
    return () => {
      peerRef.current?.destroy()
      peerRef.current = null
      connRef.current = null
    }
  }, [])

  return {
    send,
    sendAction,
    sendQuit,
    syncStateToGuest,
    setupConnection,
    setPeerConnection,
    connRef,
    peerRef,
  }
}
