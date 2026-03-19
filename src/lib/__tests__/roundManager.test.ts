import { describe, it, expect } from 'vitest'
import {
  validateStartingWord,
  eliminatePlayer,
  checkRoundEnd,
  createRoundState,
  startNextRound,
} from '../roundManager'
import type { RoundState } from '../../types/game'

// A minimal mock dictionary covering words we need for tests
const MOCK_DICT = new Set([
  'cat', 'cart', 'dog', 'ace', 'act', 'car', 'bar', 'bat', 'hat', 'rat',
  'mat', 'sat', 'fat', 'pan', 'man', 'can', 'ran', 'tan', 'fan', 'ban',
  'cup', 'pup', 'sup', 'cut', 'but', 'gut', 'hut', 'nut', 'put', 'rut',
  'sea', 'tea', 'pea', 'lea', 'fea',
])

// Helper to build a minimal RoundState for tests
function makeRoundState(overrides: Partial<RoundState> = {}): RoundState {
  return {
    roundNumber: 1,
    currentWord: '',
    currentPlayerId: 'p1',
    activePlayers: ['p1', 'p2', 'p3'],
    players: {
      p1: { id: 'p1', name: 'Alice', hand: ['C','A','T','R','S','E','D','O','G'], score: 0, isActive: true },
      p2: { id: 'p2', name: 'Bob',   hand: ['P','A','N','M','E','L','T','S','I'], score: 0, isActive: true },
      p3: { id: 'p3', name: 'Carol', hand: ['B','A','R','F','O','X','G','H','U'], score: 0, isActive: true },
    },
    bag: [],
    turnHistory: [],
    ...overrides,
  }
}

describe('validateStartingWord', () => {
  it('returns valid:true for any 3-letter dictionary word', () => {
    const hand = ['C', 'A', 'T', 'R', 'S', 'E', 'D', 'O', 'G']
    const result = validateStartingWord('CAT', hand, MOCK_DICT)
    expect(result).toEqual({ valid: true })
  })

  it('returns valid:false reason:not_a_word for XYZ (not in dictionary)', () => {
    const hand = ['X', 'Y', 'Z', 'A', 'B', 'C', 'D', 'E', 'F']
    const result = validateStartingWord('XYZ', hand, MOCK_DICT)
    expect(result).toEqual({ valid: false, reason: 'not_a_word' })
  })

  it('returns valid:false reason:not_in_corpus for words not exactly 3 letters', () => {
    const hand = ['C', 'A', 'R', 'T', 'S', 'E', 'D', 'O', 'G']
    const result = validateStartingWord('CART', hand, MOCK_DICT)
    expect(result).toEqual({ valid: false, reason: 'not_in_corpus' })
  })

  it('returns valid:false reason:letters_unavailable when hand lacks needed letters', () => {
    const hand = ['A', 'T', 'R', 'S', 'E', 'D', 'O', 'G', 'N']
    const result = validateStartingWord('CAT', hand, MOCK_DICT)
    expect(result).toEqual({ valid: false, reason: 'letters_unavailable' })
  })

  it('is case-insensitive for word input', () => {
    const hand = ['C', 'A', 'T', 'R', 'S', 'E', 'D', 'O', 'G']
    expect(validateStartingWord('cat', hand, MOCK_DICT)).toEqual({ valid: true })
  })
})

describe('eliminatePlayer', () => {
  it('removes player from activePlayers', () => {
    const state = makeRoundState()
    const newState = eliminatePlayer(state, 'p2')
    expect(newState.activePlayers).not.toContain('p2')
    expect(newState.activePlayers).toContain('p1')
    expect(newState.activePlayers).toContain('p3')
  })

  it('sets player.isActive to false', () => {
    const state = makeRoundState()
    const newState = eliminatePlayer(state, 'p2')
    expect(newState.players['p2'].isActive).toBe(false)
  })

  it('does not mutate the original state', () => {
    const state = makeRoundState()
    eliminatePlayer(state, 'p2')
    expect(state.activePlayers).toContain('p2')
    expect(state.players['p2'].isActive).toBe(true)
  })
})

describe('checkRoundEnd', () => {
  it('returns over:false when 2+ players are active', () => {
    const state = makeRoundState()
    expect(checkRoundEnd(state)).toEqual({ over: false })
  })

  it('returns over:true with winnerId when exactly 1 player is active', () => {
    const state = makeRoundState({ activePlayers: ['p1'] })
    expect(checkRoundEnd(state)).toEqual({ over: true, winnerId: 'p1' })
  })

  it('returns over:false when 0 players active (edge case)', () => {
    const state = makeRoundState({ activePlayers: [] })
    expect(checkRoundEnd(state)).toEqual({ over: false })
  })
})

describe('createRoundState', () => {
  const playerIds = ['p1', 'p2', 'p3']
  const playerNames = { p1: 'Alice', p2: 'Bob', p3: 'Carol' }

  it('creates round with correct roundNumber', () => {
    const state = createRoundState(playerIds, playerNames, 'bananagrams', 1, 'p1')
    expect(state.roundNumber).toBe(1)
  })

  it('sets currentWord to empty string', () => {
    const state = createRoundState(playerIds, playerNames, 'bananagrams', 1, 'p1')
    expect(state.currentWord).toBe('')
  })

  it('sets currentPlayerId to startingPlayerId', () => {
    const state = createRoundState(playerIds, playerNames, 'bananagrams', 1, 'p2')
    expect(state.currentPlayerId).toBe('p2')
  })

  it('all players are active at round start', () => {
    const state = createRoundState(playerIds, playerNames, 'bananagrams', 1, 'p1')
    expect(state.activePlayers).toEqual(playerIds)
    for (const id of playerIds) {
      expect(state.players[id].isActive).toBe(true)
    }
  })

  it('each player gets exactly 9 tiles (GAME-08)', () => {
    const state = createRoundState(playerIds, playerNames, 'bananagrams', 1, 'p1')
    for (const id of playerIds) {
      expect(state.players[id].hand.length).toBe(9)
    }
  })

  it('initializes empty turnHistory', () => {
    const state = createRoundState(playerIds, playerNames, 'bananagrams', 1, 'p1')
    expect(state.turnHistory).toEqual([])
  })
})

describe('startNextRound', () => {
  it('increments round number', () => {
    const prev = makeRoundState({ roundNumber: 1 })
    const next = startNextRound(prev, 'p1', 'bananagrams')
    expect(next.roundNumber).toBe(2)
  })

  it('sets winner as starting player', () => {
    const prev = makeRoundState()
    const next = startNextRound(prev, 'p2', 'bananagrams')
    expect(next.currentPlayerId).toBe('p2')
  })

  it('all players get new 9-tile hands including previously eliminated (GAME-08)', () => {
    // Simulate p3 was eliminated in prev round
    const prev = makeRoundState({
      activePlayers: ['p1', 'p2'],
      players: {
        p1: { id: 'p1', name: 'Alice', hand: ['A'], score: 5, isActive: true },
        p2: { id: 'p2', name: 'Bob',   hand: ['B'], score: 3, isActive: true },
        p3: { id: 'p3', name: 'Carol', hand: [], score: 0, isActive: false },
      },
    })
    const next = startNextRound(prev, 'p1', 'bananagrams')
    // All players (including p3) should have fresh 9-tile hands
    expect(next.players['p1'].hand.length).toBe(9)
    expect(next.players['p2'].hand.length).toBe(9)
    expect(next.players['p3'].hand.length).toBe(9)
  })

  it('resets all players to active', () => {
    const prev = makeRoundState({
      activePlayers: ['p1', 'p2'],
      players: {
        p1: { id: 'p1', name: 'Alice', hand: ['A'], score: 5, isActive: true },
        p2: { id: 'p2', name: 'Bob',   hand: ['B'], score: 3, isActive: true },
        p3: { id: 'p3', name: 'Carol', hand: [], score: 0, isActive: false },
      },
    })
    const next = startNextRound(prev, 'p1', 'bananagrams')
    expect(next.players['p3'].isActive).toBe(true)
    expect(next.activePlayers).toContain('p3')
  })

  it('resets currentWord to empty', () => {
    const prev = makeRoundState({ currentWord: 'CATS' })
    const next = startNextRound(prev, 'p1', 'bananagrams')
    expect(next.currentWord).toBe('')
  })

  it('resets turnHistory to empty', () => {
    const prev = makeRoundState({
      turnHistory: [{ playerId: 'p1', word: 'CAT', score: 3 }],
    })
    const next = startNextRound(prev, 'p1', 'bananagrams')
    expect(next.turnHistory).toEqual([])
  })
})
