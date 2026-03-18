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

  const longestWord = round.turnHistory.reduce(
    (longest, entry) => entry.word.length > longest.length ? entry.word : longest,
    ''
  )

  function handleNextRound() {
    hasDispatchedEndRound.current = false
    dispatch({ type: 'NEXT_ROUND', winnerId })
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
      <div className="bg-white max-w-md w-full mx-4 p-8 rounded text-center">
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
            {round.turnHistory.map((entry, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm font-jost py-0.5">
                <span className="text-charcoal/50">
                  {entry.playerId === 'human' ? 'You' : 'AI'}
                </span>
                <span className="font-bold uppercase">{entry.word}</span>
                <span className="text-charcoal/50">+{entry.score}</span>
              </div>
            ))}
            {longestWord && (
              <p className="text-xs text-charcoal/40 text-center mt-2">
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
                <p className="text-xs text-charcoal/40">You</p>
                <p className="text-2xl font-bold">{roundScores['human'] ?? 0}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-charcoal/40">AI</p>
                <p className="text-2xl font-bold">{roundScores['ai'] ?? 0}</p>
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-charcoal/50 mb-1">Total</p>
            <div className="flex justify-around gap-6">
              <div className="text-center">
                <p className="text-xs text-charcoal/40">You</p>
                <p className="text-2xl font-bold">{totalScores['human'] ?? 0}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-charcoal/40">AI</p>
                <p className="text-2xl font-bold">{totalScores['ai'] ?? 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Next Round button */}
        <button
          onClick={handleNextRound}
          className="bg-corbusier-blue text-white font-jost font-bold uppercase px-8 py-3 rounded text-lg w-full"
        >
          Next Round
        </button>
      </div>
    </div>
  )
}
