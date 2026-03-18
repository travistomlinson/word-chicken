export type ValidationConfig = {
  banPluralS: boolean
}

export type WordValidationResult =
  | { valid: true }
  | { valid: false; reason: 'not_a_word' | 'letters_unavailable' }

export type TurnValidationResult =
  | { valid: true }
  | { valid: false; reason: 'not_a_word' | 'letter_not_in_hand' | 'not_a_superset' | 'plural_banned' }
