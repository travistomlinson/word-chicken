import { useEffect, useRef } from 'react'
import { useGameStore } from '../store/gameSlice'

export function RoundEndCard() {
  const round = useGameStore(s => s.gameState!.round)
  const totalScores = useGameStore(s => s.gameState!.totalScores)
  const roundScores = useGameStore(s => s.gameState!.roundScores)
  const dispatch = useGameStore(s => s.dispatch)

  const hasDispatchedEndRound = useRef(false)

  useEffect(() => {
    if (!hasDispatchedEndRound.current) {
      dispatch({ type: 'END_ROUND' })
      hasDispatchedEndRound.current = true
    }
  }, [dispatch])

  const winnerId = round.activePlayers[0]
  const winnerName = winnerId === 'human' ? 'You' : 'AI'
  const winnerColor = winnerId === 'human' ? 'text-corbusier-blue' : 'text-corbusier-red'
  const accentBg = winnerId === 'human' ? 'bg-corbusier-blue' : 'bg-corbusier-red'

  const longestWord = round.turnHistory.reduce(
    (longest, entry) => entry.word.length > longest.length ? entry.word : longest,
    ''
  )

  function handleNextRound() {
    hasDispatchedEndRound.current = false
    dispatch({ type: 'NEXT_ROUND', winnerId })
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 animate-fade-in">
      <div className="bg-white max-w-md w-full mx-4 p-8 rounded-2xl text-center shadow-2xl animate-scale-in">
        {/* Accent bar */}
        <div className={`w-16 h-1 ${accentBg} rounded-full mx-auto mb-4`} />

        {/* Round number */}
        <p className="font-jost text-sm uppercase tracking-wider text-charcoal/50 mb-2">
          Round {round.roundNumber}
        </p>

        {/* Winner */}
        <h2 className={`font-jost font-bold text-3xl uppercase tracking-widest mb-6 ${winnerColor}`}>
          {winnerName} Won!
        </h2>

        {/* Word chain */}
        {round.turnHistory.length > 0 && (
          <div className="mb-6 max-h-40 overflow-y-auto text-left">
            <p className="text-xs uppercase tracking-wider text-charcoal/40 mb-2 text-center">Word Chain</p>
            {round.turnHistory.map((entry, idx) => {
              const isHuman = entry.playerId === 'human'
              const borderColor = isHuman ? 'border-l-corbusier-blue' : 'border-l-corbusier-red'
              return (
                <div key={idx} className={`flex justify-between items-center text-sm font-jost py-1 px-2 border-l-2 ${borderColor}`}>
                  <span className="text-charcoal/50 text-xs">
                    {isHuman ? 'You' : 'AI'}
                  </span>
                  <span className="font-bold uppercase tracking-wider">{entry.word}</span>
                  <span className="text-charcoal/50 text-xs">+{entry.score}</span>
                </div>
              )
            })}
            {longestWord && (
              <p className="text-xs text-charcoal/40 text-center mt-3">
                Longest: <span className="font-bold uppercase">{longestWord}</span>
              </p>
            )}
          </div>
        )}

        {/* Scores */}
        <div className="flex justify-around mb-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-charcoal/50 mb-1">Round Points</p>
            <div className="flex justify-around gap-6">
              <div className="text-center">
                <p className="text-[10px] text-charcoal/40 uppercase">You</p>
                <p className="text-2xl font-bold">{roundScores['human'] ?? 0}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-charcoal/40 uppercase">AI</p>
                <p className="text-2xl font-bold">{roundScores['ai'] ?? 0}</p>
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-charcoal/50 mb-1">Total</p>
            <div className="flex justify-around gap-6">
              <div className="text-center">
                <p className="text-[10px] text-charcoal/40 uppercase">You</p>
                <p className="text-2xl font-bold">{totalScores['human'] ?? 0}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-charcoal/40 uppercase">AI</p>
                <p className="text-2xl font-bold">{totalScores['ai'] ?? 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Next Round button */}
        <button
          onClick={handleNextRound}
          className="bg-corbusier-blue text-white font-jost font-bold uppercase px-8 py-3 rounded-lg text-lg w-full shadow-lg shadow-corbusier-blue/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 cursor-pointer"
        >
          Next Round
        </button>
      </div>
    </div>
  )
}
