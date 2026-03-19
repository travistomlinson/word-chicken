import type { GameState, GameAction, GameConfig, RoundState } from '../types/game'
import type { TileDistribution } from './tileBag'
import { validateTurn } from './wordValidator'
import { validateStartingWord } from './roundManager'
import { eliminatePlayer, checkRoundEnd, createRoundState, startNextRound } from './roundManager'
import { scoreWord } from './scoreCalculator'
import { drawToNine } from './tileBag'

// --- Helpers ---

/**
 * Returns the next player ID in the turn order (wraps around).
 * Cycles through activePlayers in order.
 */
function advanceTurn(round: RoundState): string {
  const { activePlayers, currentPlayerId } = round
  const idx = activePlayers.indexOf(currentPlayerId)
  const nextIdx = (idx + 1) % activePlayers.length
  return activePlayers[nextIdx]
}

/**
 * Returns true if the next player to act is the 'ai' player.
 */
function nextPlayerIsAI(round: RoundState): boolean {
  return advanceTurn(round) === 'ai'
}

/**
 * Applies a valid turn to the round state:
 * - Updates currentWord
 * - Removes the one added letter from the player's hand
 * - Draws tiles back up to 9 from bag
 * - Updates player score
 * - Appends to turnHistory
 * - Advances currentPlayerId
 *
 * NOTE: The bag spread ensures the reducer is pure (no shared mutation).
 */
function applyValidTurn(
  round: RoundState,
  playerId: string,
  word: string,
  points: number,
): RoundState {
  // Compute the single added letter (multiset diff between newWord and currentWord)
  const newFreq = letterFrequency(word)
  const prevFreq = letterFrequency(round.currentWord)
  let addedLetter = ''
  for (const [ch, count] of newFreq) {
    const extra = count - (prevFreq.get(ch) ?? 0)
    if (extra > 0) {
      addedLetter = ch
      break
    }
  }

  // Remove one instance of the added letter from player's hand
  const oldHand = round.players[playerId].hand
  const letterIdx = oldHand.findIndex(l => l === addedLetter)
  const handAfterRemove = letterIdx >= 0
    ? [...oldHand.slice(0, letterIdx), ...oldHand.slice(letterIdx + 1)]
    : [...oldHand]

  // Draw back to 9 — must spread bag to avoid mutating shared state
  const newBag = [...round.bag]
  const newHand = drawToNine(handAfterRemove, newBag)

  const nextPlayerId = advanceTurn(round)

  return {
    ...round,
    currentWord: word.toUpperCase(),
    bag: newBag,
    currentPlayerId: nextPlayerId,
    players: {
      ...round.players,
      [playerId]: {
        ...round.players[playerId],
        hand: newHand,
        score: round.players[playerId].score + points,
      },
    },
    turnHistory: [
      ...round.turnHistory,
      { playerId, word: word.toUpperCase(), score: points },
    ],
  }
}

/** Letter frequency map (uppercase keys). */
function letterFrequency(word: string): Map<string, number> {
  const freq = new Map<string, number>()
  for (const ch of word.toUpperCase()) {
    freq.set(ch, (freq.get(ch) ?? 0) + 1)
  }
  return freq
}

// --- Public API ---

/**
 * Creates an initial GameState from config.
 * Two players: 'human' and 'ai', both starting at round 1.
 */
export function createInitialGameState(config: GameConfig): GameState {
  const playerIds = ['human', 'ai']
  const playerNames: Record<string, string> = { human: 'Player', ai: 'AI' }
  const round = createRoundState(
    playerIds,
    playerNames,
    config.tileDistribution as TileDistribution,
    1,
    'human'
  )

  return {
    phase: 'SETUP',
    round,
    config,
    roundScores: { human: 0, ai: 0 },
    totalScores: { human: 0, ai: 0 },
    hintUsed: false,
  }
}

/**
 * Pure reducer for the Word Chicken game FSM.
 * Returns unchanged state reference for illegal transitions (no throw).
 * Returns null for RESET_GAME (store clears gameState).
 */
export function gameReducer(state: GameState, action: GameAction): GameState | null {
  switch (action.type) {
    case 'START_GAME': {
      return createInitialGameState(action.config)
    }

    case 'SUBMIT_STARTING_WORD': {
      if (state.phase !== 'SETUP') {
        if (import.meta.env.DEV) {
          console.warn(`[gameReducer] SUBMIT_STARTING_WORD ignored: phase is ${state.phase}`)
        }
        return state
      }

      const result = validateStartingWord(
        action.word,
        state.round.players[action.playerId].hand,
        state.config.dictionary
      )

      if (!result.valid) {
        return state
      }

      const upper = action.word.toUpperCase()

      // Remove all letters of the starting word from the player's hand
      let handAfterWord = [...state.round.players[action.playerId].hand]
      for (const ch of upper) {
        const idx = handAfterWord.indexOf(ch)
        if (idx >= 0) {
          handAfterWord = [...handAfterWord.slice(0, idx), ...handAfterWord.slice(idx + 1)]
        }
      }

      // Draw back to 9
      const newBag = [...state.round.bag]
      const newHand = drawToNine(handAfterWord, newBag)

      // Determine next player and phase
      const tempRound: RoundState = {
        ...state.round,
        currentWord: upper,
        bag: newBag,
        players: {
          ...state.round.players,
          [action.playerId]: {
            ...state.round.players[action.playerId],
            hand: newHand,
          },
        },
      }

      const nextIsAI = nextPlayerIsAI(tempRound)
      const nextPlayerId = advanceTurn(tempRound)
      const newPhase = nextIsAI ? 'AI_THINKING' : 'HUMAN_TURN'

      const startingWordScore = scoreWord(upper)

      return {
        ...state,
        phase: newPhase,
        round: {
          ...tempRound,
          currentPlayerId: nextPlayerId,
          turnHistory: [
            { playerId: action.playerId, word: upper, score: startingWordScore },
          ],
        },
      }
    }

    case 'SUBMIT_WORD': {
      const allowedPhases = ['HUMAN_TURN', 'AI_THINKING']
      if (!allowedPhases.includes(state.phase)) {
        if (import.meta.env.DEV) {
          console.warn(`[gameReducer] SUBMIT_WORD ignored: phase is ${state.phase}`)
        }
        return state
      }

      const result = validateTurn(
        action.word,
        state.round.currentWord,
        state.round.players[action.playerId].hand,
        state.config.dictionary,
        { banPluralS: state.config.banPluralS }
      )

      if (!result.valid) {
        return state
      }

      const points = scoreWord(action.word)
      const newRound = applyValidTurn(state.round, action.playerId, action.word, points)

      // Phase after this turn depends on who goes next
      const newPhase = newRound.currentPlayerId === 'ai' ? 'AI_THINKING' : 'HUMAN_TURN'

      return {
        ...state,
        phase: newPhase,
        round: newRound,
      }
    }

    case 'ELIMINATE_PLAYER': {
      const roundAfterElim = eliminatePlayer(state.round, action.playerId)
      const endResult = checkRoundEnd(roundAfterElim)

      return {
        ...state,
        phase: endResult.over ? 'ROUND_END' : state.phase,
        round: roundAfterElim,
      }
    }

    case 'END_ROUND': {
      if (state.phase !== 'ROUND_END') {
        if (import.meta.env.DEV) {
          console.warn(`[gameReducer] END_ROUND ignored: phase is ${state.phase}`)
        }
        return state
      }

      // Compute roundScores from turnHistory
      const roundScores: Record<string, number> = {}
      for (const entry of state.round.turnHistory) {
        roundScores[entry.playerId] = (roundScores[entry.playerId] ?? 0) + entry.score
      }

      // Accumulate into totalScores
      const totalScores = { ...state.totalScores }
      for (const [id, pts] of Object.entries(roundScores)) {
        totalScores[id] = (totalScores[id] ?? 0) + pts
      }

      return {
        ...state,
        roundScores,
        totalScores,
      }
    }

    case 'NEXT_ROUND': {
      if (state.phase !== 'ROUND_END') {
        if (import.meta.env.DEV) {
          console.warn(`[gameReducer] NEXT_ROUND ignored: phase is ${state.phase}`)
        }
        return state
      }

      const newRound = startNextRound(
        state.round,
        action.winnerId,
        state.config.tileDistribution as TileDistribution
      )

      return {
        ...state,
        phase: 'SETUP',
        round: newRound,
        roundScores: { human: 0, ai: 0 },
      }
    }

    case 'USE_HINT': {
      return { ...state, hintUsed: true }
    }

    case 'AI_TURN_START': {
      // Signals that AI logic should begin computing; no state changes needed here
      return state
    }

    case 'RESET_GAME': {
      return null
    }

    default: {
      return state
    }
  }
}
