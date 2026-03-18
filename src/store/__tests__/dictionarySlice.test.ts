import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useDictionaryStore } from '../dictionarySlice'

describe('dictionarySlice', () => {
  beforeEach(() => {
    useDictionaryStore.setState({ words: new Set(), status: 'idle' })
    vi.restoreAllMocks()
  })

  it('initial state has status "idle" and empty words Set', () => {
    const { words, status } = useDictionaryStore.getState()
    expect(status).toBe('idle')
    expect(words).toBeInstanceOf(Set)
    expect(words.size).toBe(0)
  })

  it('loadDictionary transitions status from idle to loading to ready', async () => {
    const mockText = 'cat\ndog\nbird\n'
    const mockResponse = {
      ok: true,
      text: vi.fn().mockResolvedValue(mockText),
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))

    const { loadDictionary } = useDictionaryStore.getState()
    await loadDictionary()

    const { status } = useDictionaryStore.getState()
    expect(status).toBe('ready')
  })

  it('loadDictionary populates words via parseWordList', async () => {
    const mockText = 'cat\ndog\nbird\n'
    const mockResponse = {
      ok: true,
      text: vi.fn().mockResolvedValue(mockText),
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse))

    const { loadDictionary } = useDictionaryStore.getState()
    await loadDictionary()

    const { words } = useDictionaryStore.getState()
    expect(words.size).toBe(3)
    expect(words.has('cat')).toBe(true)
    expect(words.has('dog')).toBe(true)
    expect(words.has('bird')).toBe(true)
  })

  it('calling loadDictionary twice only fetches once (guard on status !== "idle")', async () => {
    const mockText = 'cat\ndog\n'
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(mockText),
    })
    vi.stubGlobal('fetch', mockFetch)

    const { loadDictionary } = useDictionaryStore.getState()
    await loadDictionary()
    await loadDictionary()

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('fetch failure sets status to "error"', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

    const { loadDictionary } = useDictionaryStore.getState()
    await loadDictionary()

    const { status } = useDictionaryStore.getState()
    expect(status).toBe('error')
  })
})
