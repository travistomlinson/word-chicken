import type { TurnPhase } from '../types/game'

interface TurnIndicatorProps {
  phase: TurnPhase
  currentPlayerId: string
}

export function TurnIndicator({ phase, currentPlayerId: _currentPlayerId }: TurnIndicatorProps) {
  const baseClass = 'font-jost uppercase tracking-wider text-sm py-2 text-center transition-all duration-300'

  if (phase === 'SETUP') {
    return (
      <div className={`${baseClass} text-charcoal`}>
        Choose a starting word
      </div>
    )
  }

  if (phase === 'HUMAN_TURN') {
    return (
      <div className={`${baseClass} text-corbusier-blue font-bold`}>
        <span className="inline-block w-2 h-2 rounded-full bg-corbusier-blue mr-2 animate-pulse" />
        Your Turn
      </div>
    )
  }

  if (phase === 'AI_THINKING') {
    return (
      <div className={`${baseClass} text-corbusier-red font-bold`}>
        <span className="inline-block w-2 h-2 rounded-full bg-corbusier-red mr-2 animate-pulse" />
        AI is thinking...
      </div>
    )
  }

  // ROUND_END and GAME_OVER: render nothing (overlay cards handle these)
  return null
}
