import { useState, useEffect, useRef } from 'react'
import { useGameStore } from '../store/gameSlice'
import { validateTurn } from '../lib/wordValidator'
import { validateStartingWord } from '../lib/roundManager'
import { findAIMove, getVocabulary } from '../lib/aiEngine'
import { TileCard } from './TileCard'
import { StagingArea } from './StagingArea'
import type React from 'react'

const LETTERS = 'ABCDEFGHIJKLMNOPRSTUW'

export function PlayerHand() {
  const phase = useGameStore(s => s.gameState?.phase)
  const hand = useGameStore(s => s.gameState?.round.players['human']?.hand ?? [])
  const currentWord = useGameStore(s => s.gameState?.round.currentWord ?? '')
  const roundNumber = useGameStore(s => s.gameState?.round.roundNumber)
  const config = useGameStore(s => s.gameState?.config)
  const dispatch = useGameStore(s => s.dispatch)
  const humanPlayer = useGameStore(s => s.gameState?.round.players['human'])
  const hintUsed = useGameStore(s => s.gameState?.hintUsed ?? false)

  const [stagedIndices, setStagedIndices] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)
  const [shaking, setShaking] = useState(false)

  // Tile scatter elimination animation state
  const [eliminating, setEliminating] = useState(false)
  const wasActive = useRef(true)
  const isActive = humanPlayer?.isActive ?? true

  // AI thinking animation state
  const [displayLetters, setDisplayLetters] = useState<string[]>(['?', '?', '?', '?'])

  // Tile entrance animation
  const [entered, setEntered] = useState(false)

  // Reset staged tiles on phase/round change
  useEffect(() => {
    setStagedIndices([])
    setError(null)
    setEntered(false)
    const timer = setTimeout(() => setEntered(true), 50)
    return () => clearTimeout(timer)
  }, [roundNumber, phase])

  // Scatter animation when human player is eliminated
  useEffect(() => {
    if (wasActive.current && !isActive) {
      setEliminating(true)
      const timer = setTimeout(() => setEliminating(false), 800)
      return () => clearTimeout(timer)
    }
    wasActive.current = isActive
  }, [isActive])

  // AI thinking animation
  useEffect(() => {
    if (phase !== 'AI_THINKING') return
    const tileCount = Math.max(3, currentWord.length + 1)
    setDisplayLetters(Array(Math.min(tileCount, 8)).fill('?'))

    const interval = setInterval(() => {
      setDisplayLetters(prev => prev.map(() =>
        LETTERS[Math.floor(Math.random() * LETTERS.length)]
      ))
    }, 80)
    return () => clearInterval(interval)
  }, [phase, currentWord.length])

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

  // During HUMAN_TURN, merge current word letters (community tiles) into selectable pool.
  // Community tiles use negative indices to distinguish from hand tiles.
  const communityTiles: { letter: string; idx: number; isCommunity: boolean }[] =
    phase === 'HUMAN_TURN'
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
  const remainingTiles = allTiles.filter(({ idx }) => !stagedIndices.includes(idx))

  function triggerShake(errorMessage: string) {
    setError(errorMessage)
    setShaking(true)
    setTimeout(() => setShaking(false), 500)
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
      dispatch({ type: 'SUBMIT_STARTING_WORD', playerId: 'human', word })
    } else if (phase === 'HUMAN_TURN') {
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
      dispatch({ type: 'SUBMIT_WORD', playerId: 'human', word })
    }
  }

  function handleHint() {
    if (!config || hintUsed || phase !== 'HUMAN_TURN') return

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
      dispatch({ type: 'USE_HINT' })
    } else {
      setError('No valid words found — you may need to give up')
    }
  }

  // Hide during ROUND_END or GAME_OVER
  if (phase === 'ROUND_END' || phase === 'GAME_OVER') {
    return null
  }

  // AI thinking animation
  if (phase === 'AI_THINKING') {
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

        {/* Human hand — visible but disabled during AI turn */}
        <div className="grid grid-cols-5 sm:flex sm:flex-wrap gap-1 sm:gap-2 justify-center opacity-50">
          {hand.map((letter, idx) => (
            <div key={idx} style={scatterStyle(idx)}>
              <TileCard
                letter={letter}
                color="concrete"
                size="md"
                disabled
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Normal render: SETUP or HUMAN_TURN
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
      <div className="grid grid-cols-5 sm:flex sm:flex-wrap gap-1 sm:gap-2 justify-center mt-4">
        {remainingTiles.map(({ letter, idx, isCommunity }, i) => (
          <div key={idx} style={entranceStyle(i)}>
            <TileCard
              letter={letter}
              color={isCommunity ? 'yellow' : 'concrete'}
              size="md"
              onClick={() => handleTileClick(idx)}
            />
          </div>
        ))}
      </div>

      {/* Action row: Hint + Give Up — only during HUMAN_TURN */}
      {phase === 'HUMAN_TURN' && (
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
            onClick={() => dispatch({ type: 'ELIMINATE_PLAYER', playerId: 'human' })}
            className="text-charcoal/40 text-xs font-jost uppercase cursor-pointer hover:text-corbusier-red bg-transparent border-none transition-colors"
          >
            Give Up
          </button>
        </div>
      )}
    </div>
  )
}
