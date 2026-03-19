interface ScorePanelProps {
  totalScores: Record<string, number>
  roundScores: Record<string, number>
}

export function ScorePanel({ totalScores, roundScores: _roundScores }: ScorePanelProps) {
  const humanScore = totalScores['human'] ?? 0
  const aiScore = totalScores['ai'] ?? 0
  const humanLeads = humanScore > aiScore
  const aiLeads = aiScore > humanScore

  return (
    <div className="flex gap-6 sm:gap-10 justify-center items-center font-jost">
      <div className={[
        'flex flex-col items-center px-4 py-1 rounded-lg transition-all duration-300',
        humanLeads ? 'bg-corbusier-blue/10' : '',
      ].join(' ')}>
        <span className="text-corbusier-blue font-bold uppercase text-[10px] tracking-wider">You</span>
        <span className={[
          'font-bold text-charcoal transition-all duration-300',
          humanLeads ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl',
        ].join(' ')}>
          {humanScore}
        </span>
      </div>
      <span className="text-charcoal/20 text-sm font-bold">vs</span>
      <div className={[
        'flex flex-col items-center px-4 py-1 rounded-lg transition-all duration-300',
        aiLeads ? 'bg-corbusier-red/10' : '',
      ].join(' ')}>
        <span className="text-corbusier-red font-bold uppercase text-[10px] tracking-wider">AI</span>
        <span className={[
          'font-bold text-charcoal transition-all duration-300',
          aiLeads ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl',
        ].join(' ')}>
          {aiScore}
        </span>
      </div>
    </div>
  )
}
