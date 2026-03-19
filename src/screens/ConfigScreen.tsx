import { useState } from 'react'
import { useAppStore } from '../store/appSlice'
import { useGameStore } from '../store/gameSlice'
import { useDictionaryStore } from '../store/dictionarySlice'
import { useMultiplayerStore } from '../store/multiplayerSlice'
import { HowToPlayModal } from '../components/HowToPlayModal'
import type { TileDistribution } from '../lib/tileBag'

type Difficulty = 'easy' | 'medium' | 'hard'

interface StoredConfig {
  difficulty: Difficulty
  banPluralS: boolean
  tileDistribution: TileDistribution
}

const STORAGE_KEY = 'word-chicken-config'

const DEFAULT_CONFIG: StoredConfig = {
  difficulty: 'medium',
  banPluralS: true,
  tileDistribution: 'bananagrams',
}

function loadConfig(): StoredConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_CONFIG
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_CONFIG
  }
}

function saveConfig(config: StoredConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch {
    // silently ignore storage errors
  }
}

const difficultyOptions: Array<{
  value: Difficulty
  label: string
  subtitle: string
  bg: string
}> = [
  { value: 'easy', label: 'Easy', subtitle: 'Common words', bg: 'bg-corbusier-blue' },
  { value: 'medium', label: 'Medium', subtitle: 'Broader vocabulary', bg: 'bg-corbusier-yellow' },
  { value: 'hard', label: 'Hard', subtitle: 'Full dictionary', bg: 'bg-corbusier-red' },
]

export function ConfigScreen() {
  const setScreen = useAppStore((s) => s.setScreen)
  const dispatch = useGameStore((s) => s.dispatch)
  const mpSetGameMode = useMultiplayerStore((s) => s.setGameMode)
  const mpSetRole = useMultiplayerStore((s) => s.setRole)

  const [config, setConfig] = useState<StoredConfig>(loadConfig)
  const [modalOpen, setModalOpen] = useState(false)

  function updateConfig(patch: Partial<StoredConfig>) {
    const next = { ...config, ...patch }
    setConfig(next)
    saveConfig(next)
  }

  function handleStartGame() {
    const dictionary = useDictionaryStore.getState().words
    mpSetGameMode('ai')
    mpSetRole(null)
    dispatch({
      type: 'START_GAME',
      config: {
        difficulty: config.difficulty,
        banPluralS: config.banPluralS,
        tileDistribution: config.tileDistribution,
        dictionary,
        gameMode: 'ai',
      },
    })
    setScreen('game')
  }

  function handlePlayFriend() {
    mpSetGameMode('pvp')
    setScreen('lobby')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-concrete via-concrete to-corbusier-blue/5 p-4">
      <div className="max-w-md mx-auto">
        {/* Title with accent bar */}
        <div className="mb-8 mt-8">
          <div className="w-12 h-1 bg-corbusier-red rounded-full mb-4" />
          <h1 className="font-jost font-bold uppercase tracking-widest text-charcoal text-4xl sm:text-5xl mb-2">
            Word Chicken
          </h1>
          <button
            onClick={() => setModalOpen(true)}
            className="text-corbusier-blue underline cursor-pointer text-sm font-jost uppercase hover:text-corbusier-blue/70 transition-colors"
          >
            How to Play
          </button>
        </div>

        {/* Difficulty */}
        <div className="mb-6">
          <p className="font-jost font-bold uppercase tracking-wider text-charcoal text-sm mb-3">
            Difficulty
          </p>
          <div className="flex flex-col gap-2">
            {difficultyOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateConfig({ difficulty: opt.value })}
                className={[
                  'w-full p-4 rounded-lg text-left transition-all duration-200',
                  opt.bg,
                  'text-white',
                  config.difficulty === opt.value
                    ? 'ring-2 ring-charcoal ring-offset-2 scale-[1.02] shadow-lg'
                    : 'opacity-60 hover:opacity-80',
                ].join(' ')}
              >
                <span className="font-jost font-bold uppercase block">{opt.label}</span>
                <span className="font-jost text-sm opacity-80">{opt.subtitle}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Rules */}
        <div className="mt-6 mb-3">
          <p className="font-jost font-bold uppercase tracking-wider text-charcoal text-sm mb-3">
            Rules
          </p>

          {/* Plurals toggle */}
          <div className="flex items-center justify-between mb-4 bg-white/60 rounded-lg p-3">
            <span className="font-jost text-charcoal text-sm">Allow plurals (adding S)</span>
            <button
              onClick={() => updateConfig({ banPluralS: !config.banPluralS })}
              className={[
                'w-12 h-6 rounded-full relative transition-colors cursor-pointer',
                !config.banPluralS ? 'bg-corbusier-blue' : 'bg-charcoal/30',
              ].join(' ')}
              aria-pressed={!config.banPluralS}
            >
              <span
                className={[
                  'absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm',
                  !config.banPluralS ? 'translate-x-6' : 'translate-x-0.5',
                ].join(' ')}
              />
            </button>
          </div>

          {/* Tile distribution */}
          <div className="flex gap-2">
            {(['bananagrams', 'scrabble'] as const).map((dist) => (
              <button
                key={dist}
                onClick={() => updateConfig({ tileDistribution: dist })}
                className={[
                  'px-4 py-2 rounded-lg font-jost text-sm font-bold uppercase transition-all duration-200 cursor-pointer',
                  config.tileDistribution === dist
                    ? 'bg-charcoal text-white shadow-md'
                    : 'bg-white text-charcoal border border-charcoal/10 hover:border-charcoal/30',
                ].join(' ')}
              >
                {dist}
              </button>
            ))}
          </div>
        </div>

        {/* Start Game buttons */}
        <button
          onClick={handleStartGame}
          className="w-full bg-corbusier-red text-white font-jost font-bold uppercase text-lg py-4 rounded-lg mt-8 shadow-lg shadow-corbusier-red/20 hover:shadow-xl hover:shadow-corbusier-red/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
        >
          Play vs AI
        </button>
        <button
          onClick={handlePlayFriend}
          className="w-full bg-corbusier-yellow text-white font-jost font-bold uppercase text-lg py-4 rounded-lg mt-3 shadow-lg shadow-corbusier-yellow/20 hover:shadow-xl hover:shadow-corbusier-yellow/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
        >
          Play a Friend
        </button>
      </div>

      <HowToPlayModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
