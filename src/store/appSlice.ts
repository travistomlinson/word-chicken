import { create } from 'zustand'

type Screen = 'config' | 'game' | 'lobby'

interface AppState {
  screen: Screen
  setScreen: (screen: Screen) => void
}

export const useAppStore = create<AppState>()((set) => ({
  screen: 'config',
  setScreen: (screen) => set({ screen }),
}))
