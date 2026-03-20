interface TileCardProps {
  letter: string
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  color?: 'red' | 'blue' | 'yellow' | 'concrete' | 'staged'
  disabled?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
}

const colorClasses = {
  red: 'bg-corbusier-red text-white shadow-md shadow-corbusier-red/30',
  blue: 'bg-corbusier-blue text-white shadow-md shadow-corbusier-blue/30',
  yellow: 'bg-corbusier-yellow text-charcoal shadow-md shadow-corbusier-yellow/30',
  concrete: 'bg-card text-ink border border-ink/10 shadow-sm',
  staged: 'bg-ink/15 text-ink-secondary border-2 border-dashed border-ink/40 shadow-none',
}

export function TileCard({
  letter,
  size = 'md',
  onClick,
  color = 'concrete',
  disabled = false,
  className = '',
}: TileCardProps) {
  const display = letter === 'Q' ? 'Qu' : letter

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        'font-jost font-bold uppercase flex items-center justify-center rounded-lg select-none transition-all duration-150',
        'min-w-[44px] min-h-[44px]',
        sizeClasses[size],
        colorClasses[color],
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:scale-110 hover:-translate-y-0.5 active:scale-95 cursor-pointer',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {display}
    </button>
  )
}
