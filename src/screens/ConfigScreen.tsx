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
  const darkMode = useAppStore((s) => s.darkMode)
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode)
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
    <div className="min-h-dvh bg-gradient-to-br from-surface via-surface to-corbusier-blue/5 px-4 pt-4 pb-safe">
      <div className="max-w-md mx-auto">
        {/* Dark mode toggle */}
        <div className="flex justify-end pt-2">
          <button
            onClick={toggleDarkMode}
            className="text-ink/50 hover:text-ink transition-colors cursor-pointer p-2"
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </button>
        </div>

        {/* Title with accent bar */}
        <div className="mb-8 mt-2">
          <div className="w-12 h-1 bg-corbusier-red rounded-full mb-4" />
          <h1 className="font-jost font-bold uppercase tracking-widest text-ink text-4xl sm:text-5xl mb-2">
            Word Chicken
          </h1>
          <button
            onClick={() => setModalOpen(true)}
            className="text-corbusier-blue underline cursor-pointer text-sm font-jost uppercase hover:text-corbusier-blue/70 transition-colors min-h-[44px] flex items-center"
          >
            How to Play
          </button>
        </div>

        {/* Difficulty */}
        <div className="mb-6">
          <p className="font-jost font-bold uppercase tracking-wider text-ink text-sm mb-3">
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
                    ? 'ring-2 ring-ink ring-offset-2 ring-offset-surface scale-[1.02] shadow-lg'
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
          <p className="font-jost font-bold uppercase tracking-wider text-ink text-sm mb-3">
            Rules
          </p>

          {/* Plurals toggle */}
          <div className="flex items-center justify-between mb-4 bg-card/60 rounded-lg p-3">
            <span className="font-jost text-ink text-sm">Allow plurals (adding S)</span>
            <button
              onClick={() => updateConfig({ banPluralS: !config.banPluralS })}
              className={[
                'w-12 h-6 rounded-full relative transition-colors cursor-pointer',
                !config.banPluralS ? 'bg-corbusier-blue' : 'bg-ink/30',
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
                    ? 'bg-ink text-surface shadow-md'
                    : 'bg-card text-ink border border-ink/10 hover:border-ink/30',
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
