import { useMultiplayerStore } from '../store/multiplayerSlice'

interface TurnEntry {
  playerId: string
  word: string
  score: number
}

interface WordHistoryProps {
  turnHistory: TurnEntry[]
}

export function WordHistory({ turnHistory }: WordHistoryProps) {
  const gameMode = useMultiplayerStore(s => s.gameMode)
  const localPlayerId = useMultiplayerStore(s => s.localPlayerId)

  if (turnHistory.length === 0) return null

  return (
    <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
      <p className="text-[10px] uppercase tracking-wider text-ink-secondary font-jost mb-1">History</p>
      {turnHistory.map((entry, index) => {
        const isMe = entry.playerId === localPlayerId
        const playerLabel = isMe ? 'You' : (gameMode === 'pvp' ? 'Them' : 'AI')
        const labelColor = isMe ? 'text-accent-primary' : 'text-accent-danger'
        const borderColor = isMe ? 'border-l-corbusier-blue' : 'border-l-corbusier-red'

        return (
          <div
            key={index}
            className={`flex items-center gap-2 py-1 px-2 text-sm font-jost border-l-2 ${borderColor} animate-fade-in`}
          >
            <span className={`font-bold uppercase text-[10px] w-6 ${labelColor}`}>
              {playerLabel}
            </span>
            <span className="font-bold tracking-wider text-ink text-xs">
              {entry.word}
            </span>
            <span className="text-ink-secondary text-[10px] ml-auto">
              +{entry.score}
            </span>
          </div>
        )
      })}
    </div>
  )
}
