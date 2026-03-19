import { describe, it, expect } from 'vitest'
import { gameReducer, createInitialGameState } from '../gameReducer'
import type { GameConfig, GameState, GameAction } from '../../types/game'

/** Assert reducer result is non-null and return typed GameState */
function reduce(state: GameState, action: GameAction): GameState {
  const result = gameReducer(state, action)
  expect(result).not.toBeNull()
  return result as GameState
}

// Small controlled dictionary for tests
const MOCK_DICT = new Set([
  'cat', 'cart', 'carts', 'scat', 'trace', 'crate',
  'act', 'car', 'bar', 'bat', 'rat', 'arc',
  'race', 'care', 'core', 'score', 'store', 'stare',
])

const BASE_CONFIG: GameConfig = {
  difficulty: 'easy',
  banPluralS: false,
  tileDistribution: 'bananagrams',
  dictionary: MOCK_DICT,
  gameMode: 'ai',
}

// Helper: build a base GameState manually (bypasses createInitialGameState for controlled tests)
function makeGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    phase: 'HUMAN_TURN',
    config: BASE_CONFIG,
    roundScores: { human: 0, ai: 0 },
    totalScores: { human: 0, ai: 0 },
    hintUsed: false,
    round: {
      roundNumber: 1,
      currentWord: 'CAT',
      currentPlayerId: 'human',
      activePlayers: ['human', 'ai'],
      players: {
        human: { id: 'human', name: 'Player', hand: ['R', 'S', 'E', 'D', 'O', 'N', 'L', 'P', 'M'], score: 0, isActive: true },
        ai:    { id: 'ai',    name: 'AI',     hand: ['R', 'A', 'C', 'E', 'S', 'T', 'O', 'N', 'L'], score: 0, isActive: true },
      },
      bag: ['B', 'A', 'T', 'S', 'E', 'R'],
      turnHistory: [],
    },
    ...overrides,
  }
}

// --- createInitialGameState ---

describe('createInitialGameState', () => {
  it('creates state with phase SETUP', () => {
    const state = createInitialGameState(BASE_CONFIG)
    expect(state.phase).toBe('SETUP')
  })

  it('creates two players: human and ai', () => {
    const state = createInitialGameState(BASE_CONFIG)
    expect(Object.keys(state.round.players)).toContain('human')
    expect(Object.keys(state.round.players)).toContain('ai')
  })

  it('initializes totalScores and roundScores to zero for both players', () => {
    const state = createInitialGameState(BASE_CONFIG)
    expect(state.totalScores.human).toBe(0)
    expect(state.totalScores.ai).toBe(0)
    expect(state.roundScores.human).toBe(0)
    expect(state.roundScores.ai).toBe(0)
  })

  it('each player starts with 9 tiles', () => {
    const state = createInitialGameState(BASE_CONFIG)
    expect(state.round.players.human.hand.length).toBe(9)
    expect(state.round.players.ai.hand.length).toBe(9)
  })
})

// --- SUBMIT_STARTING_WORD ---

describe('SUBMIT_STARTING_WORD', () => {
  it('transitions to AI_THINKING when human submits valid starting word (ai goes next)', () => {
    // Build SETUP state with human as current player and AI next
    const state: GameState = {
      ...makeGameState(),
      phase: 'SETUP',
      round: {
        ...makeGameState().round,
        currentWord: '',
        currentPlayerId: 'human',
        // Human has CAT letters + filler
        players: {
          human: { id: 'human', name: 'Player', hand: ['C', 'A', 'T', 'R', 'S', 'E', 'D', 'O', 'G'], score: 0, isActive: true },
          ai:    { id: 'ai',    name: 'AI',     hand: ['C', 'A', 'T', 'R', 'S', 'E', 'D', 'O', 'G'], score: 0, isActive: true },
        },
        bag: ['B', 'X', 'Y', 'Z', 'W', 'V'],
      },
    }
    const action: GameAction = { type: 'SUBMIT_STARTING_WORD', playerId: 'human', word: 'CAT' }
    const next = reduce(state, action)
    // After human submits, ai goes next => AI_THINKING
    expect(next.phase).toBe('AI_THINKING')
    expect(next.round.currentWord).toBe('CAT')
  })

  it('removes used letters from player hand and draws back to 9', () => {
    const state: GameState = {
      ...makeGameState(),
      phase: 'SETUP',
      round: {
        ...makeGameState().round,
        currentWord: '',
        currentPlayerId: 'human',
        players: {
          human: { id: 'human', name: 'Player', hand: ['C', 'A', 'T', 'R', 'S', 'E', 'D', 'O', 'G'], score: 0, isActive: true },
          ai:    { id: 'ai',    name: 'AI',     hand: ['C', 'A', 'T', 'R', 'S', 'E', 'D', 'O', 'G'], score: 0, isActive: true },
        },
        bag: ['B', 'X', 'Y', 'Z', 'W', 'V'],
      },
    }
    const action: GameAction = { type: 'SUBMIT_STARTING_WORD', playerId: 'human', word: 'CAT' }
    const next = reduce(state, action)
    // Human played CAT (3 letters), draws 3 back to reach 9
    expect(next.round.players.human.hand.length).toBe(9)
  })

  it('returns unchanged state when phase is not SETUP', () => {
    const state = makeGameState({ phase: 'HUMAN_TURN' })
    const action: GameAction = { type: 'SUBMIT_STARTING_WORD', playerId: 'human', word: 'CAT' }
    const next = reduce(state, action)
    expect(next).toBe(state)
  })

  it('returns unchanged state when starting word is invalid (not in corpus)', () => {
    const state: GameState = {
      ...makeGameState(),
      phase: 'SETUP',
      round: {
        ...makeGameState().round,
        currentWord: '',
        currentPlayerId: 'human',
        players: {
          human: { id: 'human', name: 'Player', hand: ['X', 'Y', 'Z', 'R', 'S', 'E', 'D', 'O', 'G'], score: 0, isActive: true },
          ai:    { id: 'ai',    name: 'AI',     hand: ['C', 'A', 'T', 'R', 'S', 'E', 'D', 'O', 'G'], score: 0, isActive: true },
        },
        bag: [],
      },
    }
    const action: GameAction = { type: 'SUBMIT_STARTING_WORD', playerId: 'human', word: 'XYZ' }
    const next = reduce(state, action)
    expect(next).toBe(state)
  })
})

// --- SUBMIT_WORD ---

describe('SUBMIT_WORD from HUMAN_TURN', () => {
  it('transitions to AI_THINKING after valid human submission', () => {
    // human has 'R' in hand (to make CART from CAT)
    const state = makeGameState({
      phase: 'HUMAN_TURN',
      round: {
        ...makeGameState().round,
        currentWord: 'CAT',
        currentPlayerId: 'human',
        players: {
          human: { id: 'human', name: 'Player', hand: ['R', 'S', 'E', 'D', 'O', 'N', 'L', 'P', 'M'], score: 0, isActive: true },
          ai:    { id: 'ai',    name: 'AI',     hand: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'], score: 0, isActive: true },
        },
        bag: ['X', 'Y', 'Z'],
      },
    })
    const action: GameAction = { type: 'SUBMIT_WORD', playerId: 'human', word: 'CART' }
    const next = reduce(state, action)
    expect(next.phase).toBe('AI_THINKING')
    expect(next.round.currentPlayerId).toBe('ai')
    expect(next.round.currentWord).toBe('CART')
  })

  it('updates player score by scoreWord amount', () => {
    const state = makeGameState({
      phase: 'HUMAN_TURN',
      round: {
        ...makeGameState().round,
        currentWord: 'CAT',
        currentPlayerId: 'human',
        players: {
          human: { id: 'human', name: 'Player', hand: ['R', 'S', 'E', 'D', 'O', 'N', 'L', 'P', 'M'], score: 0, isActive: true },
          ai:    { id: 'ai',    name: 'AI',     hand: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'], score: 0, isActive: true },
        },
        bag: ['X', 'Y', 'Z'],
      },
    })
    const action: GameAction = { type: 'SUBMIT_WORD', playerId: 'human', word: 'CART' }
    const next = reduce(state, action)
    // CART = 4 points (length) + 0 bonus = 4
    expect(next.round.players.human.score).toBe(4)
  })

  it('appends to turnHistory', () => {
    const state = makeGameState({
      phase: 'HUMAN_TURN',
      round: {
        ...makeGameState().round,
        currentWord: 'CAT',
        currentPlayerId: 'human',
        players: {
          human: { id: 'human', name: 'Player', hand: ['R', 'S', 'E', 'D', 'O', 'N', 'L', 'P', 'M'], score: 0, isActive: true },
          ai:    { id: 'ai',    name: 'AI',     hand: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'], score: 0, isActive: true },
        },
        bag: ['X', 'Y', 'Z'],
      },
    })
    const action: GameAction = { type: 'SUBMIT_WORD', playerId: 'human', word: 'CART' }
    const next = reduce(state, action)
    expect(next.round.turnHistory).toHaveLength(1)
    expect(next.round.turnHistory[0]).toMatchObject({ playerId: 'human', word: 'CART', score: 4 })
  })

  it('removes used tile from hand then draws back to 9', () => {
    const state = makeGameState({
      phase: 'HUMAN_TURN',
      round: {
        ...makeGameState().round,
        currentWord: 'CAT',
        currentPlayerId: 'human',
        players: {
          human: { id: 'human', name: 'Player', hand: ['R', 'S', 'E', 'D', 'O', 'N', 'L', 'P', 'M'], score: 0, isActive: true },
          ai:    { id: 'ai',    name: 'AI',     hand: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'], score: 0, isActive: true },
        },
        bag: ['X', 'Y', 'Z'],
      },
    })
    const action: GameAction = { type: 'SUBMIT_WORD', playerId: 'human', word: 'CART' }
    const next = reduce(state, action)
    // Hand was 9, used 1 'R', draw 1 from bag => still 9
    expect(next.round.players.human.hand.length).toBe(9)
    // The used 'R' should no longer be there if it was the only R
    // Original hand had exactly 1 R; after consuming it and drawing 1 bag tile, count is same
  })

  it('returns unchanged state when word is invalid', () => {
    const state = makeGameState({ phase: 'HUMAN_TURN' })
    const action: GameAction = { type: 'SUBMIT_WORD', playerId: 'human', word: 'XYZZY' }
    const next = reduce(state, action)
    expect(next).toBe(state)
  })

  it('returns unchanged state when called from wrong phase', () => {
    const state = makeGameState({ phase: 'SETUP' })
    const action: GameAction = { type: 'SUBMIT_WORD', playerId: 'human', word: 'CART' }
    const next = reduce(state, action)
    expect(next).toBe(state)
  })
})

describe('SUBMIT_WORD from AI_THINKING', () => {
  it('transitions to HUMAN_TURN after valid AI submission', () => {
    // ai is playing, has 'S' to make CARTS from CART
    const state = makeGameState({
      phase: 'AI_THINKING',
      round: {
        ...makeGameState().round,
        currentWord: 'CART',
        currentPlayerId: 'ai',
        players: {
          human: { id: 'human', name: 'Player', hand: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'], score: 0, isActive: true },
          ai:    { id: 'ai',    name: 'AI',     hand: ['S', 'E', 'O', 'N', 'L', 'P', 'M', 'U', 'D'], score: 0, isActive: true },
        },
        bag: ['X', 'Y'],
      },
    })
    const action: GameAction = { type: 'SUBMIT_WORD', playerId: 'ai', word: 'CARTS' }
    const next = reduce(state, action)
    expect(next.phase).toBe('HUMAN_TURN')
    expect(next.round.currentPlayerId).toBe('human')
  })

  it('returns unchanged state when called from wrong phase (ROUND_END)', () => {
    const action: GameAction = { type: 'SUBMIT_WORD', playerId: 'ai', word: 'CART' }
    const stateRoundEnd = makeGameState({ phase: 'ROUND_END' })
    const next = reduce(stateRoundEnd, action)
    expect(next).toBe(stateRoundEnd)
  })
})

// --- ELIMINATE_PLAYER ---

describe('ELIMINATE_PLAYER', () => {
  it('removes player from activePlayers', () => {
    const state = makeGameState()
    const action: GameAction = { type: 'ELIMINATE_PLAYER', playerId: 'ai' }
    const next = reduce(state, action)
    expect(next.round.activePlayers).not.toContain('ai')
  })

  it('transitions to ROUND_END when one player remains', () => {
    const state = makeGameState()
    const action: GameAction = { type: 'ELIMINATE_PLAYER', playerId: 'ai' }
    const next = reduce(state, action)
    // Only 'human' left
    expect(next.phase).toBe('ROUND_END')
  })

  it('does not transition to ROUND_END if multiple players remain', () => {
    const state = makeGameState({
      round: {
        ...makeGameState().round,
        activePlayers: ['human', 'ai', 'extra'],
        players: {
          human: { id: 'human', name: 'Player', hand: [], score: 0, isActive: true },
          ai:    { id: 'ai',    name: 'AI',     hand: [], score: 0, isActive: true },
          extra: { id: 'extra', name: 'Extra',  hand: [], score: 0, isActive: true },
        },
      },
    })
    const action: GameAction = { type: 'ELIMINATE_PLAYER', playerId: 'extra' }
    const next = reduce(state, action)
    expect(next.phase).toBe('HUMAN_TURN') // unchanged phase (still 2 players left)
    expect(next.round.activePlayers).toHaveLength(2)
  })
})

// --- END_ROUND ---

describe('END_ROUND', () => {
  it('accumulates roundScores into totalScores', () => {
    const state = makeGameState({
      phase: 'ROUND_END',
      totalScores: { human: 10, ai: 5 },
      round: {
        ...makeGameState().round,
        turnHistory: [
          { playerId: 'human', word: 'CART', score: 4 },
          { playerId: 'ai', word: 'CARTS', score: 5 },
          { playerId: 'human', word: 'CARTS', score: 5 },
        ],
      },
    })
    const action: GameAction = { type: 'END_ROUND' }
    const next = reduce(state, action)
    // human earned 4+5=9 this round, totalScores was 10 => 19
    expect(next.totalScores.human).toBe(10 + 4 + 5)
    // ai earned 5 this round, totalScores was 5 => 10
    expect(next.totalScores.ai).toBe(5 + 5)
    // roundScores should reflect this round's earnings
    expect(next.roundScores.human).toBe(9)
    expect(next.roundScores.ai).toBe(5)
  })

  it('returns unchanged state when phase is not ROUND_END', () => {
    const state = makeGameState({ phase: 'HUMAN_TURN' })
    const action: GameAction = { type: 'END_ROUND' }
    const next = reduce(state, action)
    expect(next).toBe(state)
  })
})

// --- NEXT_ROUND ---

describe('NEXT_ROUND', () => {
  it('resets phase to SETUP', () => {
    const state = makeGameState({ phase: 'ROUND_END' })
    const action: GameAction = { type: 'NEXT_ROUND', winnerId: 'human' }
    const next = reduce(state, action)
    expect(next.phase).toBe('SETUP')
  })

  it('creates a fresh round with incremented roundNumber', () => {
    const state = makeGameState({ phase: 'ROUND_END' })
    const action: GameAction = { type: 'NEXT_ROUND', winnerId: 'human' }
    const next = reduce(state, action)
    expect(next.round.roundNumber).toBe(2)
  })

  it('preserves totalScores across rounds', () => {
    const state = makeGameState({
      phase: 'ROUND_END',
      totalScores: { human: 15, ai: 8 },
    })
    const action: GameAction = { type: 'NEXT_ROUND', winnerId: 'human' }
    const next = reduce(state, action)
    expect(next.totalScores.human).toBe(15)
    expect(next.totalScores.ai).toBe(8)
  })

  it('returns unchanged state when phase is not ROUND_END', () => {
    const state = makeGameState({ phase: 'HUMAN_TURN' })
    const action: GameAction = { type: 'NEXT_ROUND', winnerId: 'human' }
    const next = reduce(state, action)
    expect(next).toBe(state)
  })
})

// --- RESET_GAME ---

describe('RESET_GAME', () => {
  it('returns null (initial state signals store to clear)', () => {
    const state = makeGameState()
    const result = gameReducer(state, { type: 'RESET_GAME' })
    expect(result).toBeNull()
  })
})

// --- Integration: Full round lifecycle ---

describe('Integration: full round lifecycle', () => {
  it('completes SETUP -> starting word -> human turn -> AI turn without illegal transition', () => {
    // Start fresh
    const initState = createInitialGameState(BASE_CONFIG)
    expect(initState.phase).toBe('SETUP')

    // Override hands for deterministic test: human goes first with CAT letters
    const setupState: GameState = {
      ...initState,
      round: {
        ...initState.round,
        currentPlayerId: 'human',
        players: {
          human: { id: 'human', name: 'Player', hand: ['C', 'A', 'T', 'R', 'S', 'E', 'D', 'O', 'G'], score: 0, isActive: true },
          ai:    { id: 'ai',    name: 'AI',     hand: ['S', 'E', 'O', 'N', 'L', 'P', 'M', 'U', 'D'], score: 0, isActive: true },
        },
        bag: ['B', 'X', 'Y', 'Z', 'W', 'V', 'A', 'R'],
      },
    }

    // Human submits starting word CAT
    const afterStart = reduce(setupState, { type: 'SUBMIT_STARTING_WORD', playerId: 'human', word: 'CAT' })
    expect(afterStart.phase).toBe('AI_THINKING')
    expect(afterStart.round.currentWord).toBe('CAT')

    // AI submits CART (adds R from its hand)
    // AI needs R in hand - put it there
    const stateForAI: GameState = {
      ...afterStart,
      round: {
        ...afterStart.round,
        players: {
          ...afterStart.round.players,
          ai: { ...afterStart.round.players.ai, hand: ['R', 'E', 'O', 'N', 'L', 'P', 'M', 'U', 'D'] },
        },
      },
    }
    const afterAI = reduce(stateForAI, { type: 'SUBMIT_WORD', playerId: 'ai', word: 'CART' })
    expect(afterAI.phase).toBe('HUMAN_TURN')
    expect(afterAI.round.currentWord).toBe('CART')

    // Eliminate AI
    const afterElim = reduce(afterAI, { type: 'ELIMINATE_PLAYER', playerId: 'ai' })
    expect(afterElim.phase).toBe('ROUND_END')

    // End round
    const afterEndRound = reduce(afterElim, { type: 'END_ROUND' })
    expect(afterEndRound.roundScores).toBeDefined()

    // Next round
    const afterNextRound = reduce(afterEndRound, { type: 'NEXT_ROUND', winnerId: 'human' })
    expect(afterNextRound.phase).toBe('SETUP')
    expect(afterNextRound.round.roundNumber).toBe(2)
  })
})
