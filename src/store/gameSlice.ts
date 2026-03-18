import { create } from 'zustand'
import type { GameState, GameAction } from '../types/game'
import { gameReducer, createInitialGameState } from '../lib/gameReducer'

interface GameStore {
  gameState: GameState | null
  dispatch: (action: GameAction) => void
}

export const useGameStore = create<GameStore>()((set, get) => ({
  gameState: null,

  dispatch: (action: GameAction) => {
    const current = get().gameState

    // START_GAME initializes from config, ignoring current state
    if (action.type === 'START_GAME') {
      const newState = createInitialGameState(action.config)
      set({ gameState: newState })
      return
    }

    // Guard: no-op if game hasn't started and action isn't START_GAME
    if (current === null) {
      return
    }

    const next = gameReducer(current, action)

    // RESET_GAME returns null — clear the store
    if (next === null) {
      set({ gameState: null })
      return
    }

    set({ gameState: next })
  },
}))
