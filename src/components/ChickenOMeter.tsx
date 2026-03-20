interface ChickenOMeterProps {
  wordLength: number
}

function tensionPercent(len: number): number {
  return Math.min(100, (len / 15) * 100)
}

export function ChickenOMeter({ wordLength }: ChickenOMeterProps) {
  const fillPercent = tensionPercent(wordLength)
  const maskHeight = 100 - fillPercent
  const isHot = fillPercent > 66

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={[
          'relative h-48 sm:h-64 w-5 rounded-full overflow-hidden gradient-tension',
          isHot ? 'animate-pulse' : '',
        ].join(' ')}
        aria-label={`Tension meter: ${Math.round(fillPercent)}%`}
      >
        <div
          className="absolute top-0 left-0 right-0 bg-surface/90 transition-all duration-500 ease-out"
          style={{ height: `${maskHeight}%` }}
        />
      </div>
      <span className="text-[10px] font-jost uppercase tracking-wider text-ink-secondary">
        {wordLength}
      </span>
    </div>
  )
}
