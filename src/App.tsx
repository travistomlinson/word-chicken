import { useEffect } from 'react'
import { useAppStore } from './store/appSlice'
import { useDictionaryStore } from './store/dictionarySlice'
import { ConfigScreen } from './screens/ConfigScreen'
import { GameScreen } from './screens/GameScreen'
import { LobbyScreen } from './screens/LobbyScreen'

function App() {
  const screen = useAppStore((s) => s.screen)
  const { status, loadDictionary } = useDictionaryStore()

  useEffect(() => {
    loadDictionary()
  }, [loadDictionary])

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="bg-concrete min-h-screen font-jost flex items-center justify-center">
        <span className="text-charcoal">Loading dictionary...</span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="bg-concrete min-h-screen font-jost flex items-center justify-center">
        <span className="text-corbusier-red">Failed to load dictionary.</span>
      </div>
    )
  }

  return (
    <div className="bg-concrete min-h-screen font-jost">
      {screen === 'config' && <ConfigScreen />}
      {screen === 'lobby' && <LobbyScreen />}
      {screen === 'game' && <GameScreen />}
    </div>
  )
}

export default App
