import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../store/appSlice'
import { useGameStore } from '../store/gameSlice'
import { useMultiplayerStore } from '../store/multiplayerSlice'
import { useDictionaryStore } from '../store/dictionarySlice'
import { useMultiplayer, syncStateToGuest } from '../hooks/useMultiplayer'
import {
  generateLobbyCode,
  createHostPeer,
  connectToHostPeer,
} from '../lib/multiplayer'
import type { TileDistribution } from '../lib/tileBag'

type Difficulty = 'easy' | 'medium' | 'hard'

interface StoredConfig {
  difficulty: Difficulty
  banPluralS: boolean
  tileDistribution: TileDistribution
}

const STORAGE_KEY = 'word-chicken-config'

function loadConfig(): StoredConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { difficulty: 'medium', banPluralS: true, tileDistribution: 'bananagrams' }
    return { difficulty: 'medium', banPluralS: true, tileDistribution: 'bananagrams', ...JSON.parse(raw) }
  } catch {
    return { difficulty: 'medium', banPluralS: true, tileDistribution: 'bananagrams' }
  }
}

export function LobbyScreen() {
  const setScreen = useAppStore(s => s.setScreen)
  const dispatch = useGameStore(s => s.dispatch)
  const {
    role, lobbyCode, connectionStatus, errorMessage,
    setRole, setLobbyCode, setConnectionStatus, setErrorMessage, reset,
  } = useMultiplayerStore()

  // Mount multiplayer hook to register message handlers
  useMultiplayer()

  const [joinCode, setJoinCode] = useState('')
  const [config] = useState<StoredConfig>(loadConfig)
  const hasStartedGame = useRef(false)

  // When both connected and host, start the game
  useEffect(() => {
    if (connectionStatus === 'connected' && role === 'host' && !hasStartedGame.current) {
      hasStartedGame.current = true
      const dictionary = useDictionaryStore.getState().words
      dispatch({
        type: 'START_GAME',
        config: {
          ...config,
          dictionary,
          gameMode: 'pvp',
        },
      })
      // Small delay to ensure state is set before syncing
      setTimeout(() => {
        syncStateToGuest()
        setScreen('game')
      }, 100)
    }
  }, [connectionStatus, role, config, dispatch, setScreen])

  // Guest: once we receive game state, navigate to game
  useEffect(() => {
    if (connectionStatus === 'connected' && role === 'guest') {
      const unsub = useGameStore.subscribe((state) => {
        if (state.gameState && !hasStartedGame.current) {
          hasStartedGame.current = true
          setScreen('game')
        }
      })
      return unsub
    }
  }, [connectionStatus, role, setScreen])

  function handleCreateGame() {
    const code = generateLobbyCode()
    setLobbyCode(code)
    setRole('host')
    setConnectionStatus('waiting')
    setErrorMessage(null)
    hasStartedGame.current = false

    createHostPeer(
      code,
      () => {
        setConnectionStatus('connected')
      },
      (err) => {
        setConnectionStatus('error')
        setErrorMessage(err.message || 'Connection failed')
      },
      () => {
        // Peer opened successfully
      },
    )
  }

  function handleJoinGame() {
    const code = joinCode.trim().toUpperCase()
    if (code.length !== 5) {
      setErrorMessage('Enter a 5-character lobby code')
      return
    }

    setLobbyCode(code)
    setRole('guest')
    setConnectionStatus('connecting')
    setErrorMessage(null)
    hasStartedGame.current = false

    connectToHostPeer(
      code,
      () => {
        setConnectionStatus('connected')
      },
      (err) => {
        setConnectionStatus('error')
        const message = err.message || 'Connection failed'
        if (message.includes('Could not connect to peer')) {
          setErrorMessage('Lobby not found. Check the code and try again.')
        } else {
          setErrorMessage(message)
        }
      },
    )
  }

  function handleBack() {
    reset()
    setScreen('config')
  }

  const isWaiting = connectionStatus === 'waiting'
  const isConnecting = connectionStatus === 'connecting'
  const isConnected = connectionStatus === 'connected'

  return (
    <div className="min-h-dvh bg-gradient-to-br from-surface via-surface to-corbusier-blue/5 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-8 mt-8">
          <div className="w-12 h-1 bg-corbusier-yellow rounded-full mb-4" />
          <h1 className="font-jost font-bold uppercase tracking-widest text-ink text-3xl sm:text-4xl mb-1">
            Play a Friend
          </h1>
          <p className="font-jost text-ink/50 text-sm">
            Create a game or join with a code
          </p>
        </div>

        {/* No role chosen yet — show options */}
        {!role && (
          <div className="flex flex-col gap-3">
            <button
              onClick={handleCreateGame}
              className="w-full bg-corbusier-blue text-white font-jost font-bold uppercase text-lg py-4 rounded-lg shadow-lg shadow-corbusier-blue/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
            >
              Create Game
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-ink/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-surface px-4 text-ink/30 text-sm font-jost uppercase">or</span>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                maxLength={5}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, ''))}
                placeholder="ENTER CODE"
                className="flex-1 text-center font-jost font-bold text-xl uppercase tracking-[0.3em] bg-card border-2 border-ink/10 rounded-lg py-3 px-4 text-ink placeholder:text-ink/20 placeholder:tracking-widest focus:outline-none focus:border-corbusier-yellow transition-colors"
              />
              <button
                onClick={handleJoinGame}
                disabled={joinCode.length !== 5}
                className="bg-corbusier-yellow text-white font-jost font-bold uppercase px-6 py-3 rounded-lg shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Join
              </button>
            </div>
          </div>
        )}

        {/* Host waiting for guest */}
        {role === 'host' && isWaiting && (
          <div className="text-center">
            <p className="font-jost text-ink/50 text-sm uppercase tracking-wider mb-4">
              Share this code with your opponent
            </p>
            <div className="bg-card rounded-xl p-6 shadow-lg mb-6">
              <p className="font-jost font-bold text-5xl tracking-[0.4em] text-ink select-all">
                {lobbyCode}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="inline-block w-2 h-2 rounded-full bg-corbusier-yellow animate-pulse" />
              <span className="font-jost text-ink/50 text-sm">Waiting for opponent...</span>
            </div>
            <button
              onClick={() => {
                if (lobbyCode) {
                  navigator.clipboard.writeText(lobbyCode)
                }
              }}
              className="text-corbusier-blue text-xs font-jost uppercase cursor-pointer hover:text-corbusier-blue/70 bg-transparent border border-corbusier-blue/30 rounded px-4 py-2 transition-colors"
            >
              Copy Code
            </button>
          </div>
        )}

        {/* Guest connecting */}
        {role === 'guest' && isConnecting && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="inline-block w-2 h-2 rounded-full bg-corbusier-yellow animate-pulse" />
              <span className="font-jost text-ink/50">Connecting to lobby {lobbyCode}...</span>
            </div>
          </div>
        )}

        {/* Connected — waiting for game to start */}
        {isConnected && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
              <span className="font-jost text-ink/50">Connected! Starting game...</span>
            </div>
          </div>
        )}

        {/* Error */}
        {errorMessage && (
          <div className="mt-4 p-3 bg-corbusier-red/10 rounded-lg">
            <p className="font-jost text-corbusier-red text-sm text-center">{errorMessage}</p>
          </div>
        )}

        {/* Back button */}
        <button
          onClick={handleBack}
          className="w-full mt-8 bg-card text-ink border-2 border-ink/10 font-jost font-bold uppercase px-8 py-3 rounded-lg text-sm hover:border-ink/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 cursor-pointer"
        >
          Back
        </button>
      </div>
    </div>
  )
}
