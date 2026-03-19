import { useEffect } from 'react'
import { useGameStore } from '../store/gameSlice'
import { findAIMove, findAIStartingWord, getVocabulary } from '../lib/aiEngine'

/**
 * useAI — mounts once at the Game screen level.
 *
 * Reacts to two AI-driven phases:
 *
 * 1. `AI_THINKING` — AI must extend the current word.
 *    Computes the move immediately, then delays dispatch by 1–2.5s
 *    so the player can see the "thinking" animation.
 *
 * 2. `SETUP` when `currentPlayerId === 'ai'` — AI won the previous round
 *    and must choose a starting word. Also delayed for natural pacing.
 *
 * Cleanup: cancels pending timers on phase change or unmount.
 */
export function useAI(): void {
  const gameState = useGameStore(s => s.gameState)
  const dispatch = useGameStore(s => s.dispatch)

  useEffect(() => {
    if (gameState === null) return

    const { phase, round, config } = gameState

    // Skip AI in PVP mode
    if (config.gameMode === 'pvp') return

    // Guard: dictionary must be loaded
    if (config.dictionary.size === 0) return

    let timerId: ReturnType<typeof setTimeout> | undefined

    if (phase === 'AI_THINKING') {
      // Compute move synchronously, then delay the dispatch
      const current = useGameStore.getState().gameState
      if (current === null || current.phase !== 'AI_THINKING') return

      const aiPlayer = current.round.players['ai']
      if (!aiPlayer) return

      const vocab = getVocabulary(current.config.difficulty, current.config.dictionary)

      const shuffledArray = [...vocab.array]
      for (let i = shuffledArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]]
      }

      const move = findAIMove(
        current.round.currentWord,
        aiPlayer.hand,
        shuffledArray,
        vocab.set,
        current.config
      )

      // Random delay between 1.2–2.5s for natural feel
      const delay = 1200 + Math.random() * 1300

      timerId = setTimeout(() => {
        // Re-check state is still valid before dispatching
        const latest = useGameStore.getState().gameState
        if (latest === null || latest.phase !== 'AI_THINKING') return

        if (move !== null) {
          dispatch({ type: 'SUBMIT_WORD', playerId: 'ai', word: move })
        } else {
          dispatch({ type: 'ELIMINATE_PLAYER', playerId: 'ai' })
        }
      }, delay)
    } else if (phase === 'SETUP' && round.currentPlayerId === 'ai') {
      const current = useGameStore.getState().gameState
      if (current === null || current.phase !== 'SETUP') return
      if (current.round.currentPlayerId !== 'ai') return

      const aiPlayer = current.round.players['ai']
      if (!aiPlayer) return

      const word = findAIStartingWord(aiPlayer.hand, current.config.dictionary)

      const delay = 800 + Math.random() * 700

      timerId = setTimeout(() => {
        const latest = useGameStore.getState().gameState
        if (latest === null || latest.phase !== 'SETUP') return
        if (latest.round.currentPlayerId !== 'ai') return

        if (word !== null) {
          dispatch({ type: 'SUBMIT_STARTING_WORD', playerId: 'ai', word })
        } else {
          console.error('[useAI] AI could not find a starting word — eliminating')
          dispatch({ type: 'ELIMINATE_PLAYER', playerId: 'ai' })
        }
      }, delay)
    }

    return () => {
      if (timerId !== undefined) {
        clearTimeout(timerId)
      }
    }
  }, [
    gameState?.phase,
    gameState?.round.currentPlayerId,
    dispatch,
  ])
}
