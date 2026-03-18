import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { useAppStore } from '../store/appSlice'
import { useDictionaryStore } from '../store/dictionarySlice'

describe('App', () => {
  beforeEach(() => {
    useAppStore.setState({ screen: 'config' })
    // Set dictionary to ready so screens render (avoids needing to fetch in unit tests)
    useDictionaryStore.setState({
      words: new Set(['test']),
      status: 'ready',
    })
  })

  it('renders ConfigScreen by default', () => {
    render(<App />)
    expect(screen.getByText('Word Chicken')).toBeInTheDocument()
    expect(screen.getByText('Start Game')).toBeInTheDocument()
  })

  it('clicking "Start Game" switches to GameScreen', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByText('Start Game'))
    // GameScreen renders with SETUP phase — shows turn indicator and quit button
    expect(screen.getByText('Choose a starting word')).toBeInTheDocument()
    expect(screen.getByText('Quit')).toBeInTheDocument()
  })

  it('shows loading state when dictionary status is loading', () => {
    useDictionaryStore.setState({ words: new Set(), status: 'loading' })
    render(<App />)
    expect(screen.getByText('Loading dictionary...')).toBeInTheDocument()
  })

  it('shows loading state when dictionary status is idle', () => {
    useDictionaryStore.setState({ words: new Set(), status: 'idle' })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: vi.fn().mockResolvedValue('') }))
    render(<App />)
    expect(screen.getByText('Loading dictionary...')).toBeInTheDocument()
    vi.unstubAllGlobals()
  })

  it('shows error state when dictionary status is error', () => {
    useDictionaryStore.setState({ words: new Set(), status: 'error' })
    render(<App />)
    expect(screen.getByText('Failed to load dictionary.')).toBeInTheDocument()
  })
})
