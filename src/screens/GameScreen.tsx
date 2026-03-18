import { useAppStore } from '../store/appSlice'

export function GameScreen() {
  const setScreen = useAppStore((s) => s.setScreen)

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="font-jost font-bold uppercase tracking-widest text-charcoal text-5xl mb-12">
        Game Screen
      </h1>
      <button
        onClick={() => setScreen('config')}
        className="bg-corbusier-blue text-white font-jost font-bold uppercase px-8 py-3 text-lg"
      >
        Back to Config
      </button>
    </div>
  )
}
