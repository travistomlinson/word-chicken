interface TileCardProps {
  letter: string
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  color?: 'red' | 'blue' | 'yellow' | 'concrete'
  disabled?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
}

const colorClasses = {
  red: 'bg-corbusier-red text-white',
  blue: 'bg-corbusier-blue text-white',
  yellow: 'bg-corbusier-yellow text-white',
  concrete: 'bg-concrete text-charcoal border border-charcoal/20',
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
        'font-jost font-bold uppercase flex items-center justify-center rounded select-none',
        'min-w-[44px] min-h-[44px]',
        sizeClasses[size],
        colorClasses[color],
        disabled ? 'opacity-50 cursor-not-allowed' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {display}
    </button>
  )
}
