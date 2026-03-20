import { useEffect, useRef } from 'react'
import { useAppStore } from './store/appSlice'
import { useGameStore } from './store/gameSlice'
import { useMultiplayerStore } from './store/multiplayerSlice'
import { useDictionaryStore } from './store/dictionarySlice'
import { loadSession } from './lib/sessionPersistence'
import { deserializeGameState, reconnectAsHost, reconnectAsGuest, sendMessage, serializeGameState } from './lib/multiplayer'
import { ConfigScreen } from './screens/ConfigScreen'
import { GameScreen } from './screens/GameScreen'
import { LobbyScreen } from './screens/LobbyScreen'

function App() {
  const screen = useAppStore((s) => s.screen)
  const darkMode = useAppStore((s) => s.darkMode)
  const { status, loadDictionary } = useDictionaryStore()
  const restoredRef = useRef(false)

  useEffect(() => {
    loadDictionary()
  }, [loadDictionary])

  // Restore session from sessionStorage on mount
  useEffect(() => {
    if (restoredRef.current) return
    if (status !== 'ready') return
    restoredRef.current = true

    const session = loadSession()
    if (!session || !session.gameState) return

    const dictionary = useDictionaryStore.getState().words
    const gameState = deserializeGameState(session.gameState, dictionary)

    // Restore stores
    useGameStore.getState().dispatch({ type: 'SET_STATE', state: gameState })
    useMultiplayerStore.getState().setGameMode('pvp')
    useMultiplayerStore.getState().setRole(session.role)
    useMultiplayerStore.getState().setLobbyCode(session.lobbyCode)
    useMultiplayerStore.getState().setConnectionStatus('reconnecting')
    useAppStore.getState().setScreen('game')

    // Attempt reconnection
    const onConnected = () => {
      useMultiplayerStore.getState().setConnectionStatus('connected')
      useMultiplayerStore.getState().setErrorMessage(null)
      // If host, send current state to guest after reconnecting
      if (session.role === 'host') {
        const gs = useGameStore.getState().gameState
        if (gs) {
          sendMessage({ type: 'game-state', state: serializeGameState(gs) })
        }
      } else {
        // Guest requests current state from host
        sendMessage({ type: 'request-state' })
      }
    }

    const onError = () => {
      // Reconnection failed — keep game state visible with disconnect message
      useMultiplayerStore.getState().setConnectionStatus('disconnected')
      useMultiplayerStore.getState().setErrorMessage('Could not reconnect')
    }

    if (session.role === 'host') {
      reconnectAsHost(session.lobbyCode, onConnected, onError)
    } else {
      reconnectAsGuest(session.lobbyCode, onConnected, onError)
    }
  }, [status])

  if (status === 'idle' || status === 'loading') {
    return (
      <div className={`bg-surface min-h-svh font-jost flex items-center justify-center ${darkMode ? 'dark' : ''}`}>
        <span className="text-ink">Loading dictionary...</span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className={`bg-surface min-h-svh font-jost flex items-center justify-center ${darkMode ? 'dark' : ''}`}>
        <span className="text-accent-danger">Failed to load dictionary.</span>
      </div>
    )
  }

  return (
    <div className={`bg-surface min-h-dvh font-jost ${darkMode ? 'dark' : ''}`}>
      {screen === 'config' && <ConfigScreen />}
      {screen === 'lobby' && <LobbyScreen />}
      {screen === 'game' && <GameScreen />}
    </div>
  )
}

export default App
