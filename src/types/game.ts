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
