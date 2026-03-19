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
    expect(screen.getByText('Play vs AI')).toBeInTheDocument()
  })

  it('clicking "Play vs AI" switches to GameScreen', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByText('Play vs AI'))
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

  it('loading state uses min-h-svh viewport unit', () => {
    useDictionaryStore.setState({ words: new Set(), status: 'loading' })
    render(<App />)
    const text = screen.getByText('Loading dictionary...')
    const container = text.closest('div')
    expect(container).toHaveClass('min-h-svh')
    expect(container).not.toHaveClass('min-h-screen')
  })

  it('error state uses min-h-svh viewport unit', () => {
    useDictionaryStore.setState({ words: new Set(), status: 'error' })
    render(<App />)
    const text = screen.getByText('Failed to load dictionary.')
    const container = text.closest('div')
    expect(container).toHaveClass('min-h-svh')
    expect(container).not.toHaveClass('min-h-screen')
  })

  it('main wrapper uses min-h-dvh viewport unit', () => {
    useDictionaryStore.setState({ words: new Set(['test']), status: 'ready' })
    render(<App />)
    const text = screen.getByText('Word Chicken')
    // Walk up to find the wrapper div that has the min-h class
    let el: HTMLElement | null = text as HTMLElement
    let wrapper: HTMLElement | null = null
    while (el) {
      if (el.classList && (el.classList.contains('min-h-dvh') || el.classList.contains('min-h-screen'))) {
        wrapper = el
        break
      }
      el = el.parentElement
    }
    expect(wrapper).not.toBeNull()
    expect(wrapper).toHaveClass('min-h-dvh')
    expect(wrapper).not.toHaveClass('min-h-screen')
  })
})
