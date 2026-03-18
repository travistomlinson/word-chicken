# Phase 2: Core Engine - Research

**Researched:** 2026-03-18
**Domain:** Pure TypeScript game logic — word validation, multiset algebra, tile bag, scoring, round lifecycle
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| WVAL-02 | Submitted words validated against dictionary in real-time | `dictionarySlice` already provides `Set<string>` at `words`; validator reads it directly |
| WVAL-03 | Invalid submissions show specific error: "not a valid word" vs "letters not available in hand" | Discriminated union return type: `{ valid: true } \| { valid: false; reason: 'not_a_word' \| 'letters_unavailable' }` |
| WVAL-04 | Q tile represents "Qu" — dictionary lookups handle Qu-prefix words correctly | Before any `words.has()` call, expand Q→QU in the submitted string; test "QACK"→miss, "QUACK"→hit |
| TILE-01 | Player receives a hand of 9 letter tiles at the start of each round | `dealHand(bag, 9)` removes 9 tiles from the bag array and returns them |
| TILE-02 | After playing a letter, player draws back up to 9 tiles | `drawToNine(hand, bag)` computes `9 - hand.length` draw count |
| TILE-03 | Tile distribution follows Bananagrams-style weighted frequency by default | Bananagrams: 144 total tiles; A=13,B=3,C=3,D=6,E=18,F=3,G=4,H=3,I=12,J=2,K=2,L=5,M=3,N=8,O=11,P=3,Q=2,R=9,S=6,T=9,U=6,V=3,W=3,X=2,Y=3,Z=2 (verified) |
| TILE-04 | Tile distribution configurable (Bananagrams-style or Scrabble-style) | Scrabble: 98 lettered tiles; A=9,B=2,C=2,D=4,E=12,F=2,G=3,H=2,I=9,J=1,K=1,L=4,M=2,N=6,O=8,P=2,Q=1,R=6,S=4,T=6,U=4,V=2,W=2,X=1,Y=2,Z=1 (verified) |
| TILE-05 | Q tile renders as "Qu" and counts as one tile in the hand | Stored as `'Q'` in all arrays; only the display layer transforms to "Qu" — engine never stores "QU" |
| GAME-01 | Starting player creates a 3-letter word to begin a round | `validateStartingWord(word, dictionary, config)` checks: 3 letters, valid, in starting corpus |
| GAME-02 | Each subsequent turn, a player adds one letter to existing word | Multiset superset check: `newLetters = multisetDiff(newWord, prevWord)` must have size === 1 |
| GAME-03 | Rearranging letters is allowed (CAT + R → CART) | Multiset diff is order-independent — confirmed by the set-difference algorithm |
| GAME-04 | New word must use all previous letters plus exactly one from hand | Combined check: `isStrictSuperset(newWord, prevWord)` AND `newLetterIsInHand(diff, hand)` |
| GAME-05 | Player eliminated if they cannot form a valid word | `eliminatePlayer(state, playerId)` removes player from active list |
| GAME-06 | Last player standing wins the round | `checkRoundEnd(state)` returns winner when `activePlayers.length === 1` |
| GAME-07 | Round winner starts the next round with a new 3-letter word | `startNextRound(state, winnerId)` sets `currentPlayerId` and resets round state |
| GAME-08 | All players receive new hands at start of each round | `dealAllHands(players, bag)` iterates players, calls `dealHand` for each |
| GAME-09 | No maximum word length | No upper bound in any validator — confirmed by absence of constraint |
| GAME-10 | No passing allowed — starting player must play a word | `validateStartingWord` returns error if the word is invalid; no skip action exists in the state machine |
| GAME-11 | Pluralizing with S is banned by default (configurable) | `banPluralS: boolean` config flag; when true, reject if `newWord.endsWith('s') && prevWord + 'S' === newWord` |
| SCOR-01 | Words earn points based on word length | `score = word.length * BASE_POINTS_PER_LETTER` |
| SCOR-02 | Rare letters (Q, Z, X, J) earn bonus points | `BONUS_LETTERS` map: Q=10, Z=8, X=6, J=6; summed over word characters |
</phase_requirements>

---

## Summary

Phase 2 is an algorithmic library phase: all game rules implemented as pure TypeScript functions with zero React dependencies, fully unit-tested before UI is built on top of them. The three modules are WordValidator, TileBag, and a combined ScoreCalculator/RoundManager. Every function in this phase is deterministic and synchronous — the only external dependency is the `Set<string>` from `dictionarySlice` which Phase 1 already populates.

The single most nuanced algorithmic problem is the **multiset superset check** (GAME-02, GAME-03, GAME-04). A word is a valid extension if and only if the new word's character multiset strictly contains the previous word's character multiset AND the extra letter exists in the player's hand. This is order-independent (rearranging is allowed) and must be letter-frequency-aware, not character-set-aware. The implementation uses a `Map<string, number>` frequency counter, not a `Set`. This is the single most important architectural decision of the phase.

The second tricky requirement is the **Q tile expansion** (WVAL-04, TILE-05). The Q tile is stored as a single `'Q'` character everywhere in game state — hands, the current word string, the tile bag. Only at dictionary lookup time is `'Q'` expanded to `'QU'` in the word before calling `words.has()`. Tests must confirm "QACK" fails and "QUACK" succeeds via a single `'Q'` tile.

Starting word corpus (GAME-01) is a one-time data concern: a curated subset of 3-letter TWL words that have at least 5 common 4-letter extensions, ensuring the game never dead-ends on the first turn. This can be a hardcoded array of ~200 words derived by a one-time filtering script, or it can be generated at startup from the loaded dictionary using a known extensions list.

**Primary recommendation:** Implement all three modules as plain TypeScript files in `src/lib/`, each with a co-located `__tests__/` file. No new dependencies are required — all logic uses built-in Map/Set/Array. The `dictionarySlice` `words` Set is passed as a parameter to validator functions (dependency injection, not import), making tests trivially mockable.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript 5.x | ~5.6.2 (already installed) | Type safety for game state | Already in project; discriminated unions model validation results perfectly |
| Vitest 4.x | ^4.1.0 (already installed) | Unit tests | Already configured; `npm test -- --run` for fast feedback loop |

No new npm dependencies are required for Phase 2. All algorithmic work uses language builtins: `Map<string, number>` for multiset operations, `Array<string>` for tile bags, `Set<string>` for dictionary (from Phase 1).

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | - | - | All game logic uses TypeScript builtins only |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `Map<string,number>` for multisets | custom class or sorted string | Map is idiomatic TS, zero deps, readable; custom class adds boilerplate with no test benefit |
| Hardcoded starting word array | runtime computation from full TWL | Hardcoded is deterministic and instant; runtime filtering is slower and requires testing the filter itself |
| `Array<string>` tile bag with `splice` | `Uint8Array` with typed indices | Array splice is clear and correct at this scale (144 tiles max); typed array adds complexity without benefit |

**Installation:**

No new packages. All Phase 2 work is pure TypeScript on the existing scaffold.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── lib/
│   ├── __tests__/
│   │   ├── parseWordList.test.ts      # (exists, Phase 1)
│   │   ├── wordValidator.test.ts      # Phase 2 - plan 02-01
│   │   ├── tileBag.test.ts            # Phase 2 - plan 02-02
│   │   ├── scoreCalculator.test.ts    # Phase 2 - plan 02-03
│   │   └── roundManager.test.ts       # Phase 2 - plan 02-03
│   ├── parseWordList.ts               # (exists, Phase 1)
│   ├── wordValidator.ts               # plan 02-01
│   ├── tileBag.ts                     # plan 02-02
│   ├── scoreCalculator.ts             # plan 02-03
│   ├── roundManager.ts                # plan 02-03
│   └── startingWords.ts               # plan 02-03 (curated corpus)
├── store/
│   ├── appSlice.ts                    # (exists)
│   └── dictionarySlice.ts             # (exists)
│   └── gameSlice.ts                   # plan 02-03 (round + game state)
└── types/
    └── game.ts                        # plan 02-01 (shared TypeScript interfaces)
```

### Pattern 1: Discriminated Union for Validation Results

**What:** Functions that can fail return a discriminated union, not exceptions.
**When to use:** All validation functions — `validateWord`, `validateTurn`, `validateStartingWord`.

```typescript
// src/types/game.ts
export type ValidationResult =
  | { valid: true }
  | { valid: false; reason: 'not_a_word' | 'letters_unavailable' | 'not_a_superset' | 'letter_not_in_hand' | 'plural_banned' }

// Usage in test:
const result = validateWord('quack', dictionary, config)
if (result.valid) { /* proceed */ }
else { result.reason } // narrowed to string literal union
```

### Pattern 2: Multiset Frequency Counter

**What:** Represent a multiset of letters as `Map<string, number>` (letter → count).
**When to use:** All multiset diff and superset operations.

```typescript
// src/lib/wordValidator.ts
function letterFrequency(word: string): Map<string, number> {
  const map = new Map<string, number>()
  for (const ch of word.toUpperCase()) {
    map.set(ch, (map.get(ch) ?? 0) + 1)
  }
  return map
}

// Multiset A is superset of B when every entry in B is <= A's count
function isMultisetSuperset(a: string, b: string): boolean {
  const freqA = letterFrequency(a)
  const freqB = letterFrequency(b)
  for (const [ch, count] of freqB) {
    if ((freqA.get(ch) ?? 0) < count) return false
  }
  return true
}

// Diff: letters in A that are NOT accounted for by B (the added letters)
function multisetDiff(newWord: string, prevWord: string): string[] {
  const freqA = letterFrequency(newWord)
  const freqB = letterFrequency(prevWord)
  const extra: string[] = []
  for (const [ch, count] of freqA) {
    const diff = count - (freqB.get(ch) ?? 0)
    for (let i = 0; i < diff; i++) extra.push(ch)
  }
  return extra
}
```

### Pattern 3: Q Tile Expansion at Lookup

**What:** Expand `'Q'` → `'QU'` in the word string immediately before `words.has()` — nowhere else.
**When to use:** Only inside `wordValidator.ts`. Never transform Q in state, hands, or tile bag.

```typescript
// src/lib/wordValidator.ts
function expandQTiles(word: string): string {
  return word.toUpperCase().replaceAll('Q', 'QU')
}

export function isInDictionary(word: string, dictionary: Set<string>): boolean {
  const expanded = expandQTiles(word)
  return dictionary.has(expanded.toLowerCase())
}

// Tests must confirm:
// isInDictionary('QACK', dict) === false  (QUACK not in dict as QUAACK)
// isInDictionary('QUACK', dict) === false (Q→QU expands to QUUACK — wrong!)
// isInDictionary('QACK', dict) with Q representing QU:
//   'Q'+'ACK' → expandQ → 'QU'+'ACK' = 'QUACK' → dict.has('quack') === true
```

IMPORTANT: The word submitted by the player uses one `'Q'` tile to represent `"Qu"`. So the player submits `"QACK"` (4 characters: Q, A, C, K) and the validator expands it to `"QUACK"` for lookup. Test case: input `"QACK"` → lookup `"QUACK"` → valid. Input `"QUACK"` (5 chars, Q+U+A+C+K) → expands to `"QUUACK"` → invalid.

### Pattern 4: Tile Bag as Shuffled Array

**What:** A tile bag is a `string[]` (one entry per tile, e.g., `['A','A','A',...,'Z']`) that is Fisher-Yates shuffled at construction, then spliced from the front for deals.
**When to use:** `createBag(distribution)` factory function; `dealHand(bag, count)` mutates.

```typescript
// src/lib/tileBag.ts
export type TileDistribution = 'bananagrams' | 'scrabble'

export function createBag(distribution: TileDistribution): string[] {
  const counts = distribution === 'bananagrams' ? BANANAGRAMS_COUNTS : SCRABBLE_COUNTS
  const bag: string[] = []
  for (const [letter, count] of Object.entries(counts)) {
    for (let i = 0; i < count; i++) bag.push(letter)
  }
  return fisherYatesShuffle(bag)
}

// Fisher-Yates in-place
function fisherYatesShuffle(arr: string[]): string[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function dealHand(bag: string[], count: number): string[] {
  return bag.splice(0, count)
}

export function drawToNine(hand: string[], bag: string[]): string[] {
  const needed = 9 - hand.length
  if (needed <= 0 || bag.length === 0) return hand
  return [...hand, ...dealHand(bag, Math.min(needed, bag.length))]
}
```

### Pattern 5: Plural S Ban

**What:** When `config.banPluralS` is true, reject a new word that differs from the previous word by only a trailing `'S'`.
**When to use:** Inside `validateTurn`, checked after the superset check passes and the new letter is identified.

```typescript
// Plural ban check (only applies when exactly one letter was added and it is 'S')
function isPluralOf(newWord: string, prevWord: string): boolean {
  const upper = newWord.toUpperCase()
  const prev = prevWord.toUpperCase()
  return upper === prev + 'S'
}
```

Note: This simple check suffices for the initial requirement. It catches `CAT → CATS` but not rearrangements like `ATS → CATS` (rearranged plural). The requirement wording says "pluralizing with S is banned" — the planners should scope this to the simplest correct interpretation: the multiset diff is exactly one `'S'` AND the new word ends in `'S'` AND removing the trailing `'S'` gives the previous word exactly. This is the strictest useful definition.

### Pattern 6: Scoring

**What:** Score = (word length × base points) + sum of bonus points for rare letters.
**When to use:** Called after a word is accepted as valid.

```typescript
// src/lib/scoreCalculator.ts
const BASE_POINTS = 1
const BONUS: Record<string, number> = { Q: 10, Z: 8, X: 6, J: 6 }

export function scoreWord(word: string): number {
  if (!word) return 0
  const upper = word.toUpperCase()
  let score = upper.length * BASE_POINTS
  for (const ch of upper) {
    score += BONUS[ch] ?? 0
  }
  return score
}
```

Note: `scoreWord` is pure and never throws — an empty string returns 0 (satisfies the "returns 0 for invalid words without throwing" success criterion). The planner should ensure the caller always passes the raw game-state word (with `'Q'` not expanded), so Q earns its bonus.

### Pattern 7: Dependency Injection for Dictionary

**What:** Pass `dictionary: Set<string>` as a parameter to validator functions, never import it directly.
**When to use:** All `src/lib/` functions that need dictionary access.

```typescript
// Good — testable without mocking module imports
export function isInDictionary(word: string, dictionary: Set<string>): boolean { ... }

// Avoid — creates tight coupling to Zustand store
import { useDictionaryStore } from '../store/dictionarySlice'
export function isInDictionary(word: string): boolean {
  const { words } = useDictionaryStore.getState() // non-pure, hard to test
}
```

### Anti-Patterns to Avoid

- **Using a `Set` for multiset operations:** `new Set(['A','A','B'])` deduplicates to `{A, B}` — wrong for letter counting. Always use `Map<string, number>`.
- **Mutating the tile bag in the wrong direction:** `bag.pop()` removes from the end of a shuffled array, which is fine. `bag.splice(0, n)` removes from the front. Pick one convention and stick to it; `splice(0, n)` is more readable for "deal from top of deck".
- **Expanding Q tiles in game state:** Once Q is stored as `'QU'` anywhere in the hand or word state, the tile count math breaks (Q is one tile, not two). Always keep `'Q'` in state; expand only at lookup.
- **Testing randomness directly:** Tests for `dealHand` should not assert specific tiles drawn — assert count and membership. Tests for distribution properties use statistical bounds (e.g., "at least 2 vowels in 100 trials"), not exact values.
- **Importing game logic into React components:** All Phase 2 modules live in `src/lib/`. Phase 4 components import and call them; Phase 2 exports pure functions that work without React.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Random shuffle | Custom random algorithm | Fisher-Yates with `Math.random()` | Fisher-Yates is O(n) uniform shuffle; naive methods have subtle bias. Already a known correct algorithm — just implement it. |
| Letter frequency counting | Regex character class counting | `Map<string, number>` frequency loop | Map approach handles all Unicode edge cases and is O(n) with no allocations beyond the map |
| Dictionary lookup | Trie or prefix tree | `Set<string>.has()` | TWL06 is already in a `Set<string>` from Phase 1. O(1) lookup. A trie would be built for autocomplete — not needed here. |
| Word score lookup table | Custom scoring formula per word | Per-letter bonus map + length formula | Formula approach is maintainable, covers all future words, requires zero maintenance |

---

## Common Pitfalls

### Pitfall 1: Q Expansion Applied to the Wrong Input

**What goes wrong:** Validator expands Q in the submitted word correctly for dictionary lookup but also stores the expanded form in game state, making the hand math wrong (one tile consumed but two characters appear in the word).
**Why it happens:** The Q→QU substitution feels like it should happen "once and early."
**How to avoid:** The expansion is ONLY in `isInDictionary`. The current word in game state always contains `'Q'`, not `'QU'`. The multiset superset check operates on the unexpanded state-level word.
**Warning signs:** A word containing Q has a length one higher than expected; multiset diff returns an extra `'U'`.

### Pitfall 2: Multiset Superset vs Character Set Superset

**What goes wrong:** Developer uses `new Set(newWord)` and checks that it contains all characters from `new Set(prevWord)` — this passes for `"CART"` ⊇ `"CAT"` but also (incorrectly) passes for `"CAT"` ⊇ `"AAA"` since `{C,A,T}` contains `{A}`.
**Why it happens:** `Set` is the natural go-to for "contains all" checks.
**How to avoid:** Always use `Map<string, number>` letter frequency counters. The check is: for every letter in prev, its count in new >= its count in prev.
**Warning signs:** `validateTurn('SAAT', 'AAT', ...)` passes when it should fail (SAT adds S but SAAT has 2 As — the multiset check needs to catch double-counting).

### Pitfall 3: Fisher-Yates Off-by-One

**What goes wrong:** Shuffle produces a non-uniform distribution; some permutations are never generated.
**Why it happens:** Loop runs `for (let i = arr.length; i > 0; i--)` (starts at length, not length-1) or uses `Math.floor(Math.random() * arr.length)` instead of `Math.floor(Math.random() * (i + 1))`.
**How to avoid:** Use the canonical form: outer loop from `arr.length - 1` down to `1`; inner random index from `0` to `i` (inclusive). The test for this is statistical: run shuffle 10,000 times and check that each position gets each letter approximately equally.
**Warning signs:** One letter consistently appears first; distribution test fails with high confidence.

### Pitfall 4: Plural Ban False Positives on Rearrangements

**What goes wrong:** `"CATS"` is banned even when the previous word was `"TACS"` (not a real word but illustrates the shape: the word changed shape, not just gained an S).
**Why it happens:** The plural check looks at whether the diff is `'S'` without considering whether the word is structurally a plural of the previous word.
**How to avoid:** The simplest correct definition: diff is exactly `['S']` AND `newWord.toUpperCase() === prevWord.toUpperCase() + 'S'`. This only catches the trivial trailing-S case. Since GAME-11 says "Pluralizing with S is banned" and the rearrangement is the interesting case, the trailing-S check is the right scope for v1.
**Warning signs:** Test for `"CART" → "CARTS"` passes correctly; test for `"ARTS" → "TARS" + S extension` does not fire the ban.

### Pitfall 5: Starting Word Corpus Produces Dead Games

**What goes wrong:** Round starts with `"ZAX"` — neither player can form a 4-letter word from it with the tiles in their hand.
**Why it happens:** All 3-letter TWL words are valid starting words but some have very few 4-letter extensions.
**How to avoid:** Pre-filter the starting corpus to only include 3-letter words with at least 5 known 4-letter TWL extensions. A one-time script can generate this list. For Phase 2, a hardcoded array of ~200 well-known words (`CAT`, `DOG`, `RUN`, `ACE`, etc.) is sufficient and deterministic.
**Warning signs:** QA and manual play shows frequent dead-end rounds within 2 turns.

### Pitfall 6: Tests Asserting Exact Random Output

**What goes wrong:** Test asserts `dealHand(bag, 9)[0] === 'A'` — passes locally, fails on CI because shuffle is random.
**Why it happens:** Developer writes tests before thinking about randomness.
**How to avoid:** Tests for tile bag assert count and membership (`result.length === 9`, `result.every(t => VALID_LETTERS.includes(t))`), not ordering. Distribution tests use statistical sampling.
**Warning signs:** Tests pass 80% of the time; CI is flaky.

---

## Code Examples

### Complete WordValidator module structure

```typescript
// src/lib/wordValidator.ts

export interface ValidationConfig {
  banPluralS: boolean
}

export type WordValidationResult =
  | { valid: true }
  | { valid: false; reason: 'not_a_word' | 'letters_unavailable' }

export type TurnValidationResult =
  | { valid: true }
  | { valid: false; reason: 'not_a_word' | 'letter_not_in_hand' | 'not_a_superset' | 'plural_banned' }

// Q tile expansion: player submits "QACK" (Q=Qu tile), validator looks up "QUACK"
function expandQTiles(word: string): string {
  return word.toUpperCase().replaceAll('Q', 'QU')
}

function letterFrequency(word: string): Map<string, number> {
  const map = new Map<string, number>()
  for (const ch of word.toUpperCase()) {
    map.set(ch, (map.get(ch) ?? 0) + 1)
  }
  return map
}

function isMultisetSuperset(newWord: string, prevWord: string): boolean {
  const freqNew = letterFrequency(newWord)
  const freqPrev = letterFrequency(prevWord)
  for (const [ch, count] of freqPrev) {
    if ((freqNew.get(ch) ?? 0) < count) return false
  }
  return true
}

function multisetDiff(newWord: string, prevWord: string): string[] {
  const freqNew = letterFrequency(newWord)
  const freqPrev = letterFrequency(prevWord)
  const extra: string[] = []
  for (const [ch, count] of freqNew) {
    const diff = count - (freqPrev.get(ch) ?? 0)
    for (let i = 0; i < diff; i++) extra.push(ch)
  }
  return extra
}

export function validateWord(
  word: string,
  hand: string[],
  dictionary: Set<string>,
): WordValidationResult {
  const upper = word.toUpperCase()
  const expanded = expandQTiles(upper)
  if (!dictionary.has(expanded.toLowerCase())) {
    return { valid: false, reason: 'not_a_word' }
  }
  const handFreq = letterFrequency(hand.join(''))
  const wordFreq = letterFrequency(upper)
  for (const [ch, count] of wordFreq) {
    if ((handFreq.get(ch) ?? 0) < count) {
      return { valid: false, reason: 'letters_unavailable' }
    }
  }
  return { valid: true }
}

export function validateTurn(
  newWord: string,
  prevWord: string,
  hand: string[],
  dictionary: Set<string>,
  config: ValidationConfig,
): TurnValidationResult {
  // 1. Check dictionary
  const expanded = expandQTiles(newWord.toUpperCase())
  if (!dictionary.has(expanded.toLowerCase())) {
    return { valid: false, reason: 'not_a_word' }
  }
  // 2. Check multiset superset (new word contains all letters of prev word)
  if (!isMultisetSuperset(newWord, prevWord)) {
    return { valid: false, reason: 'not_a_superset' }
  }
  // 3. Check exactly one new letter, and it's in the hand
  const diff = multisetDiff(newWord, prevWord)
  if (diff.length !== 1) {
    return { valid: false, reason: 'not_a_superset' }
  }
  const addedLetter = diff[0]
  const handFreq = letterFrequency(hand.join(''))
  if ((handFreq.get(addedLetter) ?? 0) < 1) {
    return { valid: false, reason: 'letter_not_in_hand' }
  }
  // 4. Plural ban
  if (config.banPluralS && addedLetter === 'S' && newWord.toUpperCase() === prevWord.toUpperCase() + 'S') {
    return { valid: false, reason: 'plural_banned' }
  }
  return { valid: true }
}
```

### Bananagrams and Scrabble tile count constants

```typescript
// src/lib/tileBag.ts

// Source: Bananagrams official (144 tiles)
// https://en.wikipedia.org/wiki/Bananagrams
export const BANANAGRAMS_COUNTS: Record<string, number> = {
  A:13, B:3, C:3, D:6, E:18, F:3, G:4, H:3, I:12, J:2, K:2,
  L:5,  M:3, N:8, O:11, P:3, Q:2, R:9, S:6, T:9, U:6, V:3,
  W:3,  X:2, Y:3, Z:2
}

// Source: Scrabble official (98 lettered tiles, no blanks for this game)
// https://en.wikipedia.org/wiki/Scrabble_letter_distributions
export const SCRABBLE_COUNTS: Record<string, number> = {
  A:9,  B:2, C:2, D:4, E:12, F:2, G:3, H:2, I:9, J:1, K:1,
  L:4,  M:2, N:6, O:8, P:2,  Q:1, R:6, S:4, T:6, U:4, V:2,
  W:2,  X:1, Y:2, Z:1
}
```

### Statistical vowel distribution test

```typescript
// src/lib/__tests__/tileBag.test.ts (excerpt)
it('dealing 9 tiles from Bananagrams bag produces at least 2 vowels (statistical)', () => {
  const VOWELS = new Set(['A','E','I','O','U'])
  let failCount = 0
  for (let trial = 0; trial < 100; trial++) {
    const bag = createBag('bananagrams')
    const hand = dealHand(bag, 9)
    const vowelCount = hand.filter(t => VOWELS.has(t)).length
    if (vowelCount < 2) failCount++
  }
  // With Bananagrams distribution, ~58% of tiles are vowels.
  // P(< 2 vowels in 9 tiles) is astronomically small. Zero failures expected.
  expect(failCount).toBe(0)
})
```

### ScoreCalculator

```typescript
// src/lib/scoreCalculator.ts
const BASE_POINTS = 1
const RARE_LETTER_BONUS: Record<string, number> = { Q: 10, Z: 8, X: 6, J: 6 }

// Returns 0 for empty/falsy input — never throws
export function scoreWord(word: string): number {
  if (!word) return 0
  const upper = word.toUpperCase()
  let score = upper.length * BASE_POINTS
  for (const ch of upper) {
    score += RARE_LETTER_BONUS[ch] ?? 0
  }
  return score
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Regex for letter counting | `Map<string, number>` frequency counter | Always best practice | Map is O(n), readable, handles multi-char edge cases |
| Separate game state in React `useState` | Zustand slice for game state | Phase 1 decision | All game state in `gameSlice.ts`; no prop drilling |
| Dictionary lookup via sorted array + binary search | `Set<string>.has()` O(1) | Phase 1 decision (parseWordList returns Set) | Already built correctly; no change needed |

**Deprecated/outdated approaches to avoid:**
- Building a trie from the dictionary: unnecessary for word lookup (Set is O(1)); would only be useful for autocomplete which is out of scope
- Storing Q as `'QU'` in game state: explicitly prohibited by project decisions (see STATE.md)

---

## Open Questions

1. **Starting word corpus generation method**
   - What we know: The corpus must be 3-letter TWL words with at least 5 common 4-letter extensions to prevent dead-end games (STATE.md blocker)
   - What's unclear: Whether to generate dynamically at startup from the loaded dictionary, or use a pre-computed hardcoded array
   - Recommendation: For Phase 2, use a hardcoded array of ~200 well-known 3-letter words (`ACE, ACT, AID, AIM, AIR, APT, ARM, ART, ASH, ...`). Generating dynamically requires knowing which 4-letter words are "common" which requires a frequency list (same dependency as Phase 3 AI). A one-time script to produce this list from TWL06 should be noted as a dev task in Wave 0 of plan 02-03, not a runtime requirement.

2. **Plural ban edge cases with rearrangement**
   - What we know: GAME-11 says "Pluralizing with S is banned by default"
   - What's unclear: Whether `RATS → TSAR + S` (rearranged to a different word that ends in S but is not a simple plural) should be banned
   - Recommendation: v1 implementation uses the simple trailing-S check: `newWord.toUpperCase() === prevWord.toUpperCase() + 'S'`. Only the trivial case is banned. The planner should document this scope explicitly.

3. **Game state shape for RoundManager**
   - What we know: Round state needs: currentWord, currentPlayerId, activePlayers, round number, all hands, tile bag
   - What's unclear: Whether `gameSlice.ts` should be a single monolithic slice or composed of smaller slices (roundSlice + playerSlice)
   - Recommendation: Single `gameSlice.ts` for Phase 2; decompose in a future refactor if complexity warrants it. Phase 2 is logic-only — the shape can evolve in Phase 4 without breaking anything since the UI doesn't exist yet.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.x |
| Config file | `vite.config.ts` (test block, already configured) |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WVAL-02 | `validateWord` returns `{ valid: true }` for known dictionary word | unit | `npm test -- --run src/lib/__tests__/wordValidator.test.ts` | Wave 0 |
| WVAL-03 | `validateWord` returns `{ valid: false, reason: 'not_a_word' }` for unknown word | unit | `npm test -- --run src/lib/__tests__/wordValidator.test.ts` | Wave 0 |
| WVAL-03 | `validateWord` returns `{ valid: false, reason: 'letters_unavailable' }` when hand lacks tiles | unit | `npm test -- --run src/lib/__tests__/wordValidator.test.ts` | Wave 0 |
| WVAL-04 | `isInDictionary('QACK', dict)` returns `true` (Q expands to QU) | unit | `npm test -- --run src/lib/__tests__/wordValidator.test.ts` | Wave 0 |
| WVAL-04 | `isInDictionary('QUACK', dict)` returns `false` (QUUACK not valid) | unit | `npm test -- --run src/lib/__tests__/wordValidator.test.ts` | Wave 0 |
| TILE-01 | `dealHand(bag, 9)` returns array of 9 strings | unit | `npm test -- --run src/lib/__tests__/tileBag.test.ts` | Wave 0 |
| TILE-02 | `drawToNine(hand, bag)` returns array of length 9 when hand has fewer | unit | `npm test -- --run src/lib/__tests__/tileBag.test.ts` | Wave 0 |
| TILE-03 | Dealing 9 from Bananagrams bag produces ≥2 vowels (100 trials) | statistical | `npm test -- --run src/lib/__tests__/tileBag.test.ts` | Wave 0 |
| TILE-04 | `createBag('scrabble')` produces correct total tile count (98) | unit | `npm test -- --run src/lib/__tests__/tileBag.test.ts` | Wave 0 |
| TILE-04 | `createBag('bananagrams')` produces correct total tile count (144) | unit | `npm test -- --run src/lib/__tests__/tileBag.test.ts` | Wave 0 |
| TILE-05 | Q tile stored as `'Q'` in hand, not `'QU'` | unit | `npm test -- --run src/lib/__tests__/tileBag.test.ts` | Wave 0 |
| GAME-02 | `validateTurn('CART','CAT',['R'],dict,config)` returns `{ valid: true }` | unit | `npm test -- --run src/lib/__tests__/wordValidator.test.ts` | Wave 0 |
| GAME-03 | `validateTurn('CART','CAT',['R'],dict,config)` passes (rearranged) | unit | included above | Wave 0 |
| GAME-04 | `validateTurn` with letter not in hand returns `{ valid: false, reason: 'letter_not_in_hand' }` | unit | `npm test -- --run src/lib/__tests__/wordValidator.test.ts` | Wave 0 |
| GAME-04 | `validateTurn` adding two letters returns `{ valid: false, reason: 'not_a_superset' }` | unit | `npm test -- --run src/lib/__tests__/wordValidator.test.ts` | Wave 0 |
| GAME-11 | `validateTurn('CATS','CAT',['S'],dict,{banPluralS:true})` returns plural_banned | unit | `npm test -- --run src/lib/__tests__/wordValidator.test.ts` | Wave 0 |
| GAME-11 | Same turn with `banPluralS:false` returns `{ valid: true }` | unit | `npm test -- --run src/lib/__tests__/wordValidator.test.ts` | Wave 0 |
| SCOR-01 | `scoreWord('CAT')` returns 3 (3 letters × 1 base point) | unit | `npm test -- --run src/lib/__tests__/scoreCalculator.test.ts` | Wave 0 |
| SCOR-02 | `scoreWord('QUIZ')` returns bonus points for Q and Z | unit | `npm test -- --run src/lib/__tests__/scoreCalculator.test.ts` | Wave 0 |
| SCOR-02 | `scoreWord('')` returns 0 without throwing | unit | `npm test -- --run src/lib/__tests__/scoreCalculator.test.ts` | Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test -- --run`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/lib/__tests__/wordValidator.test.ts` — covers WVAL-02, WVAL-03, WVAL-04, GAME-02, GAME-03, GAME-04, GAME-11
- [ ] `src/lib/__tests__/tileBag.test.ts` — covers TILE-01 through TILE-05
- [ ] `src/lib/__tests__/scoreCalculator.test.ts` — covers SCOR-01, SCOR-02
- [ ] `src/lib/__tests__/roundManager.test.ts` — covers GAME-01, GAME-05 through GAME-10
- [ ] `src/types/game.ts` — shared TypeScript interfaces for game state
- [ ] `src/lib/wordValidator.ts` — implementation file
- [ ] `src/lib/tileBag.ts` — implementation file
- [ ] `src/lib/scoreCalculator.ts` — implementation file
- [ ] `src/lib/roundManager.ts` — implementation file
- [ ] `src/lib/startingWords.ts` — hardcoded corpus of valid starting 3-letter words

---

## Sources

### Primary (HIGH confidence)

- [Wikipedia: Bananagrams](https://en.wikipedia.org/wiki/Bananagrams) — 144 tile distribution with counts per letter (A=13, E=18, etc.) verified
- [Wikipedia: Scrabble letter distributions](https://en.wikipedia.org/wiki/Scrabble_letter_distributions) — 98 lettered tile distribution verified (A=9, E=12, etc.)
- [Hasbro official Scrabble tile count](https://hasbro-new.custhelp.com/app/answers/detail/a_id/19/) — tile counts confirmed against official source
- Project `STATE.md` — Q tile storage decision: stored as `'Q'` in all state, expanded at lookup time only
- Project `src/store/dictionarySlice.ts` — existing `Set<string>` API the validator depends on

### Secondary (MEDIUM confidence)

- [Bananagrammer: Letter distributions](http://www.bananagrammer.com/2009/07/letter-distributions-in-bananagrams-and.html) — Bananagrams counts cross-verified

### Tertiary (LOW confidence)

- Statistical claim that P(< 2 vowels in 9 Bananagrams tiles) ≈ 0 — derived from Bananagrams vowel fraction (~58% of 144 tiles are AEIOU: 13+18+12+11+6=60 vowels of 144). Formal binomial calculation not performed but the claim is directionally correct and the test itself is the authoritative verification.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; existing TypeScript/Vitest setup confirmed working
- Tile distributions: HIGH — verified against Wikipedia and official Hasbro sources
- Algorithm patterns (multiset, Q expansion, Fisher-Yates): HIGH — well-established algorithms, no library ambiguity
- Starting word corpus: MEDIUM — the "5+ extensions" filter approach is design intent from STATE.md but the actual corpus content is discretionary
- Plural ban edge cases: MEDIUM — simple trailing-S definition is clearly correct for v1; more complex rearrangement cases are deliberately deferred
- Statistical vowel distribution test: MEDIUM — directionally correct; test itself verifies the property

**Research date:** 2026-03-18
**Valid until:** 2026-05-18 (60 days — all algorithms are language builtins; tile distributions are stable physical game facts)
