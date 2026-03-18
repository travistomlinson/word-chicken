interface ScorePanelProps {
  totalScores: Record<string, number>
  roundScores: Record<string, number>
}

export function ScorePanel({ totalScores, roundScores: _roundScores }: ScorePanelProps) {
  const humanScore = totalScores['human'] ?? 0
  const aiScore = totalScores['ai'] ?? 0

  return (
    <div className="flex gap-4 sm:gap-8 justify-center font-jost">
      <div className="flex flex-col items-center">
        <span className="text-corbusier-blue font-bold uppercase text-xs">You</span>
        <span className="text-xl sm:text-2xl font-bold text-charcoal">{humanScore}</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-corbusier-red font-bold uppercase text-xs">AI</span>
        <span className="text-xl sm:text-2xl font-bold text-charcoal">{aiScore}</span>
      </div>
    </div>
  )
}
