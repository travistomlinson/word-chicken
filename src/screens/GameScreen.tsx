import { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameSlice'
import { useAppStore } from '../store/appSlice'
import { useAI } from '../hooks/useAI'
import { SharedWordDisplay } from '../components/SharedWordDisplay'
import { ChickenOMeter } from '../components/ChickenOMeter'
import { TurnIndicator } from '../components/TurnIndicator'
import { WordHistory } from '../components/WordHistory'
import { ScorePanel } from '../components/ScorePanel'
import { PlayerHand } from '../components/PlayerHand'
import { RoundEndCard } from '../components/RoundEndCard'
import { GameOverScreen } from '../components/GameOverScreen'

export function GameScreen() {
  // Mount AI hook at top level — fires on AI_THINKING and AI SETUP phases
  useAI()

  const phase = useGameStore(s => s.gameState?.phase)
  const round = useGameStore(s => s.gameState?.round)
  const totalScores = useGameStore(s => s.gameState?.totalScores ?? { human: 0, ai: 0 })
  const roundScores = useGameStore(s => s.gameState?.roundScores ?? { human: 0, ai: 0 })
  const dispatch = useGameStore(s => s.dispatch)
  const setScreen = useAppStore(s => s.setScreen)

  const [showGameOver, setShowGameOver] = useState(false)

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

  function handleQuit() {
    if (window.confirm('End the current game?')) {
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
    <div className="flex flex-col min-h-screen bg-concrete p-2 sm:p-4">
      {/* Top bar: turn indicator + quit button */}
      <div className="relative flex items-center justify-center mb-2">
        <TurnIndicator phase={phase} currentPlayerId={round.currentPlayerId} />
        <button
          onClick={handleQuit}
          className="absolute right-0 text-charcoal/50 text-xs uppercase font-jost"
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
