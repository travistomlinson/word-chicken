import { create } from 'zustand'

type Screen = 'config' | 'game' | 'lobby'

const DARK_MODE_KEY = 'word-chicken-dark-mode'

function loadDarkMode(): boolean {
  try {
    const stored = localStorage.getItem(DARK_MODE_KEY)
    if (stored !== null) return stored === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  } catch {
    return false
  }
}

interface AppState {
  screen: Screen
  darkMode: boolean
  setScreen: (screen: Screen) => void
  toggleDarkMode: () => void
}

export const useAppStore = create<AppState>()((set) => ({
  screen: 'config',
  darkMode: loadDarkMode(),
  setScreen: (screen) => set({ screen }),
  toggleDarkMode: () =>
    set((state) => {
      const next = !state.darkMode
      try { localStorage.setItem(DARK_MODE_KEY, String(next)) } catch {}
      return { darkMode: next }
    }),
}))
