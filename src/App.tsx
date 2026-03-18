import { useAppStore } from './store/appSlice'
import { ConfigScreen } from './screens/ConfigScreen'
import { GameScreen } from './screens/GameScreen'

function App() {
  const screen = useAppStore((s) => s.screen)

  return (
    <div className="bg-concrete min-h-screen font-jost">
      {screen === 'config' ? <ConfigScreen /> : <GameScreen />}
    </div>
  )
}

export default App
