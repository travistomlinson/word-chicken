import { TileCard } from './TileCard'

interface SharedWordDisplayProps {
  word: string
}

function getTileSize(length: number): 'sm' | 'md' | 'lg' {
  if (length <= 7) return 'lg'
  if (length <= 11) return 'md'
  return 'sm'
}

export function SharedWordDisplay({ word }: SharedWordDisplayProps) {
  if (!word) {
    return (
      <div className="flex justify-center items-center py-4">
        <span className="text-ink/40 font-jost italic text-sm">Waiting for starting word...</span>
      </div>
    )
  }

  const letters = word.split('')
  const size = getTileSize(letters.length)

  return (
    <div className="flex gap-1 sm:gap-2 justify-center items-center flex-wrap py-3 px-4 bg-corbusier-yellow/10 rounded-xl">
      {letters.map((letter, index) => (
        <TileCard
          key={index}
          letter={letter}
          size={size}
          color="yellow"
          disabled
        />
      ))}
    </div>
  )
}
