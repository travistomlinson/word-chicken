import type { TileDistribution } from '../lib/tileBag'

export type ValidationConfig = {
  banPluralS: boolean
}

export type WordValidationResult =
  | { valid: true }
  | { valid: false; reason: 'not_a_word' | 'letters_unavailable' }

export type TurnValidationResult =
  | { valid: true }
  | { valid: false; reason: 'not_a_word' | 'letter_not_in_hand' | 'not_a_superset' | 'plural_banned' }

export interface PlayerState {
  id: string
  name: string
  hand: string[]
  score: number
  isActive: boolean
}

export interface RoundState {
  roundNumber: number
  currentWord: string
  currentPlayerId: string
  activePlayers: string[]  // player IDs
  players: Record<string, PlayerState>
  bag: string[]
  turnHistory: Array<{ playerId: string; word: string; score: number }>
}

export type StartingWordResult =
  | { valid: true }
  | { valid: false; reason: 'not_a_word' | 'not_in_corpus' | 'letters_unavailable' }

export type RoundEndResult =
  | { over: true; winnerId: string }
  | { over: false }

// --- FSM types added in Phase 3 ---

export type TurnPhase = 'SETUP' | 'HUMAN_TURN' | 'AI_THINKING' | 'ROUND_END' | 'GAME_OVER'

export interface GameConfig {
  difficulty: 'easy' | 'medium' | 'hard'
  banPluralS: boolean
  tileDistribution: TileDistribution
  dictionary: Set<string>
}

export interface GameState {
  phase: TurnPhase
  round: RoundState
  config: GameConfig
  roundScores: Record<string, number>
  totalScores: Record<string, number>
  hintUsed: boolean
}

export type GameAction =
  | { type: 'START_GAME'; config: GameConfig }
  | { type: 'SUBMIT_STARTING_WORD'; playerId: string; word: string }
  | { type: 'SUBMIT_WORD'; playerId: string; word: string }
  | { type: 'ELIMINATE_PLAYER'; playerId: string }
  | { type: 'END_ROUND' }
  | { type: 'NEXT_ROUND'; winnerId: string }
  | { type: 'USE_HINT' }
  | { type: 'AI_TURN_START' }
  | { type: 'RESET_GAME' }
