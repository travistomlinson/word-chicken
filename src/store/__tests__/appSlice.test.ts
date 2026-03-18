import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '../appSlice'

describe('appSlice', () => {
  beforeEach(() => {
    useAppStore.setState({ screen: 'config' })
  })

  it('defaults to screen "config"', () => {
    const { screen } = useAppStore.getState()
    expect(screen).toBe('config')
  })

  it('setScreen("game") changes screen to "game"', () => {
    const { setScreen } = useAppStore.getState()
    setScreen('game')
    expect(useAppStore.getState().screen).toBe('game')
  })

  it('setScreen("config") returns to config', () => {
    const { setScreen } = useAppStore.getState()
    setScreen('game')
    setScreen('config')
    expect(useAppStore.getState().screen).toBe('config')
  })
})
