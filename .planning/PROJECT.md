# Word Chicken

## What This Is

A webapp word game where players compete by extending words letter-by-letter until someone can't play. Each player holds 9 letter tiles, and rounds begin with a 3-letter word that grows as players add one letter at a time (rearranging allowed). The last player standing wins the round. V1 is single-player against AI opponents with configurable difficulty.

## Core Value

The escalating tension of "can I extend this word?" — the chicken moment where the word keeps growing and you either find a play or you're out.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current scope. Building toward these. -->

- [ ] Single-player game against AI opponent with Easy/Medium/Hard difficulty
- [ ] 9 letter tiles per hand, draw back to 9 after playing
- [ ] Round starts with 3-letter word, each turn adds one letter with rearranging allowed
- [ ] Word validation against a standard word list (TWL/SOWPODS)
- [ ] Player elimination when they can't form a valid word
- [ ] Last player standing wins the round and starts the next
- [ ] Word-based scoring system (points based on word length, letter rarity, etc.)
- [ ] Pre-game rule configuration (plurals toggle, tile distribution style, etc.)
- [ ] Bananagrams-style default tile distribution (configurable)
- [ ] Q tile represents "Qu"
- [ ] No passing — starting player must play a word
- [ ] Pluralizing with S banned by default (configurable toggle to allow)
- [ ] No max word length — word grows until someone can't extend
- [ ] New hands dealt each round

### Out of Scope

- Online multiplayer — deferred to future version
- Local multiplayer (pass-and-play) — deferred to future version
- Mobile native app — web-first
- Real-time chat or social features
- User accounts/authentication — v1 is play-immediately

## Context

- Game has been playtested physically with 2 players; 3-4 may be better balance
- Tile distribution heavily affects game balance
- Dictionary choice affects playability (too strict = frustrating, too loose = trivial)
- "Word Chicken" name captures the core tension mechanic
- AI difficulty levels: Easy (common/short words), Medium (moderate vocabulary), Hard (optimal play)

## Constraints

- **Platform**: Web application (browser-based)
- **Dictionary**: Standard Scrabble word list (TWL or SOWPODS) — needs to be bundled or loaded client-side for fast validation
- **Single-player first**: No server networking required for v1 game logic

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Single-player vs AI for v1 | Simplest path to playable game, no networking complexity | — Pending |
| Standard word list over API | Fast validation, works offline, no API costs | — Pending |
| Q = Qu | Matches Bananagrams convention, more playable | — Pending |
| Plurals banned by default | Forces creative play, configurable for those who prefer it | — Pending |
| No word length cap | Natural game mechanic — elimination happens organically | — Pending |
| Configurable rules | Lets players experiment with variants without code changes | — Pending |
| Word-based scoring | Rewards skillful word-building, not just winning | — Pending |
| Bananagrams-style tile distribution default | Good balance for word games, configurable alternative | — Pending |

---
*Last updated: 2026-03-18 after initialization*
