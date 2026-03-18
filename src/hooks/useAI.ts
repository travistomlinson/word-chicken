import { useEffect } from 'react'
import { useGameStore } from '../store/gameSlice'
import { findAIMove, findAIStartingWord, getVocabulary } from '../lib/aiEngine'

/**
 * useAI — mounts once at the Game screen level.
 *
 * Reacts to two AI-driven phases:
 *
 * 1. `AI_THINKING` — AI must extend the current word.
 *    Schedules computation inside requestAnimationFrame so React paints
 *    the "thinking" indicator before blocking on the AI search.
 *
 * 2. `SETUP` when `currentPlayerId === 'ai'` — AI won the previous round
 *    and must choose a starting word.
 *    Also scheduled inside rAF for consistency.
 *
 * Cleanup: cancels any pending rAF on phase change or unmount to prevent
 * stale dispatches.
 */
export function useAI(): void {
  const gameState = useGameStore(s => s.gameState)
  const dispatch = useGameStore(s => s.dispatch)

  useEffect(() => {
    if (gameState === null) return

    const { phase, round, config } = gameState

    // Guard: dictionary must be loaded
    if (config.dictionary.size === 0) return

    let rafId: number | undefined

    if (phase === 'AI_THINKING') {
      rafId = requestAnimationFrame(() => {
        // Re-read current state from store at computation time (avoids stale closure)
        const current = useGameStore.getState().gameState
        if (current === null || current.phase !== 'AI_THINKING') return

        const aiPlayer = current.round.players['ai']
        if (!aiPlayer) return

        const vocab = getVocabulary(current.config.difficulty, current.config.dictionary)

        // Shuffle for variety (getVocabulary returns a stable array — we shuffle a copy)
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

        if (move !== null) {
          dispatch({ type: 'SUBMIT_WORD', playerId: 'ai', word: move })
        } else {
          dispatch({ type: 'ELIMINATE_PLAYER', playerId: 'ai' })
        }
      })
    } else if (phase === 'SETUP' && round.currentPlayerId === 'ai') {
      rafId = requestAnimationFrame(() => {
        const current = useGameStore.getState().gameState
        if (current === null || current.phase !== 'SETUP') return
        if (current.round.currentPlayerId !== 'ai') return

        const aiPlayer = current.round.players['ai']
        if (!aiPlayer) return

        const word = findAIStartingWord(aiPlayer.hand, current.config.dictionary)

        if (word !== null) {
          dispatch({ type: 'SUBMIT_STARTING_WORD', playerId: 'ai', word })
        } else {
          // Extremely unlikely with 9 tiles and 200+ starting words, but handle gracefully
          console.error('[useAI] AI could not find a starting word — eliminating')
          dispatch({ type: 'ELIMINATE_PLAYER', playerId: 'ai' })
        }
      })
    }

    return () => {
      if (rafId !== undefined) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [
    gameState?.phase,
    gameState?.round.currentPlayerId,
    dispatch,
  ])
}
