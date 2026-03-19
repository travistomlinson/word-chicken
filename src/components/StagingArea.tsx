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
    <div className="flex flex-col items-center gap-2">
      {/* Staged tiles row */}
      <div className={[
        'flex gap-1 min-h-[48px] items-center justify-center flex-wrap',
        shaking ? 'animate-shake' : '',
      ].filter(Boolean).join(' ')}>
        {stagedLetters.length === 0 && !disabled ? (
          <span className="text-charcoal/30 text-sm font-jost italic">Tap tiles below</span>
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
        <p className="text-corbusier-red text-xs font-jost mt-1">{error}</p>
      )}

      {/* Submit button */}
      <button
        onClick={onSubmit}
        disabled={stagedLetters.length === 0 || disabled}
        className="bg-corbusier-red text-white font-jost font-bold uppercase px-6 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSetup ? 'Start Round' : 'Submit Word'}
      </button>
    </div>
  )
}
