import type { RoundState, PlayerState, StartingWordResult, RoundEndResult } from '../types/game'
import type { TileDistribution } from './tileBag'
import { isInDictionary } from './wordValidator'
import { createBag, dealHand } from './tileBag'

/**
 * Validates a starting word submission:
 * 1. Must be exactly 3 letters
 * 2. Must be in the dictionary (after Q expansion)
 * 3. Hand must contain all required letters
 */
export function validateStartingWord(
  word: string,
  hand: string[],
  dictionary: Set<string>
): StartingWordResult {
  const upper = word.toUpperCase()

  // 1. Length check
  if (upper.length !== 3) {
    return { valid: false, reason: 'not_in_corpus' }
  }

  // 2. Dictionary check
  if (!isInDictionary(upper, dictionary)) {
    return { valid: false, reason: 'not_a_word' }
  }

  // 3. Hand availability check
  const handFreq = new Map<string, number>()
  for (const ch of hand) {
    handFreq.set(ch, (handFreq.get(ch) ?? 0) + 1)
  }
  const wordFreq = new Map<string, number>()
  for (const ch of upper) {
    wordFreq.set(ch, (wordFreq.get(ch) ?? 0) + 1)
  }
  for (const [ch, count] of wordFreq) {
    if ((handFreq.get(ch) ?? 0) < count) {
      return { valid: false, reason: 'letters_unavailable' }
    }
  }

  return { valid: true }
}

/**
 * Removes a player from the active players list and marks them inactive.
 * Pure function — returns new state, never mutates input.
 */
export function eliminatePlayer(state: RoundState, playerId: string): RoundState {
  return {
    ...state,
    activePlayers: state.activePlayers.filter(id => id !== playerId),
    players: {
      ...state.players,
      [playerId]: {
        ...state.players[playerId],
        isActive: false,
      },
    },
  }
}

/**
 * Checks if the round has ended (only 1 active player remaining).
 * Returns the winner's ID if round is over, otherwise indicates continuation.
 */
export function checkRoundEnd(state: RoundState): RoundEndResult {
  if (state.activePlayers.length === 1) {
    return { over: true, winnerId: state.activePlayers[0] }
  }
  return { over: false }
}

/**
 * Creates a fresh round state with new hands for all players.
 * Deals 9 tiles to each player from a freshly shuffled bag.
 * All players start as active regardless of previous round status.
 */
export function createRoundState(
  playerIds: string[],
  playerNames: Record<string, string>,
  distribution: TileDistribution,
  roundNumber: number,
  startingPlayerId: string
): RoundState {
  const bag = createBag(distribution)
  const players: Record<string, PlayerState> = {}

  for (const id of playerIds) {
    const hand = dealHand(bag, 9)
    players[id] = {
      id,
      name: playerNames[id],
      hand,
      score: 0,
      isActive: true,
    }
  }

  return {
    roundNumber,
    currentWord: '',
    currentPlayerId: startingPlayerId,
    activePlayers: [...playerIds],
    players,
    bag,
    turnHistory: [],
  }
}

/**
 * Starts a new round after a round ends.
 * Increments round number, sets winner as starting player.
 * All players (including previously eliminated) get new 9-tile hands (GAME-08).
 */
export function startNextRound(
  prevState: RoundState,
  winnerId: string,
  distribution: TileDistribution
): RoundState {
  const playerIds = Object.keys(prevState.players)
  const playerNames: Record<string, string> = {}
  for (const id of playerIds) {
    playerNames[id] = prevState.players[id].name
  }

  return createRoundState(
    playerIds,
    playerNames,
    distribution,
    prevState.roundNumber + 1,
    winnerId
  )
}
