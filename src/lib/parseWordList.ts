export function parseWordList(text: string): Set<string> {
  return new Set(
    text.split('\n').map(w => w.trim().toLowerCase()).filter(Boolean)
  )
}
