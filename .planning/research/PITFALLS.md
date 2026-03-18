# Pitfalls Research

**Domain:** Browser-based word tile game with AI opponent (Word Chicken)
**Researched:** 2026-03-18
**Confidence:** MEDIUM — core pitfalls from domain knowledge and verified patterns; some specifics inferred from adjacent projects (Wordle, Scrabble clones, word-building games)

---

## Critical Pitfalls

### Pitfall 1: Dictionary Bundle Kills Initial Load

**What goes wrong:**
TWL06 contains ~178,000 words; SOWPODS contains ~267,000. Naively bundling either as a plain array or uncompressed JSON adds 2–5 MB to the initial JavaScript payload. On a mobile connection this means a multi-second white screen before the game is playable.

**Why it happens:**
Developers copy the word list into a `.js` or `.json` file, import it, and ship it. It works locally on fast connections but the uncompressed cost is invisible until production.

**How to avoid:**
- Use the ENABLE word list (~173K words, ~1.8 MB uncompressed, ~500 KB gzipped) or TWL06 for a smaller target corpus.
- Store the list as a newline-delimited `.txt`, serve with gzip/brotli, and load via `fetch` on game start (not bundle time).
- Alternatively, use a prefix trie or DAWG (Directed Acyclic Word Graph) structure — this compresses a full Scrabble lexicon to under 400 KB uncompressed, under 200 KB gzipped.
- For validation only (no AI lookups needed during search), a sorted array with binary search is sufficient and compresses better than a hash set.

**Warning signs:**
- Lighthouse shows "Reduce unused JavaScript" with your word list file
- `network` tab shows a > 1 MB JS file on first load
- Game pauses for 500 ms+ before first frame on mobile throttling

**Phase to address:** Foundation / core game mechanics phase (before any AI work)

---

### Pitfall 2: The "Add One Letter" Validation Is Non-Trivial

**What goes wrong:**
The core mechanic — player must add exactly one letter from their hand to the current word, with rearranging allowed — sounds simple but has subtle validation rules that are easy to get wrong:

1. The new word must contain all letters of the old word plus exactly one new letter (a letter-multiset superset check).
2. The new letter must come from the player's hand (not just any letter).
3. After playing, that letter is removed from the hand.
4. The result must be a valid dictionary word.

Developers often validate (4) without enforcing (1)–(3), or enforce (1) but forget hand-source constraint (2).

**Why it happens:**
The "rearranging allowed" clause makes people think of anagram validation (do these letters form a word?), not superset validation (is new word = old word + one hand letter?). These are different problems. A word formed from a completely different set of letters can pass anagram validation while being an illegal move.

**How to avoid:**
Model the move as: `new_word_letters == multiset(old_word_letters) + {one_tile_from_hand}`. Validate this first, then validate the resulting word against the dictionary. Write unit tests for edge cases:
- Player tries to substitute a letter (replace rather than add)
- Player tries to add a letter not in their hand
- Player adds a duplicate letter already in the word (valid if they hold that letter)
- Q tile treated as "Qu" — counts as two characters but one tile

**Warning signs:**
- Validation logic branches on string length rather than letter-multiset comparison
- No unit tests for the "add one letter" constraint specifically
- Playtesting reveals players can "swap" letters without adding

**Phase to address:** Core game mechanics phase (first playable build)

---

### Pitfall 3: Q="Qu" Creates an Inconsistent Character Model

**What goes wrong:**
Treating Q as "Qu" (two characters, one tile) breaks naive string-length assumptions throughout the codebase. A word like "QUEEN" contains 5 characters but only 4 tiles if Q counts as Qu. The "add one letter" length check (`new_word.length == old_word.length + 1`) breaks immediately.

**Why it happens:**
The Q="Qu" decision is made early as a UX choice (correct), but the implementation treats it as a display concern rather than a data model concern. The internal word representation keeps using raw characters.

**How to avoid:**
Decide at the data model level: store words as tile sequences, not character strings. A tile sequence for "QUEEN" is `[Q, E, N]` (3 tiles) where Q expands to "Qu" for display and dictionary lookup. All game logic operates on tile arrays. Dictionary validation translates tile arrays to strings before lookup.

Alternatively: treat Q as a special single character throughout, use a dictionary that contains "QU" words in their Q form (e.g., map "QUEEN" → "QEN"), but this requires pre-processing the word list.

**Warning signs:**
- `word.length` used directly in game logic
- Q tile displayed as "Q" but internally stored as "QU"
- Dictionary validation fails on "Qu" words because lookup uses tile-string not character-string

**Phase to address:** Core game mechanics phase — must be resolved before dictionary integration

---

### Pitfall 4: AI on Hard Difficulty Performs Perfect Play, Killing Fun

**What goes wrong:**
Hard AI finds the optimal word extension every turn by exhaustively searching all possible words containing the current word's letters plus one letter from its hand. The result is an AI that never loses and feels unfair — not challenging.

**Why it happens:**
"Hard = best possible move" is the obvious implementation. But in a word game, perfect play isn't fun to play against — it feels like the AI is cheating even when it isn't.

**How to avoid:**
Model difficulty as vocabulary access rather than search depth:
- **Easy:** AI can only form words from a ~5,000-word common vocabulary (frequency-ranked subset of the word list). It picks the shortest valid extension.
- **Medium:** AI uses a ~20,000-word vocabulary. It picks a word of moderate length.
- **Hard:** AI uses the full word list. It prefers words that are harder for the player to extend (uncommon letter combinations, longer words).

This creates difficulty that feels natural — Easy AI "doesn't know" obscure words, Hard AI "knows everything." The player never feels cheated because the AI operates within plausible human vocabulary ranges.

Do NOT implement Hard AI as: "use full word list, always find optimal extension" without adding a simulated thinking style. The difference between Hard and Cheating AI is invisible to players.

**Warning signs:**
- Difficulty enum only controls speed/delay, not vocabulary or word selection strategy
- Hard AI wins 95%+ of rounds in playtesting
- Players report Hard AI "doesn't feel hard, it feels impossible"

**Phase to address:** AI opponent phase

---

### Pitfall 5: Starting Word Set Determines Game Quality

**What goes wrong:**
Round-starting 3-letter words are chosen randomly from all valid 3-letter words in the dictionary. Many 3-letter words are dead ends — no common 4-letter extensions exist, or extensions are so obscure they feel like AI cheating. Example: starting with "ZAX" or "QAT" leaves players with no viable move on turn 1.

**Why it happens:**
Developers pull valid 3-letter words from the dictionary without filtering for "extendability." The word is valid, so it's included.

**How to avoid:**
Pre-compute a starting word corpus: filter 3-letter words to those with at least N valid 4-letter extensions using common letters. Restrict starting words to common English vocabulary (frequency-ranked). Store this as a curated ~200–500 word list, not the full set of valid 3-letter Scrabble words.

For the same reason, the starting word should be formed from tiles the starting player can actually hold — or alternatively, the starting word is drawn from a neutral pool and tiles are dealt after.

**Warning signs:**
- Game starts with words players don't recognize
- First-turn elimination (player can't move on move 1) happens in playtesting
- Players ask "is that even a real word?" about starting words

**Phase to address:** Core game mechanics phase (starting word selection), tunable in balance phase

---

### Pitfall 6: Tile Distribution Causes Unwinnable Hands

**What goes wrong:**
Random tile dealing from a Bananagrams-style distribution occasionally produces hands that are "dead" — the player holds 7+ vowels or 6+ rare consonants (J, Q, X, Z) and cannot extend any word regardless of what appears. This is especially punishing because there is no passing.

**Why it happens:**
Bananagrams distribution was designed for a crossword-building game where players build their own grids. Word Chicken uses tiles differently — each player needs a hand that can contribute a single letter to a growing word. The distribution constraints are different.

**How to avoid:**
Constrain dealing to ensure playable hands. Options:
1. Enforce vowel/consonant ratio in dealt hand (e.g., minimum 2 vowels, maximum 1 rare consonant per hand)
2. Allow a one-time "redeal" at round start (costs nothing, just reshuffles)
3. Track distribution at game level: if a player has received 3 J/Q/X/Z tiles this game, reduce their probability of getting another

Document the distribution constants and make them configurable — PROJECT.md already notes this is a balance concern.

**Warning signs:**
- Playtesting shows > 5% of turns result in immediate forced elimination with no viable word
- Players complain about luck rather than skill on losses
- AI on Easy also cannot move (confirms it's a hand problem, not vocabulary problem)

**Phase to address:** Tile distribution and balance phase (can be tuned iteratively via playtesting)

---

### Pitfall 7: Plurals Toggle Breaks AI Vocabulary Assumptions

**What goes wrong:**
The plurals toggle (S-words banned by default) is a configurable rule. When turned on mid-development, the AI continues to play S-plurals because its vocabulary list was built without filtering. The toggle only affects player validation, not AI word selection.

**Why it happens:**
The toggle is implemented as a validator check on player input. The AI word-search runs against the full word list and ignores the same rule.

**How to avoid:**
Rule configuration (plurals toggle, any future rule) must be applied at the word-list filtering layer, not just the player input validation layer. Before game start, filter the effective word list based on all active rules. AI and player validation both use this filtered list.

Specifically for the S-plural ban: filter out words that are a substring of another word + "S" where the base word exists. This is imperfect (LENS is not a plural of LEN) but conservative filtering is safer than missing cases.

**Warning signs:**
- Separate code paths for "validate player word" and "AI finds words"
- AI plays a word the player couldn't have played given current rules
- Toggle is a boolean checked only in one place

**Phase to address:** Rules configuration phase (whenever the toggle is implemented)

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Word list as plain JS array | Simple to import | 2–5 MB bundle; slow on mobile | Never — use compressed fetch |
| AI uses full word list at all difficulties | No vocabulary subsetting needed | Hard AI feels impossible; Easy AI feels random | Never — difficulty requires vocabulary restriction |
| Validate player word with `word.length + 1` | Quick to implement | Breaks for Q="Qu" and any multi-character tile | Never — use tile-count comparison |
| Starting word from all 3-letter valid words | No curation work | Dead starts, first-turn eliminations | Never — curate the starting corpus |
| Rules toggle only in player input validator | Simple path for MVP | AI ignores rules; confusing to players | Never — rules must be global |
| Game state as nested mutable objects | Easy to write | Hard to undo, hard to test, hard to debug game flow | OK in early prototype, eliminate before AI work |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Synchronous dictionary search for AI | UI freezes while AI "thinks" | Run AI search in Web Worker | Any word over 6 letters with full word list |
| Linear scan of word list for each validation | Validation takes 100+ ms | Pre-index word list as a Set or DAWG; O(1) lookup | Word lists over 10K entries |
| Re-filtering word list every turn for AI | AI turn takes 2+ seconds on Hard | Pre-filter word list per game config at game start | Every turn with 178K word list |
| Rebuilding tile-to-word index per move | Noticeable lag between turns | Build index once at game init | Immediately with SOWPODS-size list |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No indication of why a word was rejected | Player thinks game is broken | Show specific rejection reason: "not a valid word", "not an extension of [word]", "letter not in your hand" |
| AI plays instantly with no delay | Feels like the game skipped a turn; AI feels robotic | Add artificial 1–2 second "thinking" delay |
| No confirmation that a word was extended correctly | Player unsure what just happened | Animate the old word transforming into the new word, highlight the added letter |
| Tile hand shows tiles in draw order | Players miss available letters | Sort hand display by letter frequency (common first) or allow drag-to-arrange |
| "You can't extend this word" with no fallback | Player stuck, confused | Explain elimination: "No valid extension found. You are eliminated from this round." with the current word displayed |
| Score shown only at round end | Players don't understand scoring mid-game | Show running point tally and what each word scored when played |

---

## "Looks Done But Isn't" Checklist

- [ ] **Dictionary validation:** Verify Q="Qu" words (QUEEN, QUILT, etc.) validate correctly — the tile is Q but the lookup word contains "QU"
- [ ] **Add-one-letter rule:** Verify the constraint is checked against the player's actual hand, not just letter presence in the new word
- [ ] **AI difficulty:** Verify Easy AI loses sometimes and doesn't know obscure words; Hard AI doesn't win 100% of rounds
- [ ] **Plurals toggle:** Verify AI respects the same plural restriction as the player when toggle is on
- [ ] **Tile distribution:** Deal 20+ hands and verify no hand has 0 playable extensions against a mid-game word
- [ ] **Starting word corpus:** Verify all starting words have at least 5 common 4-letter extensions
- [ ] **Q tile UI:** Verify Q tile displays as "Qu" (or clearly indicates its two-character nature) so player knows what they're holding
- [ ] **Hand replenishment:** Verify player draws back to 9 tiles after every play, not just after winning a round
- [ ] **Elimination logic:** Verify a player eliminated mid-round cannot play in that round but correctly receives a new hand for the next round
- [ ] **Scoring system:** Verify rare letter bonus doesn't create situations where losing players score more than winning players due to point-heavy tiles

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Dictionary bundle too large | MEDIUM | Switch to fetch-on-demand + compressed format; requires refactoring import pattern but not game logic |
| Q="Qu" breaks existing game state | HIGH | Requires data model migration; fix early — every feature built on wrong model is more work to unwind |
| Add-one-letter validation wrong | MEDIUM | Fix validation function + add test suite; AI word selection may also need same fix |
| AI feels unfair at all difficulties | MEDIUM | Implement vocabulary subsetting; requires building frequency-ranked word sublists |
| Starting words cause dead games | LOW | Replace starting word list; no model changes needed |
| Tile distribution causes unwinnable hands | LOW-MEDIUM | Add dealing constraints; requires playtesting to tune constants |
| Rules toggle AI inconsistency | LOW | Route AI word selection through same rule filter as player validation |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Dictionary bundle size | Foundation / word list integration | Lighthouse performance score; load time on throttled connection |
| Add-one-letter validation | Core mechanics (first playable) | Unit tests covering all edge cases including Q="Qu" |
| Q="Qu" data model | Core mechanics (before dictionary) | All "Qu" words validate; tile counts are correct |
| AI perfect play / difficulty | AI opponent phase | Playtest win rates: Easy ~20%, Medium ~40%, Hard ~65% vs player |
| Starting word dead ends | Core mechanics + balance tuning | Zero first-turn eliminations in 50 playtested rounds |
| Unwinnable hands | Tile distribution phase | < 2% of hands have zero valid moves against any common word |
| Plurals toggle AI inconsistency | Rules configuration phase | AI and player both respect toggle; verified with both toggle states |

---

## Sources

- [Compressing the Wordle Dictionary — iamkate.com](https://iamkate.com/code/wordle-dictionary/) — compression strategies for word list bundles
- [Thoughts on Designing Word-Building Games — Robin David, Medium](https://medium.com/@robin.david/thoughts-on-designing-word-building-games-f530792a46e1) — hand management frustration, vowel/consonant balance
- [Game Mechanics: How to Make a Great Word Game — Board Game Design Course](https://boardgamedesigncourse.com/game-mechanics-how-to-make-a-great-word-game/) — analysis paralysis, downtime, hand quality
- [The Computer Is a Cheating Bastard — TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/Main/TheComputerIsACheatingBastard) — AI fairness perception and how rules asymmetry breaks player trust
- [Fake Difficulty — TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/Main/FakeDifficulty) — distinguishing genuine challenge from artificial difficulty
- [Scrabble Letter Distributions — Wikipedia](https://en.wikipedia.org/wiki/Scrabble_letter_distributions) — tile distribution design rationale
- [Word Xchange Rules — Winning Moves](https://winning-moves.com/images/UPWORDS_rulesv2.pdf) — plural restriction design pattern in commercial word games
- [Wordle Hacker News discussion — word list changes](https://news.ycombinator.com/item?id=30325138) — word list curation impacts on player experience
- [Issues with browser-based word game performance — DigitalOcean Community](https://www.digitalocean.com/community/questions/issues-with-daily-updating-browser-based-word-game-performance) — synchronous validation performance issues
- [SOWPODS word list download — wordgamedictionary.com](https://www.wordgamedictionary.com/sowpods/download/sowpods.txt) — reference for word list size (267,752 words)
- [Bananagrammer: Letter distributions — bananagrammer.com](http://www.bananagrammer.com/2009/07/letter-distributions-in-bananagrams-and.html) — Bananagrams distribution context

---
*Pitfalls research for: Word Chicken (browser word tile game with AI opponent)*
*Researched: 2026-03-18*
