import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { useAppStore } from '../store/appSlice'

describe('App', () => {
  beforeEach(() => {
    useAppStore.setState({ screen: 'config' })
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
    expect(screen.getByText('Game Screen')).toBeInTheDocument()
    expect(screen.getByText('Back to Config')).toBeInTheDocument()
  })
})
