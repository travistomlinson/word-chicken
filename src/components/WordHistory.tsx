interface TurnEntry {
  playerId: string
  word: string
  score: number
}

interface WordHistoryProps {
  turnHistory: TurnEntry[]
}

export function WordHistory({ turnHistory }: WordHistoryProps) {
  if (turnHistory.length === 0) return null

  return (
    <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
      {turnHistory.map((entry, index) => {
        const isHuman = entry.playerId === 'human'
        const playerLabel = isHuman ? 'You' : 'AI'
        const labelColor = isHuman ? 'text-corbusier-blue' : 'text-corbusier-red'

        return (
          <div
            key={index}
            className="flex items-center gap-2 py-1 px-2 text-sm font-jost"
          >
            <span className={`font-bold uppercase text-xs w-8 ${labelColor}`}>
              {playerLabel}
            </span>
            <span className="font-bold tracking-wider text-charcoal">
              {entry.word}
            </span>
            <span className="text-charcoal/50 text-xs ml-auto">
              +{entry.score}
            </span>
          </div>
        )
      })}
    </div>
  )
}
