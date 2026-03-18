import { create } from 'zustand'
import { parseWordList } from '../lib/parseWordList'

type DictionaryStatus = 'idle' | 'loading' | 'ready' | 'error'

interface DictionaryState {
  words: Set<string>
  status: DictionaryStatus
  loadDictionary: () => Promise<void>
}

export const useDictionaryStore = create<DictionaryState>()((set, get) => ({
  words: new Set(),
  status: 'idle',
  loadDictionary: async () => {
    if (get().status !== 'idle') return
    set({ status: 'loading' })
    try {
      const res = await fetch('/TWL06.txt')
      if (!res.ok) throw new Error(`Failed to fetch dictionary: ${res.status}`)
      const text = await res.text()
      const words = parseWordList(text)
      set({ words, status: 'ready' })
    } catch {
      set({ status: 'error' })
    }
  },
}))
