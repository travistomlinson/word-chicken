# Requirements: Word Chicken

**Defined:** 2026-03-18
**Core Value:** The escalating tension of "can I extend this word?" — the chicken moment where the word keeps growing and you either find a play or you're out.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Word Validation

- [x] **WVAL-01**: Game loads a bundled TWL dictionary client-side for instant word lookup
- [x] **WVAL-02**: Submitted words are validated against the dictionary in real-time
- [x] **WVAL-03**: Invalid submissions show specific error: "not a valid word" vs "letters not available in your hand"
- [x] **WVAL-04**: Q tile represents "Qu" — dictionary lookups handle Qu-prefix words correctly

### Tile Management

- [x] **TILE-01**: Player receives a hand of 9 letter tiles at the start of each round
- [x] **TILE-02**: After playing a letter, player draws back up to 9 tiles
- [x] **TILE-03**: Tile distribution follows Bananagrams-style weighted frequency by default
- [x] **TILE-04**: Tile distribution is configurable (Bananagrams-style or Scrabble-style)
- [x] **TILE-05**: Q tile renders as "Qu" and counts as a single tile in the hand

### Core Gameplay

- [ ] **GAME-01**: Starting player creates a 3-letter word to begin a round
- [x] **GAME-02**: Each subsequent turn, a player adds one letter to the existing word
- [x] **GAME-03**: Rearranging letters is allowed when extending a word (e.g., CAT + R → CART)
- [x] **GAME-04**: Turn submission validates that the new word uses all previous letters plus exactly one new letter from the player's hand
- [ ] **GAME-05**: Player is eliminated from the round if they cannot form a valid word
- [ ] **GAME-06**: Last player standing wins the round
- [ ] **GAME-07**: Round winner starts the next round with a new 3-letter word
- [ ] **GAME-08**: All players receive new hands at the start of each round
- [x] **GAME-09**: No maximum word length — word grows until someone can't extend
- [x] **GAME-10**: No passing allowed — starting player must play a word
- [x] **GAME-11**: Pluralizing with S is banned by default (configurable toggle to allow)

### AI Opponent

- [ ] **AI-01**: Single-player mode against one AI opponent (1v1)
- [ ] **AI-02**: AI has three difficulty levels: Easy, Medium, Hard
- [ ] **AI-03**: Easy AI selects from a curated common-word vocabulary (~5K words)
- [ ] **AI-04**: Medium AI selects from a moderate vocabulary (~20K words)
- [ ] **AI-05**: Hard AI uses the full dictionary
- [ ] **AI-06**: AI respects all configured game rules (plurals toggle, etc.)
- [ ] **AI-07**: AI displays a "thinking" state so player knows the game is processing

### Scoring

- [ ] **SCOR-01**: Words earn points based on word length
- [ ] **SCOR-02**: Rare letters (Q, Z, X, J, etc.) earn bonus points
- [ ] **SCOR-03**: Running score is displayed during the game
- [ ] **SCOR-04**: End-of-round score summary shows points earned

### Game UI

- [ ] **UI-01**: Current word displayed prominently, updated each turn
- [ ] **UI-02**: Player's 9-tile hand displayed as clickable/tappable tiles
- [ ] **UI-03**: Clear turn indicator showing whose turn it is (player vs AI)
- [ ] **UI-04**: Game over screen with win/loss result, score summary, and "play again" option
- [ ] **UI-05**: Word history display showing the sequence of words and who played each turn
- [ ] **UI-06**: Tension ramp visualization ("chicken-o-meter") showing escalating pressure as the word grows
- [ ] **UI-07**: Round start and round end transitions are visually clear

### Configuration

- [ ] **CONF-01**: Pre-game screen to select AI difficulty (Easy/Medium/Hard)
- [ ] **CONF-02**: Pre-game toggle for allowing/banning plurals (S)
- [ ] **CONF-03**: Pre-game selection of tile distribution (Bananagrams or Scrabble style)
- [ ] **CONF-04**: Sensible defaults: Medium difficulty, plurals banned, Bananagrams distribution

### UX

- [ ] **UX-01**: Keyboard input support — desktop users can type to select tiles
- [ ] **UX-02**: "How to Play" modal explaining the rules for first-time players
- [ ] **UX-03**: Responsive layout — playable on both desktop and mobile browsers

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### AI Enhancements

- **AIX-01**: AI flavor text / personality commentary during play
- **AIX-02**: Multiple AI opponents (3-player mode: 1 human vs 2 AI)

### Polish

- **POL-01**: Sound effects for valid/invalid words, elimination, round win
- **POL-02**: Session stats tracking (longest word, rarest letter, win streak)
- **POL-03**: Achievements / badges system

### Multiplayer

- **MULT-01**: Online multiplayer with real-time play
- **MULT-02**: User accounts and authentication
- **MULT-03**: Leaderboards
- **MULT-04**: Local pass-and-play multiplayer

## Out of Scope

| Feature | Reason |
|---------|--------|
| Online multiplayer | High complexity, validates mechanic first with AI |
| User accounts / login | No social graph in v1, play-immediately is better |
| Drag-and-drop tiles | Accessibility complexity disproportionate to value; tap/click sufficient |
| Real-time chat with AI | LLM cost/latency/moderation risk; pre-scripted flavor text is v2 |
| Timer / countdown per turn | Elimination mechanic already creates pressure naturally |
| Mobile native app | Web-first; revisit if PWA metrics show strong mobile usage |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| WVAL-01 | Phase 1 | Complete |
| WVAL-02 | Phase 2 | Complete |
| WVAL-03 | Phase 2 | Complete |
| WVAL-04 | Phase 2 | Complete |
| TILE-01 | Phase 2 | Complete |
| TILE-02 | Phase 2 | Complete |
| TILE-03 | Phase 2 | Complete |
| TILE-04 | Phase 2 | Complete |
| TILE-05 | Phase 2 | Complete |
| GAME-01 | Phase 2 | Pending |
| GAME-02 | Phase 2 | Complete |
| GAME-03 | Phase 2 | Complete |
| GAME-04 | Phase 2 | Complete |
| GAME-05 | Phase 2 | Pending |
| GAME-06 | Phase 2 | Pending |
| GAME-07 | Phase 2 | Pending |
| GAME-08 | Phase 2 | Pending |
| GAME-09 | Phase 2 | Complete |
| GAME-10 | Phase 2 | Complete |
| GAME-11 | Phase 2 | Complete |
| SCOR-01 | Phase 2 | Pending |
| SCOR-02 | Phase 2 | Pending |
| AI-01 | Phase 3 | Pending |
| AI-02 | Phase 3 | Pending |
| AI-03 | Phase 3 | Pending |
| AI-04 | Phase 3 | Pending |
| AI-05 | Phase 3 | Pending |
| AI-06 | Phase 3 | Pending |
| AI-07 | Phase 3 | Pending |
| SCOR-03 | Phase 4 | Pending |
| SCOR-04 | Phase 4 | Pending |
| UI-01 | Phase 4 | Pending |
| UI-02 | Phase 4 | Pending |
| UI-03 | Phase 4 | Pending |
| UI-04 | Phase 4 | Pending |
| UI-05 | Phase 4 | Pending |
| UI-06 | Phase 4 | Pending |
| UI-07 | Phase 4 | Pending |
| CONF-01 | Phase 4 | Pending |
| CONF-02 | Phase 4 | Pending |
| CONF-03 | Phase 4 | Pending |
| CONF-04 | Phase 4 | Pending |
| UX-01 | Phase 4 | Pending |
| UX-02 | Phase 4 | Pending |
| UX-03 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 37 total
- Mapped to phases: 37
- Unmapped: 0

---
*Requirements defined: 2026-03-18*
*Last updated: 2026-03-18 — traceability populated after roadmap creation*
