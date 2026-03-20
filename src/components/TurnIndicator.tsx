import type { TurnPhase } from '../types/game'
import { useMultiplayerStore } from '../store/multiplayerSlice'

interface TurnIndicatorProps {
  phase: TurnPhase
  currentPlayerId: string
}

export function TurnIndicator({ phase, currentPlayerId }: TurnIndicatorProps) {
  const gameMode = useMultiplayerStore(s => s.gameMode)
  const localPlayerId = useMultiplayerStore(s => s.localPlayerId)

  const baseClass = 'font-jost uppercase tracking-wider text-lg py-2 text-center transition-all duration-300'

  const isMyTurn = (phase === 'SETUP' && currentPlayerId === localPlayerId)
    || (phase === 'HUMAN_TURN' && localPlayerId === 'human')
    || (phase === 'AI_THINKING' && localPlayerId === 'ai')

  if (phase === 'SETUP') {
    if (gameMode === 'pvp' && currentPlayerId !== localPlayerId) {
      return (
        <div className={`${baseClass} text-accent-danger font-bold`}>
          <span className="inline-block w-2 h-2 rounded-full bg-corbusier-red mr-2 animate-pulse" />
          Opponent choosing starting word...
        </div>
      )
    }
    return (
      <div className={`${baseClass} text-ink`}>
        Choose a starting word
      </div>
    )
  }

  if (isMyTurn) {
    return (
      <div className={`${baseClass} text-accent-primary font-bold`}>
        <span className="inline-block w-2 h-2 rounded-full bg-corbusier-blue mr-2 animate-pulse" />
        Your Turn
      </div>
    )
  }

  if (phase === 'HUMAN_TURN' || phase === 'AI_THINKING') {
    const label = gameMode === 'pvp' ? 'Opponent is thinking...' : 'AI is thinking...'
    return (
      <div className={`${baseClass} text-accent-danger font-bold`}>
        <span className="inline-block w-2 h-2 rounded-full bg-corbusier-red mr-2 animate-pulse" />
        {label}
      </div>
    )
  }

  // ROUND_END and GAME_OVER: render nothing (overlay cards handle these)
  return null
}
