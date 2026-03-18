import { useAppStore } from '../store/appSlice'

export function ConfigScreen() {
  const setScreen = useAppStore((s) => s.setScreen)

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="font-jost font-bold uppercase tracking-widest text-charcoal text-5xl mb-12">
        Word Chicken
      </h1>
      <button
        onClick={() => setScreen('game')}
        className="bg-corbusier-red text-white font-jost font-bold uppercase px-8 py-3 text-lg"
      >
        Start Game
      </button>
    </div>
  )
}
