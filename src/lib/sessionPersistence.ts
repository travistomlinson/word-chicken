import type { SerializedGameState } from './multiplayer'

const SESSION_KEY = 'word-chicken-session'

export interface SavedSession {
  role: 'host' | 'guest'
  lobbyCode: string
  gameMode: 'pvp'
  screen: 'game' | 'lobby'
  gameState: SerializedGameState | null
  savedAt: number
}

const MAX_AGE_MS = 30 * 60 * 1000 // 30 minutes

export function saveSession(session: SavedSession): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    // storage full or unavailable
  }
}

export function loadSession(): SavedSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session: SavedSession = JSON.parse(raw)
    // Expire old sessions
    if (Date.now() - session.savedAt > MAX_AGE_MS) {
      clearSession()
      return null
    }
    return session
  } catch {
    return null
  }
}

export function clearSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore
  }
}
