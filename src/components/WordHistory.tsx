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
    <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
      <p className="text-[10px] uppercase tracking-wider text-charcoal/30 font-jost mb-1">History</p>
      {turnHistory.map((entry, index) => {
        const isHuman = entry.playerId === 'human'
        const playerLabel = isHuman ? 'You' : 'AI'
        const labelColor = isHuman ? 'text-corbusier-blue' : 'text-corbusier-red'
        const borderColor = isHuman ? 'border-l-corbusier-blue' : 'border-l-corbusier-red'

        return (
          <div
            key={index}
            className={`flex items-center gap-2 py-1 px-2 text-sm font-jost border-l-2 ${borderColor} animate-fade-in`}
          >
            <span className={`font-bold uppercase text-[10px] w-6 ${labelColor}`}>
              {playerLabel}
            </span>
            <span className="font-bold tracking-wider text-charcoal text-xs">
              {entry.word}
            </span>
            <span className="text-charcoal/40 text-[10px] ml-auto">
              +{entry.score}
            </span>
          </div>
        )
      })}
    </div>
  )
}
