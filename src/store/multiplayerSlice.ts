import { create } from 'zustand'
import type { GameMode } from '../types/game'

export type ConnectionStatus = 'disconnected' | 'waiting' | 'connecting' | 'connected' | 'error'
export type LobbyRole = 'host' | 'guest'

interface MultiplayerState {
  gameMode: GameMode
  role: LobbyRole | null
  lobbyCode: string | null
  connectionStatus: ConnectionStatus
  errorMessage: string | null

  /** The local player's ID in the game state ('human' for host, 'ai' for guest) */
  localPlayerId: string

  setGameMode: (mode: GameMode) => void
  setRole: (role: LobbyRole | null) => void
  setLobbyCode: (code: string | null) => void
  setConnectionStatus: (status: ConnectionStatus) => void
  setErrorMessage: (msg: string | null) => void
  reset: () => void
}

export const useMultiplayerStore = create<MultiplayerState>()((set) => ({
  gameMode: 'ai',
  role: null,
  lobbyCode: null,
  connectionStatus: 'disconnected',
  errorMessage: null,
  localPlayerId: 'human',

  setGameMode: (mode) => set({ gameMode: mode }),
  setRole: (role) => set({
    role,
    localPlayerId: role === 'guest' ? 'ai' : 'human',
  }),
  setLobbyCode: (code) => set({ lobbyCode: code }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setErrorMessage: (msg) => set({ errorMessage: msg }),
  reset: () => set({
    role: null,
    lobbyCode: null,
    connectionStatus: 'disconnected',
    errorMessage: null,
    localPlayerId: 'human',
  }),
}))
