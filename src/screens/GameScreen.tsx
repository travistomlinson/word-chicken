import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameSlice'
import { useAppStore } from '../store/appSlice'
import { useMultiplayerStore } from '../store/multiplayerSlice'
import { useAI } from '../hooks/useAI'
import { useMultiplayer } from '../hooks/useMultiplayer'
import { SharedWordDisplay } from '../components/SharedWordDisplay'
import { ChickenOMeter } from '../components/ChickenOMeter'
import { TurnIndicator } from '../components/TurnIndicator'
import { WordHistory } from '../components/WordHistory'
import { ScorePanel } from '../components/ScorePanel'
import { PlayerHand } from '../components/PlayerHand'
import { RoundEndCard } from '../components/RoundEndCard'
import { GameOverScreen } from '../components/GameOverScreen'

export function GameScreen() {
  const gameMode = useMultiplayerStore(s => s.gameMode)
  const connectionStatus = useMultiplayerStore(s => s.connectionStatus)
  const mpErrorMessage = useMultiplayerStore(s => s.errorMessage)

  // Mount AI hook at top level — only fires in AI mode
  useAI()

  // Mount multiplayer sync hook
  useMultiplayer()

  const phase = useGameStore(s => s.gameState?.phase)
  const round = useGameStore(s => s.gameState?.round)
  const totalScores = useGameStore(s => s.gameState?.totalScores ?? { human: 0, ai: 0 })
  const roundScores = useGameStore(s => s.gameState?.roundScores ?? { human: 0, ai: 0 })
  const dispatch = useGameStore(s => s.dispatch)
  const setScreen = useAppStore(s => s.setScreen)

  const [showGameOver, setShowGameOver] = useState(false)
  const { sendQuit } = useMultiplayer()

  // Guard: if no game started, redirect to config
  useEffect(() => {
    if (!useGameStore.getState().gameState) {
      setScreen('config')
    }
  }, [setScreen])

  // Reset showGameOver when a new game/round starts
  useEffect(() => {
    if (phase === 'SETUP') {
      setShowGameOver(false)
    }
  }, [phase])

  // Return empty div while state resolves
  if (!phase || !round) {
    return <div />
  }

  // Show disconnect overlay in multiplayer
  if (gameMode === 'pvp' && connectionStatus === 'disconnected' && mpErrorMessage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white max-w-sm w-full mx-4 p-8 rounded-2xl text-center shadow-2xl">
          <div className="w-16 h-1 bg-corbusier-red rounded-full mx-auto mb-4" />
          <h2 className="font-jost font-bold text-xl uppercase tracking-wider text-charcoal mb-2">
            Disconnected
          </h2>
          <p className="font-jost text-charcoal/60 text-sm mb-6">{mpErrorMessage}</p>
          <button
            onClick={() => {
              dispatch({ type: 'RESET_GAME' })
              useMultiplayerStore.getState().reset()
              setScreen('config')
            }}
            className="bg-corbusier-blue text-white font-jost font-bold uppercase px-6 py-3 rounded-lg w-full cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Back to Menu
          </button>
        </div>
      </div>
    )
  }

  function handleQuit() {
    if (window.confirm('End the current game?')) {
      if (gameMode === 'pvp') {
        sendQuit()
      }
      // Dispatch END_ROUND to compute final scores if we're mid-round
      if (phase !== 'ROUND_END') {
        dispatch({ type: 'END_ROUND' })
      }
      setShowGameOver(true)
    }
  }

  const isGamePhase =
    phase === 'SETUP' || phase === 'HUMAN_TURN' || phase === 'AI_THINKING'

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-concrete to-concrete/80 p-2 sm:p-4">
      {/* Top bar: turn indicator + round + quit */}
      <div className="relative flex items-center justify-center mb-3">
        <span className="absolute left-0 text-charcoal/30 text-[10px] uppercase font-jost tracking-wider">
          R{round.roundNumber}
        </span>
        <TurnIndicator phase={phase} currentPlayerId={round.currentPlayerId} />
        <button
          onClick={handleQuit}
          className="absolute right-0 text-charcoal/40 text-xs uppercase font-jost hover:text-corbusier-red transition-colors cursor-pointer"
        >
          Quit
        </button>
      </div>

      {isGamePhase && (
        <>
          {/* Shared word — prominent center */}
          <div className="flex justify-center mb-4">
            <SharedWordDisplay word={round.currentWord} />
          </div>

          {/* Score panel */}
          <div className="mb-4">
            <ScorePanel totalScores={totalScores} roundScores={roundScores} />
          </div>

          {/* Middle section: history | main area | chicken-o-meter */}
          <div className="flex flex-1 gap-4">
            {/* Word history — hidden on small screens */}
            <div className="hidden sm:block w-32 flex-shrink-0">
              <WordHistory turnHistory={round.turnHistory} />
            </div>

            {/* Main flexible area — PlayerHand */}
            <div className="flex-1 flex flex-col items-center justify-end pb-8">
              <PlayerHand />
            </div>

            {/* Chicken-o-meter — right side */}
            <div className="flex items-center flex-shrink-0">
              <ChickenOMeter wordLength={round.currentWord.length} />
            </div>
          </div>
        </>
      )}

      {phase === 'ROUND_END' && <RoundEndCard />}

      {(phase === 'GAME_OVER' || showGameOver) && <GameOverScreen />}
    </div>
  )
}
