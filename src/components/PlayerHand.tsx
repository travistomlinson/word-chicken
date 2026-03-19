import { useState, useEffect, useRef } from 'react'
import { useGameStore } from '../store/gameSlice'
import { useMultiplayerStore } from '../store/multiplayerSlice'
import { sendRemoteAction } from '../hooks/useMultiplayer'
import { validateTurn } from '../lib/wordValidator'
import { validateStartingWord } from '../lib/roundManager'
import { findAIMove, getVocabulary } from '../lib/aiEngine'
import { TileCard } from './TileCard'
import { StagingArea } from './StagingArea'
import type React from 'react'

const LETTERS = 'ABCDEFGHIJKLMNOPRSTUW'

/** Split tiles into keyboard-style rows (3/4/3 for 10, 3/3/3 for 9, etc.) */
function splitIntoRows<T>(items: T[]): T[][] {
  const n = items.length
  if (n <= 3) return [items]
  if (n <= 4) return [items]
  if (n <= 7) {
    const half = Math.ceil(n / 2)
    return [items.slice(0, half), items.slice(half)]
  }
  // For 8+: use 3/middle/3 pattern
  const middle = n - 6
  return [
    items.slice(0, 3),
    items.slice(3, 3 + middle),
    items.slice(3 + middle),
  ]
}

export function PlayerHand() {
  const phase = useGameStore(s => s.gameState?.phase)
  const currentWord = useGameStore(s => s.gameState?.round.currentWord ?? '')
  const roundNumber = useGameStore(s => s.gameState?.round.roundNumber)
  const currentPlayerId = useGameStore(s => s.gameState?.round.currentPlayerId)
  const config = useGameStore(s => s.gameState?.config)
  const dispatch = useGameStore(s => s.dispatch)
  const hintUsed = useGameStore(s => s.gameState?.hintUsed ?? false)

  const gameMode = useMultiplayerStore(s => s.gameMode)
  const localPlayerId = useMultiplayerStore(s => s.localPlayerId)
  const role = useMultiplayerStore(s => s.role)

  // In multiplayer, the local player's data key depends on role
  const myId = gameMode === 'pvp' ? localPlayerId : 'human'
  const hand = useGameStore(s => s.gameState?.round.players[myId]?.hand ?? [])
  const myPlayer = useGameStore(s => s.gameState?.round.players[myId])

  const [stagedIndices, setStagedIndices] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)
  const [shaking, setShaking] = useState(false)

  // Tile scatter elimination animation state
  const [eliminating, setEliminating] = useState(false)
  const wasActive = useRef(true)
  const isActive = myPlayer?.isActive ?? true

  // AI/Opponent thinking animation state
  const [displayLetters, setDisplayLetters] = useState<string[]>(['?', '?', '?', '?'])

  // Tile entrance animation
  const [entered, setEntered] = useState(false)

  // Determine if it's my turn
  const isMyTurn = (phase === 'SETUP' && currentPlayerId === myId)
    || (phase === 'HUMAN_TURN' && myId === 'human')
    || (phase === 'AI_THINKING' && myId === 'ai')

  // In multiplayer, determine opponent's turn phase
  const isOpponentTurn = gameMode === 'pvp' && !isMyTurn && (phase === 'HUMAN_TURN' || phase === 'AI_THINKING' || (phase === 'SETUP' && currentPlayerId !== myId))

  // Reset staged tiles on phase/round change
  useEffect(() => {
    setStagedIndices([])
    setError(null)
    setEntered(false)
    const timer = setTimeout(() => setEntered(true), 50)
    return () => clearTimeout(timer)
  }, [roundNumber, phase])

  // Scatter animation when local player is eliminated
  useEffect(() => {
    if (wasActive.current && !isActive) {
      setEliminating(true)
      const timer = setTimeout(() => setEliminating(false), 800)
      return () => clearTimeout(timer)
    }
    wasActive.current = isActive
  }, [isActive])

  // Opponent thinking animation
  useEffect(() => {
    if (!isOpponentTurn && phase !== 'AI_THINKING') return
    if (gameMode === 'pvp' && !isOpponentTurn) return
    if (gameMode === 'ai' && phase !== 'AI_THINKING') return

    const tileCount = Math.max(3, currentWord.length + 1)
    setDisplayLetters(Array(Math.min(tileCount, 8)).fill('?'))

    const interval = setInterval(() => {
      setDisplayLetters(prev => prev.map(() =>
        LETTERS[Math.floor(Math.random() * LETTERS.length)]
      ))
    }, 80)
    return () => clearInterval(interval)
  }, [phase, currentWord.length, isOpponentTurn, gameMode])

  // Scatter style for elimination animation
  function scatterStyle(index: number): React.CSSProperties {
    if (!eliminating) return {}
    const angle = (index * 45 + Math.random() * 30) - 90
    const distance = 200 + Math.random() * 300
    const x = Math.cos(angle * Math.PI / 180) * distance
    const y = Math.sin(angle * Math.PI / 180) * distance - 200
    const rotation = (Math.random() - 0.5) * 720
    return {
      transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
      opacity: 0,
      transition: `all 0.6s ease-in ${index * 0.05}s`,
    }
  }

  // Tile entrance style
  function entranceStyle(index: number): React.CSSProperties {
    if (eliminating) return scatterStyle(index)
    return {
      opacity: entered ? 1 : 0,
      transform: entered ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.8)',
      transition: `all 0.3s ease-out ${index * 0.04}s`,
    }
  }

  // Tile interaction: uses INDEX tracking to handle duplicate letters
  function handleTileClick(handIndex: number) {
    setStagedIndices(prev => {
      const pos = prev.indexOf(handIndex)
      if (pos !== -1) {
        return [...prev.slice(0, pos), ...prev.slice(pos + 1)]
      } else {
        return [...prev, handIndex]
      }
    })
    setError(null)
  }

  function handleUnstage(stagingIndex: number) {
    setStagedIndices(prev => [
      ...prev.slice(0, stagingIndex),
      ...prev.slice(stagingIndex + 1),
    ])
    setError(null)
  }

  // During the player's turn (extending word), merge current word letters into selectable pool.
  // Community tiles use negative indices to distinguish from hand tiles.
  const showCommunityTiles = isMyTurn && phase !== 'SETUP'
  const communityTiles: { letter: string; idx: number; isCommunity: boolean }[] =
    showCommunityTiles
      ? currentWord.split('').map((letter, i) => ({ letter, idx: -(i + 1), isCommunity: true }))
      : []

  const allTiles = [
    ...communityTiles,
    ...hand.map((letter, idx) => ({ letter, idx, isCommunity: false })),
  ]

  // Derived values (computed during render)
  const stagedLetters = stagedIndices.map(i => {
    const tile = allTiles.find(t => t.idx === i)
    return tile?.letter ?? ''
  })

  function triggerShake(errorMessage: string) {
    setError(errorMessage)
    setShaking(true)
    setTimeout(() => setShaking(false), 500)
  }

  function dispatchAction(action: { type: 'SUBMIT_STARTING_WORD'; playerId: string; word: string } | { type: 'SUBMIT_WORD'; playerId: string; word: string }) {
    if (gameMode === 'pvp' && role === 'guest') {
      // Guest sends action to host
      sendRemoteAction(action)
    } else {
      // Host or AI mode: dispatch locally
      dispatch(action)
    }
  }

  function handleSubmit() {
    if (!config) return
    const word = stagedLetters.join('')

    if (phase === 'SETUP') {
      const result = validateStartingWord(word, hand, config.dictionary)
      if (!result.valid) {
        const messages: Record<string, string> = {
          not_a_word: 'Not a valid word',
          not_in_corpus: 'Starting word must be exactly 3 letters',
          letters_unavailable: "You don't have those letters",
        }
        triggerShake(messages[result.reason] ?? 'Invalid word')
        return
      }
      dispatchAction({ type: 'SUBMIT_STARTING_WORD', playerId: myId, word })
    } else if (isMyTurn) {
      const result = validateTurn(word, currentWord, hand, config.dictionary, {
        banPluralS: config.banPluralS,
      })
      if (!result.valid) {
        const messages: Record<string, string> = {
          not_a_word: 'Not a valid word',
          letter_not_in_hand: "You don't have those letters",
          not_a_superset: 'Must use all letters from the current word plus one new letter',
          plural_banned: 'Adding S to pluralize is not allowed',
        }
        triggerShake(messages[result.reason] ?? 'Invalid word')
        return
      }
      dispatchAction({ type: 'SUBMIT_WORD', playerId: myId, word })
    }
  }

  function handleGiveUp() {
    if (gameMode === 'pvp' && role === 'guest') {
      sendAction({ type: 'ELIMINATE_PLAYER', playerId: myId })
    } else {
      dispatch({ type: 'ELIMINATE_PLAYER', playerId: myId })
    }
  }

  function handleHint() {
    if (!config || hintUsed || !isMyTurn || phase === 'SETUP') return

    const vocab = getVocabulary(config.difficulty, config.dictionary)
    const shuffledArray = [...vocab.array]
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]]
    }

    const hintWord = findAIMove(currentWord, hand, shuffledArray, vocab.set, config)

    if (hintWord) {
      // Auto-stage the tiles for the hint word
      const hintLetters = hintWord.split('')
      const newStagedIndices: number[] = []
      const usedIndices = new Set<number>()

      for (const letter of hintLetters) {
        const tile = allTiles.find(t =>
          t.letter === letter && !usedIndices.has(t.idx)
        )
        if (tile) {
          newStagedIndices.push(tile.idx)
          usedIndices.add(tile.idx)
        }
      }

      setStagedIndices(newStagedIndices)
      if (gameMode === 'pvp' && role === 'guest') {
        sendAction({ type: 'USE_HINT' })
      } else {
        dispatch({ type: 'USE_HINT' })
      }
    } else {
      setError('No valid words found — you may need to give up')
    }
  }

  // Hide during ROUND_END or GAME_OVER
  if (phase === 'ROUND_END' || phase === 'GAME_OVER') {
    return null
  }

  // Opponent thinking animation (AI mode or PVP when it's opponent's turn)
  if ((gameMode === 'ai' && phase === 'AI_THINKING') || isOpponentTurn) {
    return (
      <div className="flex flex-col items-center gap-4">
        {/* Cycling letter tiles */}
        <div className="flex gap-1 justify-center">
          {displayLetters.map((letter, idx) => (
            <TileCard
              key={idx}
              letter={letter}
              color="red"
              size="md"
              disabled
            />
          ))}
        </div>

        {/* Player hand — visible but disabled during opponent's turn */}
        <div className="sm:hidden flex flex-col items-center gap-1 opacity-50">
          {splitIntoRows(hand.map((letter, idx) => ({ letter, idx }))).map((row, rowIdx) => (
            <div key={rowIdx} className="flex gap-1 justify-center">
              {row.map(({ letter, idx }) => (
                <div key={idx} style={scatterStyle(idx)}>
                  <TileCard letter={letter} color="concrete" size="md" disabled />
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="hidden sm:flex sm:flex-wrap gap-2 justify-center opacity-50">
          {hand.map((letter, idx) => (
            <div key={idx} style={scatterStyle(idx)}>
              <TileCard letter={letter} color="concrete" size="md" disabled />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Normal render: SETUP (my turn) or my active turn
  if (!isMyTurn) {
    return null
  }

  return (
    <div className="flex flex-col items-center w-full">
      <StagingArea
        stagedLetters={stagedLetters}
        stagedCommunity={stagedIndices.map(i => i < 0)}
        onRemoveTile={handleUnstage}
        onSubmit={handleSubmit}
        error={error}
        shaking={shaking}
        disabled={false}
        isSetup={phase === 'SETUP'}
      />

      {/* Selectable tiles — community (yellow) + hand (concrete) */}
      {/* Mobile: keyboard-style 3/4/3 rows. Desktop: flex wrap */}
      <div className="sm:hidden flex flex-col items-center gap-1 mt-4">
        {splitIntoRows(allTiles).map((row, rowIdx) => (
          <div key={rowIdx} className="flex gap-1 justify-center">
            {row.map(({ letter, idx, isCommunity }) => {
              const isStaged = stagedIndices.includes(idx)
              return (
                <div key={idx} style={entranceStyle(idx)}>
                  <TileCard
                    letter={letter}
                    color={isStaged ? 'concrete' : isCommunity ? 'yellow' : 'concrete'}
                    size="md"
                    onClick={() => handleTileClick(idx)}
                    disabled={isStaged}
                  />
                </div>
              )
            })}
          </div>
        ))}
      </div>
      <div className="hidden sm:flex sm:flex-wrap gap-2 justify-center mt-4">
        {allTiles.map(({ letter, idx, isCommunity }, i) => {
          const isStaged = stagedIndices.includes(idx)
          return (
            <div key={idx} style={entranceStyle(i)}>
              <TileCard
                letter={letter}
                color={isStaged ? 'concrete' : isCommunity ? 'yellow' : 'concrete'}
                size="md"
                onClick={() => handleTileClick(idx)}
                disabled={isStaged}
              />
            </div>
          )
        })}
      </div>

      {/* Action row: Hint + Give Up — only during active turn (not SETUP) */}
      {isMyTurn && phase !== 'SETUP' && (
        <div className="flex items-center gap-6 mt-4">
          {!hintUsed && (
            <button
              onClick={handleHint}
              className="text-corbusier-blue text-xs font-jost uppercase cursor-pointer hover:text-corbusier-blue/70 bg-transparent border border-corbusier-blue/30 rounded px-3 py-1 transition-colors"
            >
              Show a Word
            </button>
          )}
          <button
            onClick={handleGiveUp}
            className="text-charcoal/40 text-xs font-jost uppercase cursor-pointer hover:text-corbusier-red bg-transparent border-none transition-colors"
          >
            Give Up
          </button>
        </div>
      )}
    </div>
  )
}
