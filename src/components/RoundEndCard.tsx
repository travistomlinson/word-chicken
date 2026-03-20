import { useEffect, useRef } from 'react'
import { useGameStore } from '../store/gameSlice'
import { useMultiplayerStore } from '../store/multiplayerSlice'

export function RoundEndCard() {
  const round = useGameStore(s => s.gameState!.round)
  const totalScores = useGameStore(s => s.gameState!.totalScores)
  const roundScores = useGameStore(s => s.gameState!.roundScores)
  const dispatch = useGameStore(s => s.dispatch)

  const gameMode = useMultiplayerStore(s => s.gameMode)
  const localPlayerId = useMultiplayerStore(s => s.localPlayerId)
  const role = useMultiplayerStore(s => s.role)

  const opponentId = localPlayerId === 'human' ? 'ai' : 'human'

  const hasDispatchedEndRound = useRef(false)

  useEffect(() => {
    if (!hasDispatchedEndRound.current) {
      // Only host dispatches END_ROUND in multiplayer
      if (gameMode !== 'pvp' || role === 'host') {
        dispatch({ type: 'END_ROUND' })
      }
      hasDispatchedEndRound.current = true
    }
  }, [dispatch, gameMode, role])

  const winnerId = round.activePlayers[0]
  const iWon = winnerId === localPlayerId
  const winnerName = iWon ? 'You' : (gameMode === 'pvp' ? 'Opponent' : 'AI')
  const winnerColor = iWon ? 'text-accent-primary' : 'text-accent-danger'
  const accentBg = iWon ? 'bg-corbusier-blue' : 'bg-corbusier-red'

  const opponentLabel = gameMode === 'pvp' ? 'Them' : 'AI'

  const longestWord = round.turnHistory.reduce(
    (longest, entry) => entry.word.length > longest.length ? entry.word : longest,
    ''
  )

  function handleNextRound() {
    hasDispatchedEndRound.current = false
    // Only host dispatches in multiplayer
    if (gameMode !== 'pvp' || role === 'host') {
      dispatch({ type: 'NEXT_ROUND', winnerId })
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 animate-fade-in">
      <div className="bg-card max-w-md w-full mx-4 p-8 rounded-2xl text-center shadow-2xl animate-scale-in">
        {/* Accent bar */}
        <div className={`w-16 h-1 ${accentBg} rounded-full mx-auto mb-4`} />

        {/* Round number */}
        <p className="font-jost text-sm uppercase tracking-wider text-ink-secondary mb-2">
          Round {round.roundNumber}
        </p>

        {/* Winner */}
        <h2 className={`font-jost font-bold text-3xl uppercase tracking-widest mb-6 ${winnerColor}`}>
          {winnerName} Won!
        </h2>

        {/* Word chain */}
        {round.turnHistory.length > 0 && (
          <div className="mb-6 max-h-40 overflow-y-auto text-left">
            <p className="text-xs uppercase tracking-wider text-ink-secondary mb-2 text-center">Word Chain</p>
            {round.turnHistory.map((entry, idx) => {
              const isMe = entry.playerId === localPlayerId
              const borderColor = isMe ? 'border-l-corbusier-blue' : 'border-l-corbusier-red'
              return (
                <div key={idx} className={`flex justify-between items-center text-sm font-jost py-1 px-2 border-l-2 ${borderColor}`}>
                  <span className="text-ink-secondary text-xs">
                    {isMe ? 'You' : opponentLabel}
                  </span>
                  <span className="font-bold uppercase tracking-wider">{entry.word}</span>
                  <span className="text-ink-secondary text-xs">+{entry.score}</span>
                </div>
              )
            })}
            {longestWord && (
              <p className="text-xs text-ink-secondary text-center mt-3">
                Longest: <span className="font-bold uppercase">{longestWord}</span>
              </p>
            )}
          </div>
        )}

        {/* Scores */}
        <div className="flex justify-around mb-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-ink-secondary mb-1">Round Points</p>
            <div className="flex justify-around gap-6">
              <div className="text-center">
                <p className="text-[10px] text-ink-secondary uppercase">You</p>
                <p className="text-2xl font-bold">{roundScores[localPlayerId] ?? 0}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-ink-secondary uppercase">{opponentLabel}</p>
                <p className="text-2xl font-bold">{roundScores[opponentId] ?? 0}</p>
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-ink-secondary mb-1">Total</p>
            <div className="flex justify-around gap-6">
              <div className="text-center">
                <p className="text-[10px] text-ink-secondary uppercase">You</p>
                <p className="text-2xl font-bold">{totalScores[localPlayerId] ?? 0}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-ink-secondary uppercase">{opponentLabel}</p>
                <p className="text-2xl font-bold">{totalScores[opponentId] ?? 0}</p>
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
