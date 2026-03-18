import { useState, useEffect, useRef } from 'react'
import { useGameStore } from '../store/gameSlice'
import { validateTurn } from '../lib/wordValidator'
import { validateStartingWord } from '../lib/roundManager'
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

  const [stagedIndices, setStagedIndices] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)
  const [shaking, setShaking] = useState(false)

  // Tile scatter elimination animation state
  const [eliminating, setEliminating] = useState(false)
  const wasActive = useRef(true)
  const isActive = humanPlayer?.isActive ?? true

  // AI thinking animation state
  const [displayLetters, setDisplayLetters] = useState<string[]>(['?', '?', '?', '?'])

  // Reset staged tiles on phase/round change (pitfall 4 from RESEARCH)
  useEffect(() => {
    setStagedIndices([])
    setError(null)
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
    const angle = (index * 45 + Math.random() * 30) - 90  // spread in arc
    const distance = 200 + Math.random() * 300
    const x = Math.cos(angle * Math.PI / 180) * distance
    const y = Math.sin(angle * Math.PI / 180) * distance - 200  // bias upward then fall
    const rotation = (Math.random() - 0.5) * 720
    return {
      transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
      opacity: 0,
      transition: `all 0.6s ease-in ${index * 0.05}s`,  // stagger each tile
    }
  }

  // Tile interaction: uses INDEX tracking to handle duplicate letters
  function handleTileClick(handIndex: number) {
    setStagedIndices(prev => {
      const pos = prev.indexOf(handIndex)
      if (pos !== -1) {
        // Already staged — remove it
        return [...prev.slice(0, pos), ...prev.slice(pos + 1)]
      } else {
        // Not staged — add it
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

  // Derived values (computed during render)
  const stagedLetters = stagedIndices.map(i => hand[i])
  const remainingHand = hand
    .map((letter, idx) => ({ letter, idx }))
    .filter(({ idx }) => !stagedIndices.includes(idx))

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
          not_in_corpus: 'Not a valid starting word (use a common 3-letter word)',
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
        onRemoveTile={handleUnstage}
        onSubmit={handleSubmit}
        error={error}
        shaking={shaking}
        disabled={false}
        isSetup={phase === 'SETUP'}
      />

      {/* Hand tiles — only unstaged tiles shown */}
      <div className="grid grid-cols-5 sm:flex sm:flex-wrap gap-1 sm:gap-2 justify-center mt-4">
        {remainingHand.map(({ letter, idx }) => (
          <div key={idx} style={scatterStyle(idx)}>
            <TileCard
              letter={letter}
              color="concrete"
              size="md"
              onClick={() => handleTileClick(idx)}
            />
          </div>
        ))}
      </div>

      {/* Give Up link — only during HUMAN_TURN */}
      {phase === 'HUMAN_TURN' && (
        <button
          onClick={() => dispatch({ type: 'ELIMINATE_PLAYER', playerId: 'human' })}
          className="text-charcoal/40 text-xs font-jost uppercase cursor-pointer hover:text-corbusier-red mt-4 bg-transparent border-none"
        >
          Give Up
        </button>
      )}
    </div>
  )
}
