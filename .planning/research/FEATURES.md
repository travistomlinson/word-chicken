# Feature Research

**Domain:** Browser-based single-player tile word game with AI opponents and elimination mechanics
**Researched:** 2026-03-18
**Confidence:** MEDIUM — Word game conventions are well-established; novel mechanic (letter-by-letter cooperative extension with elimination) has no direct comparators.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Real-time word validation with visual feedback | Every word game since Wordle (2021) provides instant valid/invalid response. Absence feels broken. | LOW | Shake animation on invalid word; green highlight on valid. Bundled dictionary (TWL/SOWPODS) loaded client-side — no round-trip latency. |
| Clear current word display | Players must see the shared word state at all times. Confusion about what the current word is = immediate frustration. | LOW | Show letter sequence prominently; tiles in play must be visually distinct from hand tiles. |
| Hand tile display | Core game surface. Players need to see their 9 tiles. | LOW | Tiles displayed in rack; must support click/tap to select and play. |
| Letter-by-letter turn indication | Players must know whose turn it is and what phase (extend, validate, etc.) | LOW | Clear turn indicator; AI "thinking" state needed so player knows game is processing. |
| Invalid word rejection with explanation | Players need to know WHY a submission failed (not a word vs. can't be formed from hand). | LOW-MEDIUM | Two error classes: "not a valid word" vs. "letters not available in your hand." |
| Round start / round end state | Clear moment when a round begins (3-letter seed word) and ends (player eliminated). | LOW | Transition screens/animations communicate state changes. |
| Score display | Word game players expect a running score. | LOW | Score per word (length + rarity) and cumulative round score visible. |
| Game over screen | Final state with win/loss, score summary. | LOW | Necessary closure; feels unfinished without. |
| Keyboard input support | Desktop browser users expect to type letters, not click tiles. | MEDIUM | Map keyboard keys to tile selection; requires focus management logic. |
| "How to Play" explanation | Novel mechanic (letter extension + elimination) is not self-evident. First-time players will be lost. | MEDIUM | Modal or dedicated rules screen; not a full tutorial but a rules summary. |
| Responsive layout | 67% of browser game sessions in 2025 are on mobile. Tile-based games need touch-first design. | MEDIUM | Tap tiles to select/play; drag optional but not required. |
| Difficulty selection before game | Players expect to choose challenge level before committing to a session. | LOW | Easy/Medium/Hard selector on pre-game screen. |
| Configurable rules pre-game | The game has meaningful rule variants (plurals toggle, tile distribution). Must surface before play, not buried in settings. | LOW-MEDIUM | Pre-game config screen. Defaults must be sane (plurals off, Bananagrams distribution). |

---

### Differentiators (Competitive Advantage)

Features that set this product apart. These align with the core value: escalating tension of "can I extend this word?"

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| AI opponent personality / voice | AI that "thinks out loud" (e.g., "Hmm, going with STRAINER...") makes the game feel competitive rather than mechanical. Creates emotional stakes. | MEDIUM | Text-based flavor only; no TTS needed. Difficulty-correlated vocabulary: Easy AI uses common words, Hard AI uses obscure optimal plays. |
| Tension ramp visualization | Visual cue showing how long/difficult the current word is becoming — a "chicken-o-meter" or word pressure indicator. | MEDIUM | Tracks word length, letter rarity, time-to-play. Amplifies the core "chicken moment." |
| Word history display | Show the sequence of letters added each turn (who played what). Post-elimination replay of how the word grew. | LOW-MEDIUM | Creates narrative arc for each round. Players can analyze what broke the losing player. |
| Rarity-weighted scoring with bonuses | Score goes beyond word length. Using rare letters (Q, Z, X, J) or finding obscure words earns bonuses. Creates strategy: play safe common words or swing for score. | MEDIUM | Scrabble letter values are well-established; adapt for word-length multipliers on top. |
| Q = "Qu" tile mechanic | Unique tile convention (from Bananagrams) that eliminates the "I have Q but no U" death scenario. Makes tile distribution cleaner and play more fluid. | LOW | Dictionary must accommodate Qu- words correctly. Requires tile rendering to show "Qu" as single unit. |
| New hand each round | Unlike Scrabble where tiles accumulate strategy, fresh hands each round means each round is a self-contained puzzle. Reduces runaway leader effect. | LOW | Already in spec; worth calling out as a differentiator vs. hand-persistence games. |
| No max word length elimination | The word just keeps growing until someone breaks. Creates genuine escalating dread absent from capped-length games. | LOW | Spec already defines this; implement without artificial cap. |
| Pre-game rules configuration | Casual players toggle plurals on; competitive players prefer them off. Tile distribution options let players tune difficulty independently of AI skill. | LOW-MEDIUM | Differentiates from rigid-rules word games; increases replayability. |

---

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem like good additions but introduce disproportionate complexity or undermine the core experience.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Online multiplayer (v1) | "Real games are played against humans." | Requires server infrastructure, latency handling, matchmaking, session persistence, disconnect handling, lobby state — all orthogonal to proving the core mechanic. Networking doubles scope. | Ship AI-only v1. Validate mechanic first. Add multiplayer in v2 once the game loop is proven fun. |
| User accounts / login (v1) | Persistent stats, leaderboards, identity. | Auth is 2-3x the complexity of the feature set it enables in v1. No social graph to compete against = leaderboards are meaningless. | Play-immediately with no login. Use localStorage for session stats. Add accounts when there's a reason (multiplayer, social). |
| Real-time chat with AI | Conversational AI opponent feels alive. | LLM integration introduces latency, cost, content moderation surface, and prompt injection risk. Flavor text from a lookup table gives 80% of the value at 0% of the complexity. | Pre-scripted AI commentary keyed to game events (word played, player eliminated, hard word found). |
| Drag-and-drop tile placement | Feels tactile and satisfying. | Accessible drag-and-drop requires full ARIA implementation, keyboard fallback, and touch gesture handling across device classes. Adds significant complexity for unclear incremental value over tap-to-select. | Tap/click to select a tile, tap target to place it. Simpler, accessible, works everywhere. |
| Achievements / badges system | Rewards mastery, increases retention. | Achievements require persistent state, achievement definitions, unlock detection logic, and UI surface. Valuable, but not core to the chicken mechanic. | Defer to v1.x. Track session stats locally; surface a simple end-screen "best word" stat first. |
| Timer / countdown per turn | Creates urgency. | Timers penalize players who look up words or pause; discourages deliberate play. For single-player vs AI, there's no clock-abuse risk. Urgency already comes from the elimination mechanic. | Let the escalating word length create pressure naturally. Add optional timer as a rule toggle in v2 if playtesting shows sessions feel too slow. |
| Multiple simultaneous AI opponents | More players = more interesting dynamics. | 3-4 player balance has not been validated (PROJECT.md notes physical playtesting was only 2-player). AI decision complexity multiplies with player count. | Start with 1 human vs 1 AI. Add 2nd AI opponent in v1.x after 1v1 balance is validated. |
| Sound effects on every action | Polished feel, audio feedback. | Audio implementation (Web Audio API, asset loading, user preferences, mute state) is a non-trivial surface for a first-pass. | Defer sound to v1.x. Focus on visual feedback first. Add audio as an enhancement layer once game loop is stable. |

---

## Feature Dependencies

```
[Word Validation Engine]
    └──required by──> [Turn Submission]
    └──required by──> [AI Opponent Logic]
    └──required by──> [Invalid Word Rejection Feedback]

[Tile Distribution System]
    └──required by──> [Hand Dealing]
                          └──required by──> [New Hand Each Round]
                          └──required by──> [9-Tile Hand Display]

[Game State Machine]
    └──required by──> [Round Start / Seed Word]
    └──required by──> [Turn Sequencing (human → AI → human)]
    └──required by──> [Elimination Logic]
    └──required by──> [Round End / Game Over]

[Scoring Engine]
    └──required by──> [Score Display]
    └──required by──> [End-of-Round Summary]
    └──required by──> [Rarity Bonus Calculation]
        └──requires──> [Letter Rarity Values]

[AI Opponent Logic]
    └──requires──> [Word Validation Engine]
    └──requires──> [Game State Machine]
    └──enhanced by──> [AI Flavor Text / Commentary]

[Pre-game Config Screen]
    └──feeds into──> [Game State Machine] (rule flags)
    └──feeds into──> [Tile Distribution System] (distribution mode)
    └──feeds into──> [AI Opponent Logic] (difficulty level)

[Word History Display]
    └──requires──> [Game State Machine] (turn log)

[Q="Qu" Tile]
    └──requires──> [Word Validation Engine] (must handle Qu- prefix)
    └──requires──> [Tile Rendering] (show "Qu" as single tile visually)
```

### Dependency Notes

- **Word Validation Engine is foundational**: Every interactive feature depends on it. Must be implemented first and tested thoroughly. TWL/SOWPODS dictionary must be loaded before game loop starts.
- **Game State Machine is the backbone**: Round lifecycle (seed word → turns → elimination → new round) must be modeled explicitly. All display and AI features consume state from it.
- **AI Opponent Logic requires both**: It needs to know what words are valid AND what the current game state is. AI difficulty is a parameter of the AI logic, not a separate system.
- **Pre-game Config feeds three systems**: Config choices must be resolved before game initialization. Config screen is upstream of everything.
- **Q="Qu" is cross-cutting**: Affects tile rendering, tile distribution count, and dictionary lookup. Must be decided before any of those systems are built.
- **Word History enhances but is not required**: The game loop functions without it; add to the turn log data structure early so UI can surface it later without refactoring.

---

## MVP Definition

### Launch With (v1)

Minimum viable product — validates the core "word chicken" mechanic end-to-end.

- [ ] **Word Validation Engine** — bundled TWL dictionary, client-side, fast lookup. Without this nothing works.
- [ ] **Tile Distribution + Hand Dealing** — Bananagrams distribution default, 9 tiles per hand, new hand each round.
- [ ] **Q="Qu" tile** — single tile, renders as "Qu," validates Qu- prefix words.
- [ ] **Game State Machine** — round lifecycle: seed word → turns → elimination → next round → game over.
- [ ] **Turn submission with validation feedback** — valid word advances; invalid word rejected with shake animation and error type.
- [ ] **1v1 AI opponent** — Easy/Medium/Hard difficulty; AI selects words from its vocabulary tier using available letters.
- [ ] **Current word display** — prominent, updated each turn, shows full letter sequence.
- [ ] **Hand tile display** — 9 tiles visible, click/tap to play; replenished to 9 after each turn.
- [ ] **Plurals toggle** — off by default, configurable pre-game.
- [ ] **No max word length** — natural elimination when player cannot extend.
- [ ] **Score display** — word length + letter rarity, running total per round.
- [ ] **Game over screen** — win/loss, score summary, "play again."
- [ ] **How to Play modal** — rules explanation for first-time players.
- [ ] **Pre-game config screen** — difficulty, plurals toggle, tile distribution mode.
- [ ] **Keyboard input support** — desktop users type to select tiles.

### Add After Validation (v1.x)

Add once core game loop is confirmed fun and balanced.

- [ ] **AI flavor text / commentary** — pre-scripted per game event; increases opponent personality. Trigger: player feedback that AI feels mechanical.
- [ ] **Tension ramp visualization** — chicken-o-meter keyed to word length and rarity. Trigger: playtesting shows players don't feel escalating pressure.
- [ ] **Word history display** — turn-by-turn breakdown of who played what. Trigger: players ask "how did that word get so long?"
- [ ] **Sound effects** — audio feedback for valid/invalid words, elimination events. Trigger: visual-only feels flat after repeated play.
- [ ] **2nd AI opponent** — 3-player game mode (1 human vs 2 AI). Trigger: 1v1 balance is proven and players want more chaos.
- [ ] **Achievements / session stats** — "longest word this session," "rarest letter used." Trigger: players wanting to measure improvement.

### Future Consideration (v2+)

Defer until product-market fit is established.

- [ ] **Online multiplayer** — Requires server infrastructure, real-time sync, matchmaking. Defer until the mechanic is validated as fun and worth the investment.
- [ ] **User accounts** — Only meaningful once there's a social or persistence reason. Multiplayer is the trigger.
- [ ] **Leaderboards** — Meaningless without accounts or social graph.
- [ ] **Mobile native app** — Web-first is the right call for v1; native app adds deployment/update complexity. Revisit if PWA metrics suggest strong mobile usage.
- [ ] **Pass-and-play local multiplayer** — Possible without networking, but requires device-sharing UX design. Low priority vs. polishing single-player.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Word Validation Engine | HIGH | MEDIUM | P1 |
| Game State Machine | HIGH | HIGH | P1 |
| Tile Distribution + Hand Dealing | HIGH | MEDIUM | P1 |
| Turn Submission + Validation Feedback | HIGH | LOW | P1 |
| 1v1 AI Opponent (Easy/Medium/Hard) | HIGH | HIGH | P1 |
| Current Word Display | HIGH | LOW | P1 |
| Hand Tile Display | HIGH | LOW | P1 |
| Q="Qu" Tile | HIGH | LOW | P1 |
| No Max Word Length Elimination | HIGH | LOW | P1 |
| Pre-game Config Screen | MEDIUM | LOW | P1 |
| Score Display | MEDIUM | LOW | P1 |
| Game Over Screen | MEDIUM | LOW | P1 |
| How to Play Modal | MEDIUM | LOW | P1 |
| Keyboard Input Support | MEDIUM | MEDIUM | P1 |
| Plurals Toggle | MEDIUM | LOW | P1 |
| AI Flavor Text | MEDIUM | LOW | P2 |
| Tension Ramp Visualization | HIGH | MEDIUM | P2 |
| Word History Display | MEDIUM | LOW | P2 |
| Sound Effects | MEDIUM | MEDIUM | P2 |
| 2nd AI Opponent | LOW | MEDIUM | P2 |
| Achievements / Session Stats | LOW | MEDIUM | P3 |
| Online Multiplayer | HIGH | VERY HIGH | P3 |
| User Accounts | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

No direct competitor exists with Word Chicken's exact mechanic (collaborative word extension with elimination). Nearest analogs:

| Feature | Wordle | Scrabble GO | Bananagrams (browser) | Word Chicken Approach |
|---------|--------|-------------|----------------------|----------------------|
| Word validation | Instant, client-side | Server-side (latency) | Client-side | Client-side bundled dictionary — no latency |
| Tile mechanic | None (guess rows) | Board placement | Freestyle grid | Single shared word, one letter per turn |
| AI opponent | None | Bot opponents | None | Three difficulty tiers; vocabulary-scoped |
| Player count | 1 | 2–4 | 2–8 | 1v1 AI for v1 |
| Scoring | None (win/lose) | Letter value × board multiplier | Fastest finisher wins | Word length + letter rarity; eliminates runaway-leader scoring |
| Account required | Optional | Required | Required | No — play immediately |
| Round structure | Fixed 6 guesses | Turn-based, no rounds | Single race | Discrete rounds; new hand each round |
| Elimination | None | None | First-to-finish | Core mechanic — can't extend = eliminated |
| Config / rules | None | Fixed | Fixed | Pre-game configurable (plurals, distribution, difficulty) |

**Key insight:** Word Chicken's differentiating surface is the elimination mechanic + no-cap word growth + per-round fresh hands. No existing browser game has this combination. The closest genre is party/social word games (Letter Jam, Ghost word game), but those are not browser-native. The "play immediately, no account" model follows Wordle's successful no-friction pattern.

---

## Sources

- [Word Game Statistics 2026: Market Size, Users | Crosswordle Blog](https://crosswordle.com/blog/word-game-state-of-play-2025)
- [Why Browser Games Are Dominating Social Gaming in 2026](https://doodleduel.ai/blog/why-browser-games-are-dominating-2026)
- [Game Accessibility Guidelines — Full List](https://gameaccessibilityguidelines.com/full-list/)
- [Why Wordle Works: A UX Breakdown](https://medium.com/design-bootcamp/why-wordle-works-a-ux-breakdown-485b1dbba30b)
- [The Complete Game UX Guide 2025](https://game-ace.com/blog/the-complete-game-ux-guide/)
- [Scrabble Letter Distributions — Wikipedia](https://en.wikipedia.org/wiki/Scrabble_letter_distributions)
- [AI in Game Difficulty Adjustment — Fintelics / Medium](https://fintelics.medium.com/ai-in-game-difficulty-adjustment-adapting-challenges-to-player-skill-levels-b7f7767c96b)
- [How to Avoid Scope Creep in Game Development — Codecks](https://www.codecks.io/blog/2025/how-to-avoid-scope-creep-in-game-development/)
- [How to Stop Feature Creep from Killing Your Game — Codecks](https://www.codecks.io/blog/2025/how-to-stop-feature-creep-from-killing-your-game-with-hovgaard-games/)
- [Best Practices in Video Game UI for Game Onboarding — Inworld AI](https://inworld.ai/blog/best-practices-in-video-game-ui-for-game-onboarding)
- [The Road to Accessible Drag and Drop — TPGi](https://www.tpgi.com/the-road-to-accessible-drag-and-drop-part-1/)
- [Bananagrams vs Scrabble — ScrabbleWordFinder.org](https://scrabblewordfinder.org/bananagrams-vs-scrabble)

---
*Feature research for: Browser-based single-player word game with AI opponents and elimination mechanics*
*Researched: 2026-03-18*
