import { useMultiplayerStore } from '../store/multiplayerSlice'

interface ScorePanelProps {
  totalScores: Record<string, number>
  roundScores: Record<string, number>
}

export function ScorePanel({ totalScores, roundScores: _roundScores }: ScorePanelProps) {
  const gameMode = useMultiplayerStore(s => s.gameMode)
  const localPlayerId = useMultiplayerStore(s => s.localPlayerId)

  const opponentId = localPlayerId === 'human' ? 'ai' : 'human'
  const myScore = totalScores[localPlayerId] ?? 0
  const opponentScore = totalScores[opponentId] ?? 0
  const myLeads = myScore > opponentScore
  const opponentLeads = opponentScore > myScore

  const opponentLabel = gameMode === 'pvp' ? 'Them' : 'AI'

  return (
    <div className="flex gap-6 sm:gap-10 justify-center items-center font-jost">
      <div className={[
        'flex flex-col items-center px-4 py-1 rounded-lg transition-all duration-300',
        myLeads ? 'bg-corbusier-blue/10' : '',
      ].join(' ')}>
        <span className="text-corbusier-blue font-bold uppercase text-[10px] tracking-wider">You</span>
        <span className={[
          'font-bold text-charcoal transition-all duration-300',
          myLeads ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl',
        ].join(' ')}>
          {myScore}
        </span>
      </div>
      <span className="text-charcoal/20 text-sm font-bold">vs</span>
      <div className={[
        'flex flex-col items-center px-4 py-1 rounded-lg transition-all duration-300',
        opponentLeads ? 'bg-corbusier-red/10' : '',
      ].join(' ')}>
        <span className="text-corbusier-red font-bold uppercase text-[10px] tracking-wider">{opponentLabel}</span>
        <span className={[
          'font-bold text-charcoal transition-all duration-300',
          opponentLeads ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl',
        ].join(' ')}>
          {opponentScore}
        </span>
      </div>
    </div>
  )
}
