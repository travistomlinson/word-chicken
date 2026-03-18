import { useGameStore } from '../store/gameSlice'
import { useAppStore } from '../store/appSlice'

export function GameOverScreen() {
  const totalScores = useGameStore(s => s.gameState!.totalScores)
  const round = useGameStore(s => s.gameState!.round)
  const config = useGameStore(s => s.gameState!.config)
  const dispatch = useGameStore(s => s.dispatch)
  const setScreen = useAppStore(s => s.setScreen)

  const humanWon = totalScores['human'] >= totalScores['ai']
  const resultText = humanWon ? 'VICTORY' : 'DEFEAT'
  const resultColor = humanWon ? 'text-corbusier-blue' : 'text-corbusier-red'

  const longestWord = round.turnHistory.reduce(
    (longest, entry) => entry.word.length > longest.length ? entry.word : longest,
    ''
  )

  function handleRematch() {
    dispatch({ type: 'START_GAME', config })
  }

  function handleNewGame() {
    dispatch({ type: 'RESET_GAME' })
    setScreen('config')
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
      <div className="bg-white max-w-md w-full mx-4 p-8 rounded text-center">
        {/* Result */}
        <h2 className={`font-jost font-bold text-5xl uppercase tracking-widest mb-4 ${resultColor}`}>
          {resultText}
        </h2>

        {/* Final scores */}
        <div className="flex justify-around items-end mb-4">
          <div className="text-center">
            <p className="text-xs uppercase tracking-wider text-charcoal/50 mb-1">You</p>
            <p className={`font-bold ${humanWon ? 'text-4xl text-corbusier-blue' : 'text-2xl text-charcoal'}`}>
              {totalScores['human'] ?? 0}
            </p>
          </div>
          <div className="text-charcoal/30 text-2xl font-bold">vs</div>
          <div className="text-center">
            <p className="text-xs uppercase tracking-wider text-charcoal/50 mb-1">AI</p>
            <p className={`font-bold ${!humanWon ? 'text-4xl text-corbusier-red' : 'text-2xl text-charcoal'}`}>
              {totalScores['ai'] ?? 0}
            </p>
          </div>
        </div>

        {/* Rounds played */}
        <p className="text-charcoal/50 text-sm mb-2">
          Played {round.roundNumber} round{round.roundNumber !== 1 ? 's' : ''}
        </p>

        {/* Longest word */}
        {longestWord && (
          <p className="text-charcoal/50 text-sm mb-6">
            Longest word: <span className="font-bold uppercase">{longestWord}</span>
          </p>
        )}

        {!longestWord && <div className="mb-6" />}

        {/* Buttons */}
        <button
          onClick={handleRematch}
          className="bg-corbusier-blue text-white font-jost font-bold uppercase px-8 py-3 rounded text-lg w-full mb-3"
        >
          Rematch
        </button>
        <button
          onClick={handleNewGame}
          className="bg-white text-charcoal border-2 border-charcoal font-jost font-bold uppercase px-8 py-3 rounded text-lg w-full"
        >
          New Game
        </button>
      </div>
    </div>
  )
}
