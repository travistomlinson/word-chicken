import { useGameStore } from '../store/gameSlice'
import { useAppStore } from '../store/appSlice'
import { useMultiplayerStore } from '../store/multiplayerSlice'
import { sendQuitMessage } from '../hooks/useMultiplayer'
import { destroyPeer } from '../lib/multiplayer'

export function GameOverScreen() {
  const totalScores = useGameStore(s => s.gameState!.totalScores)
  const round = useGameStore(s => s.gameState!.round)
  const config = useGameStore(s => s.gameState!.config)
  const dispatch = useGameStore(s => s.dispatch)
  const setScreen = useAppStore(s => s.setScreen)

  const gameMode = useMultiplayerStore(s => s.gameMode)
  const localPlayerId = useMultiplayerStore(s => s.localPlayerId)
  const role = useMultiplayerStore(s => s.role)

  const opponentId = localPlayerId === 'human' ? 'ai' : 'human'
  const opponentLabel = gameMode === 'pvp' ? 'Opponent' : 'AI'

  const myScore = totalScores[localPlayerId] ?? 0
  const opponentScore = totalScores[opponentId] ?? 0
  const iWon = myScore >= opponentScore
  const resultText = iWon ? 'VICTORY' : 'DEFEAT'
  const resultColor = iWon ? 'text-corbusier-blue' : 'text-corbusier-red'
  const accentBg = iWon ? 'bg-corbusier-blue' : 'bg-corbusier-red'

  const longestWord = round.turnHistory.reduce(
    (longest, entry) => entry.word.length > longest.length ? entry.word : longest,
    ''
  )

  function handleRematch() {
    // Only host can start rematch in multiplayer
    if (gameMode !== 'pvp' || role === 'host') {
      dispatch({ type: 'START_GAME', config })
    }
  }

  function handleNewGame() {
    if (gameMode === 'pvp') {
      sendQuitMessage()
      destroyPeer()
      useMultiplayerStore.getState().reset()
    }
    dispatch({ type: 'RESET_GAME' })
    setScreen('config')
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 animate-fade-in">
      <div className="bg-card max-w-md w-full mx-4 p-8 rounded-2xl text-center shadow-2xl animate-scale-in">
        {/* Accent bar */}
        <div className={`w-20 h-1.5 ${accentBg} rounded-full mx-auto mb-6`} />

        {/* Result */}
        <h2 className={`font-jost font-bold text-5xl uppercase tracking-widest mb-6 ${resultColor}`}>
          {resultText}
        </h2>

        {/* Final scores */}
        <div className="flex justify-around items-end mb-6">
          <div className="text-center">
            <p className="text-xs uppercase tracking-wider text-ink-secondary mb-1">You</p>
            <p className={`font-bold transition-all ${iWon ? 'text-4xl text-corbusier-blue' : 'text-2xl text-ink'}`}>
              {myScore}
            </p>
          </div>
          <div className="text-ink/20 text-2xl font-bold">vs</div>
          <div className="text-center">
            <p className="text-xs uppercase tracking-wider text-ink-secondary mb-1">{opponentLabel}</p>
            <p className={`font-bold transition-all ${!iWon ? 'text-4xl text-corbusier-red' : 'text-2xl text-ink'}`}>
              {opponentScore}
            </p>
          </div>
        </div>

        {/* Rounds played */}
        <p className="text-ink-secondary text-sm mb-2">
          Played {round.roundNumber} round{round.roundNumber !== 1 ? 's' : ''}
        </p>

        {/* Longest word */}
        {longestWord && (
          <p className="text-ink-secondary text-sm mb-6">
            Longest word: <span className="font-bold uppercase">{longestWord}</span>
          </p>
        )}

        {!longestWord && <div className="mb-6" />}

        {/* Buttons */}
        <button
          onClick={handleRematch}
          className="bg-corbusier-blue text-white font-jost font-bold uppercase px-8 py-3 rounded-lg text-lg w-full mb-3 shadow-lg shadow-corbusier-blue/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 cursor-pointer"
        >
          Rematch
        </button>
        <button
          onClick={handleNewGame}
          className="bg-card text-ink border-2 border-ink/20 font-jost font-bold uppercase px-8 py-3 rounded-lg text-lg w-full hover:border-ink/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 cursor-pointer"
        >
          New Game
        </button>
      </div>
    </div>
  )
}
