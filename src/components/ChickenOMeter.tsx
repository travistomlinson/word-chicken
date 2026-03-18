interface ChickenOMeterProps {
  wordLength: number
}

function tensionPercent(len: number): number {
  return Math.min(100, (len / 15) * 100)
}

export function ChickenOMeter({ wordLength }: ChickenOMeterProps) {
  const fillPercent = tensionPercent(wordLength)
  const maskHeight = 100 - fillPercent

  return (
    <div
      className="relative h-48 sm:h-64 w-4 rounded overflow-hidden"
      style={{ background: 'linear-gradient(to top, #003f91, #f5a623, #d0021b)' }}
      aria-label={`Tension meter: ${Math.round(fillPercent)}%`}
    >
      <div
        className="absolute top-0 left-0 right-0 bg-concrete transition-all duration-300 ease-out"
        style={{ height: `${maskHeight}%` }}
      />
    </div>
  )
}
