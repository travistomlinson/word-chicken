import { TileCard } from './TileCard'

interface StagingAreaProps {
  stagedLetters: string[]
  stagedCommunity?: boolean[]
  onRemoveTile: (index: number) => void
  onSubmit: () => void
  error: string | null
  shaking: boolean
  disabled: boolean
  isSetup: boolean
}

export function StagingArea({
  stagedLetters,
  stagedCommunity = [],
  onRemoveTile,
  onSubmit,
  error,
  shaking,
  disabled,
  isSetup,
}: StagingAreaProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* Staged tiles row */}
      <div className={[
        'flex gap-1 min-h-[52px] items-center justify-center flex-wrap px-4 py-1 rounded-xl',
        stagedLetters.length > 0 ? 'bg-ink/5' : '',
        shaking ? 'animate-shake' : '',
      ].filter(Boolean).join(' ')}>
        {stagedLetters.length === 0 && !disabled ? (
          <span className="text-ink-secondary text-sm font-jost italic">Tap tiles below</span>
        ) : (
          stagedLetters.map((letter, idx) => (
            <TileCard
              key={idx}
              letter={letter}
              color={stagedCommunity[idx] ? 'yellow' : 'blue'}
              size="md"
              onClick={() => onRemoveTile(idx)}
              disabled={disabled}
            />
          ))
        )}
      </div>

      {/* Error text */}
      {error !== null && (
        <p className="text-corbusier-red text-xs font-jost font-bold animate-fade-in">{error}</p>
      )}

      {/* Submit button */}
      <button
        onClick={onSubmit}
        disabled={stagedLetters.length === 0 || disabled}
        className="bg-corbusier-red text-white font-jost font-bold uppercase px-8 py-2.5 rounded-lg shadow-md shadow-corbusier-red/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 cursor-pointer"
      >
        {isSetup ? 'Start Round' : 'Submit Word'}
      </button>
    </div>
  )
}
