interface HowToPlayModalProps {
  isOpen: boolean
  onClose: () => void
}

const rules = [
  'Each round starts with a 3-letter word',
  'Take turns adding one letter to grow the word',
  'Rearranging letters is allowed (CAT + R = CART)',
  "If you can't make a word, you're eliminated",
  'Last player standing wins the round',
  'Q counts as "Qu" and uses one tile',
]

export function HowToPlayModal({ isOpen, onClose }: HowToPlayModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card max-w-md w-full mx-4 p-6 rounded">
        <h2 className="font-jost font-bold uppercase tracking-widest text-2xl mb-4">
          How to Play
        </h2>
        <ol className="list-decimal list-inside space-y-2 mb-6 font-jost text-ink">
          {rules.map((rule, i) => (
            <li key={i}>{rule}</li>
          ))}
        </ol>
        <button
          onClick={onClose}
          className="bg-corbusier-blue text-white font-jost font-bold uppercase px-6 py-2 rounded"
        >
          Got It
        </button>
      </div>
    </div>
  )
}
